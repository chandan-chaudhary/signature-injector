import { Button } from "@/components/ui/button";
import { EditorField } from "@/types/editor";
import { generateFieldPayload, FieldPayload } from "@/lib/coordinateUtils";
import { Download, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ExportPanelProps {
  fields: EditorField[];
  containerDimensions: { width: number; height: number } | null;
  pdfId?: string;
  pdfBase64?: string | null;
}

export function ExportPanel({
  fields,
  containerDimensions,
  pdfId = "sample-pdf",
  pdfBase64,
}: ExportPanelProps) {
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState<Record<string, unknown>>({});

  const generatePayload = (): FieldPayload[] => {
    if (!containerDimensions) return [];

    return fields.map((field) =>
      generateFieldPayload(
        field.id,
        field.type,
        { x: field.x, y: field.y, width: field.width, height: field.height },
        containerDimensions.width,
        containerDimensions.height,
        field.pageNumber,
        field.value,
        field.imageData
      )
    );
  };

  const getBackendPayload = () => {
    const payload = {
      pdfId,
      fields: generatePayload(),
      containerDimensions,
    };
    return JSON.stringify(payload, null, 2);
  };

  const buildSignaturePayloads = (): Array<{
    pdfId: string;
    signatureBase64: string | undefined;
    coordinates: {
      page: number;
      x: number;
      y: number;
      width: number;
      height: number;
      pageRenderWidth: number;
      pageRenderHeight: number;
    };
  }> => {
    if (!containerDimensions) return [];
    return fields
      .filter((f) => f.type === "signature" && f.imageData)
      .map((f) => ({
        pdfId,
        signatureBase64: f.imageData,
        coordinates: {
          page: f.pageNumber || 1,
          x: f.x,
          y: f.y,
          width: f.width,
          height: f.height,
          pageRenderWidth: containerDimensions.width,
          pageRenderHeight: containerDimensions.height,
        },
      }));
  };

  const sendSignatures = async () => {
    if (!pdfBase64) {
      toast.error("PDF not loaded");
      return;
    }

    const payloads = buildSignaturePayloads();
    if (payloads.length === 0) {
      toast.error("No signature fields with image data to send");
      return;
    }
    setSending(true);
    const results: Record<string, unknown> = {};
    for (const p of payloads) {
      const key = `${p.coordinates.page}:${p.coordinates.x},${p.coordinates.y}`;

      // Add PDF base64 to payload
      const payload = {
        pdfBase64,
        signatureBase64: p.signatureBase64,
        coordinates: p.coordinates,
      };

      try {
        const resp = await fetch("http://localhost:8080/sign-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await resp.json().catch(() => null);
        results[key] = { ok: resp.ok, status: resp.status, data };
      } catch (err) {
        let message: string;
        if (err && typeof err === "object" && "message" in err) {
          const e = err as { message?: unknown };
          message = typeof e.message === "string" ? e.message : String(err);
        } else {
          message = String(err);
        }
        results[key] = { ok: false, error: message };
      }
    }
    setSendResults(results);
    setSending(false);
    toast.success("Sent signatures to backend");
  };

  const handleCopy = async () => {
    const payload = getBackendPayload();
    await navigator.clipboard.writeText(payload);
    setCopied(true);
    toast.success("Payload copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const payload = getBackendPayload();
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pdf-fields-${pdfId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Payload downloaded!");
  };

  return (
    <div className="w-full p-4 bg-card border border-border rounded-lg space-y-3 overflow-hidden">
      <h3 className="text-sm font-semibold">Export for Backend</h3>

      <p className="text-xs text-muted-foreground">
        {fields.length} field{fields.length !== 1 ? "s" : ""} ready for export
      </p>

      <div className="flex flex-col gap-2 w-full">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          disabled={fields.length === 0}
          className="w-full justify-start"
        >
          {copied ? (
            <Check className="h-4 w-4 mr-2 flex-shrink-0" />
          ) : (
            <Copy className="h-4 w-4 mr-2 flex-shrink-0" />
          )}
          <span className="truncate">Copy JSON</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={fields.length === 0}
          className="w-full justify-start"
        >
          <Download className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="truncate">Download</span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={sendSignatures}
          disabled={
            sending ||
            fields.filter((f) => f.type === "signature" && f.imageData)
              .length === 0
          }
          className="w-full justify-start"
        >
          <span className="truncate">
            {sending ? "Sending..." : "Save Signatures"}
          </span>
        </Button>
      </div>

      {/* Preview */}
      {fields.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Preview:
          </p>
          <pre className="w-full text-xs bg-muted p-2 rounded overflow-auto max-h-40 font-mono whitespace-pre-wrap break-words">
            {getBackendPayload()}
          </pre>
        </div>
      )}

      {Object.keys(sendResults).length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Send Results:
          </p>
          <pre className="w-full text-xs bg-muted p-2 rounded overflow-auto max-h-40 font-mono whitespace-pre-wrap break-words">
            {JSON.stringify(sendResults, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
