import mongoose, { Schema, Document } from "mongoose";

export interface IPdfRecord extends Document {
  originalPdfId?: string;
  signedUrl: string;
  coordinates: any;
  createdAt: Date;
}

const PdfRecordSchema: Schema = new Schema<IPdfRecord>({
  originalPdfId: { type: String },
  signedUrl: { type: String, required: true },
  coordinates: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: () => new Date() },
});

export const PdfRecord =
  mongoose.models.PdfRecord ||
  mongoose.model<IPdfRecord>("PdfRecord", PdfRecordSchema);
