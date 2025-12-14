import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { PDFDocument } from "pdf-lib";
import mongoose from "mongoose";
import { PdfRecord } from "./models/PdfRecord.js";
// ES module equivalents of __dirname and __filename
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
/**
 * Expected payload (JSON):
 * {
  "pdfId": "sample-pdf",
  "fields": [
    {
      "id": "field-1765638067868-hq7v1gdnb",
      "type": "signature",
      "pdfCoordinates": {
        "x": 315.49839999999995,
        "y": 18.708666666666574,
        "width": 148.82,
        "height": 48.80521739130435
      },
      "normalizedCoordinates": {
        "xPercent": 53,
        "yPercent": 91.98067632850243,
        "widthPercent": 25,
        "heightPercent": 5.797101449275362
      },
      "imageData": "data:image/png;base64,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",
      "pageNumber": 1
    }
  ],
  "containerDimensions": {
    "width": 800,
    "height": 1035
  }
}

??>
 * {
 *   pdfId: string (ignored in this simple server - pass a streamed/uploaded PDF id in a fuller implementation),
 *   signatureBase64: string (data URI or raw base64),
 *   coordinates: {
 *     page: number, // 1-based
 *     x: number, // pixels from top-left of rendered page
 *     y: number, // pixels from top-left of rendered page
 *     width: number, // pixels box width
 *     height: number, // pixels box height
 *     pageRenderWidth: number, // rendered page pixel width (required)
 *     pageRenderHeight: number // rendered page pixel height (required)
 *   }
 * }
 */
app.post("/sign-pdf", async (req, res) => {
    try {
        const { pdfBase64, signatureBase64, coordinates } = req.body;
        if (!pdfBase64 || !signatureBase64 || !coordinates) {
            return res
                .status(400)
                .json({ error: "pdfBase64, signatureBase64 and coordinates are required" });
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
        const filename = `signed-${Date.now()}.pdf`;
        const outPath = path.join(outDir, filename);
        fs.writeFileSync(outPath, signedPdfBytes);
        const baseUrl = process.env.SERVER_BASE_URL || `http://localhost:${PORT}`;
        const fileUrl = `${baseUrl}/signed/${filename}`;
        // store record in DB
        const record = await PdfRecord.create({
            originalPdfId: filename,
            signedUrl: fileUrl,
            coordinates,
        });
        return res.json({ url: fileUrl, id: record._id });
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
app.listen(PORT, () => {
    console.log(`Signature burn-in server running on http://localhost:${PORT}`);
});
