import { Button } from '@/components/ui/button';
import { EditorField } from '@/types/editor';
import { 
  generateFieldPayload,
  FieldPayload 
} from '@/lib/coordinateUtils';
import { Download, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ExportPanelProps {
  fields: EditorField[];
  containerDimensions: { width: number; height: number } | null;
  pdfId?: string;
}

export function ExportPanel({ fields, containerDimensions, pdfId = 'sample-pdf' }: ExportPanelProps) {
  const [copied, setCopied] = useState(false);

  const generatePayload = (): FieldPayload[] => {
    if (!containerDimensions) return [];

    return fields.map(field => generateFieldPayload(
      field.id,
      field.type,
      { x: field.x, y: field.y, width: field.width, height: field.height },
      containerDimensions.width,
      containerDimensions.height,
      field.pageNumber,
      field.value,
      field.imageData
    ));
  };

  const getBackendPayload = () => {
    const payload = {
      pdfId,
      fields: generatePayload(),
      containerDimensions,
    };
    return JSON.stringify(payload, null, 2);
  };

  const handleCopy = async () => {
    const payload = getBackendPayload();
    await navigator.clipboard.writeText(payload);
    setCopied(true);
    toast.success('Payload copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const payload = getBackendPayload();
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pdf-fields-${pdfId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Payload downloaded!');
  };

  return (
    <div className="p-4 bg-card border border-border rounded-lg space-y-3">
      <h3 className="text-sm font-semibold">Export for Backend</h3>
      
      <p className="text-xs text-muted-foreground">
        {fields.length} field{fields.length !== 1 ? 's' : ''} ready for export
      </p>

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCopy}
          disabled={fields.length === 0}
          className="flex-1"
        >
          {copied ? (
            <Check className="h-4 w-4 mr-2" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          Copy JSON
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleDownload}
          disabled={fields.length === 0}
          className="flex-1"
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>

      {/* Preview */}
      {fields.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-medium text-muted-foreground mb-1">Preview:</p>
          <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40 font-mono">
            {getBackendPayload()}
          </pre>
        </div>
      )}
    </div>
  );
}
