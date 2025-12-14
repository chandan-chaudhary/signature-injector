import { useState, useCallback, useRef, useEffect } from "react";
import { FieldType } from "@/types/editor";
import { useEditorFields } from "@/hooks/useEditorFields";
import { PDFViewer } from "./editor/PDFViewer";
import { FieldToolbar } from "./editor/FieldToolbar";
import { FieldEditor } from "./editor/FieldEditor";
import { SignatureModal } from "./editor/SignatureModal";
import { CoordinateDebugger } from "./editor/CoordinateDebugger";
import { ExportPanel } from "./editor/ExportPanel";
import { FileText, Info } from "lucide-react";

export function PDFEditor() {
  const {
    fields,
    selectedFieldId,
    addField,
    updateField,
    deleteField,
    selectField,
    getSelectedField,
    recalculateFieldPositions,
  } = useEditorFields();
  console.log(fields);

  const [isDragging, setIsDragging] = useState(false);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signatureFieldId, setSignatureFieldId] = useState<string | null>(null);
  const [containerDimensions, setContainerDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const prevDimensionsRef = useRef<{ width: number; height: number } | null>(
    null
  );

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      const url = URL.createObjectURL(file);
      setPdfFile(url);

      // Read as base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setPdfBase64(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle responsive repositioning
  const handleContainerResize = useCallback(
    (dimensions: { width: number; height: number }) => {
      if (
        prevDimensionsRef.current &&
        (prevDimensionsRef.current.width !== dimensions.width ||
          prevDimensionsRef.current.height !== dimensions.height)
      ) {
        recalculateFieldPositions(prevDimensionsRef.current, dimensions);
      }
      prevDimensionsRef.current = dimensions;
      setContainerDimensions(dimensions);
    },
    [recalculateFieldPositions]
  );

  const handleFieldClick = useCallback(
    (id: string) => {
      const field = fields.find((f) => f.id === id);
      if (field?.type === "signature") {
        setSignatureFieldId(id);
        setSignatureModalOpen(true);
      }
    },
    [fields]
  );

  const handleSignatureSave = useCallback(
    (signatureData: string) => {
      if (signatureFieldId) {
        updateField(signatureFieldId, { imageData: signatureData });
      }
      setSignatureFieldId(null);
    },
    [signatureFieldId, updateField]
  );

  const selectedField = getSelectedField();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              PDF Signature Editor
            </h1>
            <p className="text-sm text-muted-foreground">
              Drag fields onto the PDF, sign, and export coordinates
            </p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-col lg:flex-row">
        {/* Left sidebar - Field toolbar */}
        <aside className="w-full lg:w-56 border-b lg:border-b-0 lg:border-r border-border bg-card p-4">
          <FieldToolbar
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
          />

          {/* Instructions */}
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Drag fields onto the PDF</p>
                <p>• Click to select and edit</p>
                <p>• Resize by dragging corners</p>
                <p>• Click signature to draw</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Center - PDF Viewer */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {!pdfFile ? (
            <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-border rounded-lg bg-muted/30">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                Upload a PDF to get started
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Drag & drop or click to browse
              </p>
              <input
                type="file"
                accept="application/pdf"
                onChange={handlePdfUpload}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90"
              >
                Choose PDF File
              </label>
            </div>
          ) : (
            <PDFViewer
              pdfUrl={pdfFile}
              fields={fields}
              selectedFieldId={selectedFieldId}
              onFieldUpdate={updateField}
              onFieldDelete={deleteField}
              onFieldSelect={selectField}
              onFieldClick={handleFieldClick}
              onAddField={(type, x, y, pageNumber) =>
                addField(type, x, y, pageNumber)
              }
              containerDimensions={containerDimensions}
              onContainerResize={handleContainerResize}
            />
          )}

          {/* Drag hint overlay */}
          {isDragging && (
            <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
              <div className="bg-primary/10 backdrop-blur-sm rounded-lg p-4 border-2 border-dashed border-primary">
                <p className="text-primary font-medium">Drop on the PDF</p>
              </div>
            </div>
          )}
        </main>

        {/* Right sidebar - Field editor & debug */}
        <aside className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-border bg-card p-4 space-y-4">
          <FieldEditor
            field={selectedField}
            onUpdate={updateField}
            onDelete={deleteField}
            onOpenSignature={() => {
              if (selectedFieldId) {
                setSignatureFieldId(selectedFieldId);
                setSignatureModalOpen(true);
              }
            }}
          />

          <CoordinateDebugger
            field={selectedField}
            containerDimensions={containerDimensions}
          />

          <ExportPanel
            fields={fields}
            containerDimensions={containerDimensions}
            pdfBase64={pdfBase64}
          />
        </aside>
      </div>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={signatureModalOpen}
        onClose={() => {
          setSignatureModalOpen(false);
          setSignatureFieldId(null);
        }}
        onSave={handleSignatureSave}
      />
    </div>
  );
}
