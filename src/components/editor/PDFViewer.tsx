import { useState, useRef, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { EditorField, FieldType } from '@/types/editor';
import { DraggableField } from './DraggableField';
import { cn } from '@/lib/utils';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  pdfUrl: string;
  fields: EditorField[];
  selectedFieldId: string | null;
  onFieldUpdate: (id: string, updates: Partial<EditorField>) => void;
  onFieldDelete: (id: string) => void;
  onFieldSelect: (id: string | null) => void;
  onFieldClick: (id: string) => void;
  onAddField: (type: FieldType, x: number, y: number) => void;
  containerDimensions: { width: number; height: number } | null;
  onContainerResize: (dimensions: { width: number; height: number }) => void;
}

export function PDFViewer({
  pdfUrl,
  fields,
  selectedFieldId,
  onFieldUpdate,
  onFieldDelete,
  onFieldSelect,
  onFieldClick,
  onAddField,
  containerDimensions,
  onContainerResize,
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(Math.min(width - 32, 800)); // Max 800px, with padding
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  }, []);

  const onPageLoadSuccess = useCallback(() => {
    // Get the actual rendered page dimensions
    setTimeout(() => {
      const pageElement = containerRef.current?.querySelector('.react-pdf__Page__canvas') as HTMLCanvasElement;
      if (pageElement) {
        onContainerResize({
          width: pageElement.offsetWidth,
          height: pageElement.offsetHeight,
        });
      }
    }, 100);
  }, [onContainerResize]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const fieldType = e.dataTransfer.getData('fieldType') as FieldType;
    if (!fieldType || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const pageElement = containerRef.current.querySelector('.react-pdf__Page');
    if (!pageElement) return;

    const pageRect = pageElement.getBoundingClientRect();
    const x = e.clientX - pageRect.left;
    const y = e.clientY - pageRect.top;

    // Only add if within page bounds
    if (x >= 0 && y >= 0 && x <= pageRect.width && y <= pageRect.height) {
      onAddField(fieldType, x, y);
    }
  }, [onAddField]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleContainerClick = () => {
    onFieldSelect(null);
  };

  const currentPageFields = fields.filter(f => f.pageNumber === pageNumber);

  return (
    <div 
      ref={containerRef}
      className="flex flex-col items-center bg-muted/30 rounded-lg p-4 overflow-auto"
      onClick={handleContainerClick}
    >
      {/* Page navigation */}
      {numPages && numPages > 1 && (
        <div className="flex items-center gap-4 mb-4 bg-card px-4 py-2 rounded-lg shadow-sm">
          <button
            onClick={() => setPageNumber(p => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            className="px-3 py-1 text-sm bg-secondary rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-foreground">
            Page {pageNumber} of {numPages}
          </span>
          <button
            onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
            disabled={pageNumber >= numPages}
            className="px-3 py-1 text-sm bg-secondary rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* PDF Document */}
      <div
        className="relative shadow-lg"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center h-[600px] w-[400px] bg-card">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }
          error={
            <div className="flex items-center justify-center h-[600px] w-[400px] bg-card text-destructive">
              Failed to load PDF
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            width={containerWidth}
            onLoadSuccess={onPageLoadSuccess}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>

        {/* Fields overlay */}
        {containerDimensions && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              width: containerDimensions.width,
              height: containerDimensions.height,
            }}
          >
            <div className="relative w-full h-full pointer-events-auto">
              {currentPageFields.map(field => (
                <DraggableField
                  key={field.id}
                  field={field}
                  isSelected={field.id === selectedFieldId}
                  onSelect={onFieldSelect}
                  onUpdate={onFieldUpdate}
                  onDelete={onFieldDelete}
                  onClick={onFieldClick}
                  containerBounds={containerDimensions}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="text-sm text-muted-foreground mt-4">
          Loading document...
        </div>
      )}
    </div>
  );
}
