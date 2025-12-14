import mongoose, { Schema } from "mongoose";
const PdfRecordSchema = new Schema({
    originalPdfId: { type: String },
    signedUrl: { type: String, required: true },
    coordinates: { type: Schema.Types.Mixed },
    originalPdfHash: { type: String, required: true },
    signedPdfHash: { type: String, required: true },
    signedAt: { type: Date, required: true },
    createdAt: { type: Date, default: () => new Date() },
});
export const PdfRecord = mongoose.models.PdfRecord ||
    mongoose.model("PdfRecord", PdfRecordSchema);
