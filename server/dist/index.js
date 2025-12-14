import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { PDFDocument } from "pdf-lib";
import mongoose from "mongoose";
import { PdfRecord } from "./models/PdfRecord.js";
import { calculateSHA256 } from "./utils/crypto.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/signatures";
// Enable CORS for all origins
app.use(cors());
app.use(express.json({ limit: "25mb" }));
const serverRoot = path.resolve(__dirname, "..");
// serverRoot points to the `server` folder when running from `src` or `dist`
const inputDir = path.join(serverRoot, "input");
const outDir = path.join(serverRoot, "signed");
if (!fs.existsSync(inputDir))
    fs.mkdirSync(inputDir, { recursive: true });
if (!fs.existsSync(outDir))
    fs.mkdirSync(outDir, { recursive: true });
// static serve signed files
app.use("/signed", express.static(outDir));
async function connectDb() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");
}
connectDb().catch((err) => {
    console.error("Mongo connect error", err);
});
app.post("/sign-pdf", async (req, res) => {
    try {
        const { pdfBase64, signatureBase64, coordinates } = req.body;
        if (!pdfBase64 || !signatureBase64 || !coordinates) {
            return res.status(400).json({
                error: "pdfBase64, signatureBase64 and coordinates are required",
            });
        }
        const { page = 1, x, y, width, height, pageRenderWidth, pageRenderHeight, } = coordinates;
        if ([x, y, width, height, pageRenderWidth, pageRenderHeight].some((v) => v === undefined)) {
            return res.status(400).json({
                error: "coordinates must include x,y,width,height,pageRenderWidth,pageRenderHeight",
            });
        }
        // Parse PDF base64 (handle data URI or raw base64)
        let rawPdfBase64 = pdfBase64;
        const pdfDataUriMatch = pdfBase64.match(/^data:application\/pdf;base64,(.*)$/);
        if (pdfDataUriMatch) {
            rawPdfBase64 = pdfDataUriMatch[1];
        }
        const pdfBytes = Buffer.from(rawPdfBase64, "base64");
        // Security Layer: Calculate SHA-256 hash of ORIGINAL PDF
        const originalPdfHash = calculateSHA256(pdfBytes);
        console.log("Original PDF Hash:", originalPdfHash);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        console.log(pdfDoc);
        // parse base64
        let rawBase64 = signatureBase64;
        let imageType = "png";
        const dataUriMatch = signatureBase64.match(/^data:(image\/(png|jpeg|jpg));base64,(.*)$/);
        if (dataUriMatch) {
            imageType = dataUriMatch[2] === "jpeg" ? "jpeg" : dataUriMatch[2];
            rawBase64 = dataUriMatch[3];
        }
        else if (signatureBase64.startsWith("/9j/")) {
            imageType = "jpeg";
        }
        const imageBytes = Buffer.from(rawBase64, "base64");
        const embeddedImage = imageType === "jpeg" || imageType === "jpg"
            ? await pdfDoc.embedJpg(imageBytes)
            : await pdfDoc.embedPng(imageBytes);
        const imgDims = embeddedImage.scale(1);
        const imgWidthPx = imgDims.width;
        const imgHeightPx = imgDims.height;
        const targetPageIndex = Math.max(0, Math.min(pdfDoc.getPageCount() - 1, page - 1));
        const pdfPage = pdfDoc.getPage(targetPageIndex);
        const { width: pdfPageWidth, height: pdfPageHeight } = pdfPage.getSize();
        const boxX = (x / pageRenderWidth) * pdfPageWidth;
        const boxYTop = (y / pageRenderHeight) * pdfPageHeight;
        const boxWidthPdf = (width / pageRenderWidth) * pdfPageWidth;
        const boxHeightPdf = (height / pageRenderHeight) * pdfPageHeight;
        const boxY = pdfPageHeight - boxYTop - boxHeightPdf;
        const scale = Math.min(boxWidthPdf / imgWidthPx, boxHeightPdf / imgHeightPx, 1);
        const drawWidth = imgWidthPx * scale;
        const drawHeight = imgHeightPx * scale;
        const drawX = boxX + (boxWidthPdf - drawWidth) / 2;
        const drawY = boxY + (boxHeightPdf - drawHeight) / 2;
        pdfPage.drawImage(embeddedImage, {
            x: drawX,
            y: drawY,
            width: drawWidth,
            height: drawHeight,
        });
        const signedPdfBytes = await pdfDoc.save();
        // Security Layer: Calculate SHA-256 hash of SIGNED PDF
        const signedPdfHash = calculateSHA256(Buffer.from(signedPdfBytes));
        console.log("Signed PDF Hash:", signedPdfHash);
        const filename = `signed-${Date.now()}.pdf`;
        const outPath = path.join(outDir, filename);
        fs.writeFileSync(outPath, signedPdfBytes);
        const baseUrl = process.env.SERVER_BASE_URL || `http://localhost:${PORT}`;
        const fileUrl = `${baseUrl}/signed/${filename}`;
        // store record in DB with audit trail (both hashes + timestamp)
        const signedAt = new Date();
        const record = await PdfRecord.create({
            originalPdfId: filename,
            signedUrl: fileUrl,
            coordinates,
            originalPdfHash, // SHA-256 of original PDF
            signedPdfHash, // SHA-256 of signed PDF
            signedAt, // Timestamp of signing
        });
        return res.json({
            url: fileUrl,
            id: record._id,
            auditTrail: {
                originalPdfHash,
                signedPdfHash,
                signedAt,
            },
        });
    }
    catch (err) {
        console.error("Error in /sign-pdf", err);
        return res
            .status(500)
            .json({ error: "internal_error", details: err?.message || String(err) });
    }
});
app.get("/records", async (req, res) => {
    const records = await PdfRecord.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
    res.json(records);
});
app.post("/verify-document", async (req, res) => {
    try {
        const { recordId, pdfBase64 } = req.body;
        if (!recordId || !pdfBase64) {
            return res.status(400).json({
                error: "recordId and pdfBase64 are required",
            });
        }
        // Find the record in database
        const record = await PdfRecord.findById(recordId);
        if (!record) {
            return res.status(404).json({
                error: "Record not found",
            });
        }
        // Parse PDF base64
        let rawPdfBase64 = pdfBase64;
        const pdfDataUriMatch = pdfBase64.match(/^data:application\/pdf;base64,(.*)$/);
        if (pdfDataUriMatch) {
            rawPdfBase64 = pdfDataUriMatch[1];
        }
        const pdfBytes = Buffer.from(rawPdfBase64, "base64");
        const calculatedHash = calculateSHA256(pdfBytes);
        // Check if it matches either original or signed hash
        const isOriginal = calculatedHash === record.originalPdfHash;
        const isSigned = calculatedHash === record.signedPdfHash;
        if (isOriginal) {
            return res.json({
                verified: true,
                documentType: "original",
                message: "This is the original unsigned document",
                hash: calculatedHash,
                storedHash: record.originalPdfHash,
                recordId: record._id,
            });
        }
        else if (isSigned) {
            return res.json({
                verified: true,
                documentType: "signed",
                message: "This is the signed document",
                hash: calculatedHash,
                storedHash: record.signedPdfHash,
                recordId: record._id,
                signedAt: record.signedAt,
            });
        }
        else {
            return res.json({
                verified: false,
                message: "Document hash does not match any record - document may have been tampered with",
                hash: calculatedHash,
                expectedOriginalHash: record.originalPdfHash,
                expectedSignedHash: record.signedPdfHash,
            });
        }
    }
    catch (err) {
        console.error("Error in /verify-document", err);
        return res.status(500).json({
            error: "internal_error",
            details: err?.message || String(err),
        });
    }
});
/**
 * Get audit trail for a specific record
 * GET /audit-trail/:recordId
 */
app.get("/audit-trail/:recordId", async (req, res) => {
    try {
        const { recordId } = req.params;
        const record = await PdfRecord.findById(recordId);
        if (!record) {
            return res.status(404).json({ error: "Record not found" });
        }
        return res.json({
            recordId: record._id,
            originalPdfHash: record.originalPdfHash,
            signedPdfHash: record.signedPdfHash,
            signedAt: record.signedAt,
            createdAt: record.createdAt,
            signedUrl: record.signedUrl,
            coordinates: record.coordinates,
        });
    }
    catch (err) {
        console.error("Error in /audit-trail", err);
        return res.status(500).json({
            error: "internal_error",
            details: err?.message || String(err),
        });
    }
});
app.listen(PORT, () => {
    console.log(`Signature burn-in server running on http://localhost:${PORT}`);
});
