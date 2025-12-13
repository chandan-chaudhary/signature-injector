import { EditorField } from '@/types/editor';
import { 
  calculateScaleFactor, 
  cssToPoints, 
  normalizeToPercent,
  A4_WIDTH_PT,
  A4_HEIGHT_PT
} from '@/lib/coordinateUtils';

interface CoordinateDebuggerProps {
  field: EditorField | null;
  containerDimensions: { width: number; height: number } | null;
}

export function CoordinateDebugger({ field, containerDimensions }: CoordinateDebuggerProps) {
  if (!field || !containerDimensions) {
    return (
      <div className="p-4 bg-card border border-border rounded-lg">
        <h3 className="text-sm font-semibold mb-2">Coordinate Debug</h3>
        <p className="text-xs text-muted-foreground">
          Select a field to view coordinate translation
        </p>
      </div>
    );
  }

  const scaleFactor = calculateScaleFactor(
    containerDimensions.width,
    containerDimensions.height
  );

  const cssCoords = {
    x: field.x,
    y: field.y,
    width: field.width,
    height: field.height,
  };

  const pdfCoords = cssToPoints(cssCoords, scaleFactor);
  const normalized = normalizeToPercent(cssCoords, containerDimensions.width, containerDimensions.height);

  return (
    <div className="p-4 bg-card border border-border rounded-lg space-y-3">
      <h3 className="text-sm font-semibold">Coordinate Debug</h3>
      
      {/* Scale Info */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Scale Factor</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <span>X: {scaleFactor.scaleX.toFixed(4)}</span>
          <span>Y: {scaleFactor.scaleY.toFixed(4)}</span>
        </div>
      </div>

      {/* CSS Coordinates */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-blue-600">CSS (pixels, top-left origin)</p>
        <div className="grid grid-cols-2 gap-1 text-xs font-mono bg-blue-50 dark:bg-blue-950 p-2 rounded">
          <span>x: {cssCoords.x.toFixed(1)}px</span>
          <span>y: {cssCoords.y.toFixed(1)}px</span>
          <span>w: {cssCoords.width.toFixed(1)}px</span>
          <span>h: {cssCoords.height.toFixed(1)}px</span>
        </div>
      </div>

      {/* PDF Coordinates */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-green-600">PDF (points, bottom-left origin)</p>
        <div className="grid grid-cols-2 gap-1 text-xs font-mono bg-green-50 dark:bg-green-950 p-2 rounded">
          <span>x: {pdfCoords.x.toFixed(2)}pt</span>
          <span>y: {pdfCoords.y.toFixed(2)}pt</span>
          <span>w: {pdfCoords.width.toFixed(2)}pt</span>
          <span>h: {pdfCoords.height.toFixed(2)}pt</span>
        </div>
      </div>

      {/* Normalized (Responsive) */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-purple-600">Normalized (% for responsive)</p>
        <div className="grid grid-cols-2 gap-1 text-xs font-mono bg-purple-50 dark:bg-purple-950 p-2 rounded">
          <span>x: {normalized.xPercent.toFixed(2)}%</span>
          <span>y: {normalized.yPercent.toFixed(2)}%</span>
          <span>w: {normalized.widthPercent.toFixed(2)}%</span>
          <span>h: {normalized.heightPercent.toFixed(2)}%</span>
        </div>
      </div>

      {/* Reference Info */}
      <div className="pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Container: {containerDimensions.width.toFixed(0)} × {containerDimensions.height.toFixed(0)}px
        </p>
        <p className="text-xs text-muted-foreground">
          PDF Page: {A4_WIDTH_PT} × {A4_HEIGHT_PT}pt (A4)
        </p>
      </div>
    </div>
  );
}
