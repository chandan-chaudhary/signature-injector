import mongoose, { Schema, Document } from "mongoose";

export interface IPdfRecord extends Document {
  originalPdfId?: string;
  signedUrl: string;
  coordinates: any;
  originalPdfHash: string; // SHA-256 hash of original PDF
  signedPdfHash: string; // SHA-256 hash of signed PDF
  signedAt: Date; // Timestamp when document was signed
  createdAt: Date;
}

const PdfRecordSchema: Schema = new Schema<IPdfRecord>({
  originalPdfId: { type: String },
  signedUrl: { type: String, required: true },
  coordinates: { type: Schema.Types.Mixed },
  originalPdfHash: { type: String, required: true },
  signedPdfHash: { type: String, required: true },
  signedAt: { type: Date, required: true },
  createdAt: { type: Date, default: () => new Date() },
});

export const PdfRecord =
  mongoose.models.PdfRecord ||
  mongoose.model<IPdfRecord>("PdfRecord", PdfRecordSchema);
