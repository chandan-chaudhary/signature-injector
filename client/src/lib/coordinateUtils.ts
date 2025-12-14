/**
 * Coordinate Translation Utilities
 * 
 * This module handles the critical coordinate mapping between:
 * - CSS Pixels: Top-left origin, relative to browser viewport
 * - PDF Points: Bottom-left origin, 72 DPI (points per inch)
 * 
 * Standard PDF page sizes (in points at 72 DPI):
 * - A4: 595.28 x 841.89 points
 * - Letter: 612 x 792 points
 */

export const PDF_DPI = 72;
export const A4_WIDTH_PT = 595.28;
export const A4_HEIGHT_PT = 841.89;

export interface CSSCoordinates {
  x: number;       // pixels from left edge of PDF container
  y: number;       // pixels from top edge of PDF container
  width: number;   // width in pixels
  height: number;  // height in pixels
}

export interface PDFCoordinates {
  x: number;       // points from left edge of PDF page
  y: number;       // points from bottom edge of PDF page
  width: number;   // width in points
  height: number;  // height in points
}

export interface ScaleFactor {
  scaleX: number;  // CSS pixels per PDF point (horizontal)
  scaleY: number;  // CSS pixels per PDF point (vertical)
}

/**
 * Calculate the scale factor between rendered PDF and actual PDF dimensions
 */
export function calculateScaleFactor(
  renderedWidth: number,
  renderedHeight: number,
  pdfWidth: number = A4_WIDTH_PT,
  pdfHeight: number = A4_HEIGHT_PT
): ScaleFactor {
  return {
    scaleX: renderedWidth / pdfWidth,
    scaleY: renderedHeight / pdfHeight,
  };
}

/**
 * Convert CSS pixel coordinates to PDF point coordinates
 * 
 * Key transformations:
 * 1. Scale from pixels to points
 * 2. Flip Y-axis (CSS: top-left origin → PDF: bottom-left origin)
 */
export function cssToPoints(
  cssCoords: CSSCoordinates,
  scaleFactor: ScaleFactor,
  pdfHeight: number = A4_HEIGHT_PT
): PDFCoordinates {
  // Scale dimensions from pixels to points
  const widthPt = cssCoords.width / scaleFactor.scaleX;
  const heightPt = cssCoords.height / scaleFactor.scaleY;
  
  // Scale position from pixels to points
  const xPt = cssCoords.x / scaleFactor.scaleX;
  
  // Convert Y: CSS top-left to PDF bottom-left
  // In CSS: y=0 is top, y increases downward
  // In PDF: y=0 is bottom, y increases upward
  // PDF_Y = pdfHeight - (CSS_Y + element_height) / scale
  const yPt = pdfHeight - (cssCoords.y / scaleFactor.scaleY) - heightPt;
  
  return {
    x: xPt,
    y: yPt,
    width: widthPt,
    height: heightPt,
  };
}

/**
 * Convert PDF point coordinates to CSS pixel coordinates
 * (For loading existing field positions back into the editor)
 */
export function pointsToCSS(
  pdfCoords: PDFCoordinates,
  scaleFactor: ScaleFactor,
  pdfHeight: number = A4_HEIGHT_PT
): CSSCoordinates {
  // Scale dimensions from points to pixels
  const widthPx = pdfCoords.width * scaleFactor.scaleX;
  const heightPx = pdfCoords.height * scaleFactor.scaleY;
  
  // Scale position from points to pixels
  const xPx = pdfCoords.x * scaleFactor.scaleX;
  
  // Convert Y: PDF bottom-left to CSS top-left
  const yPx = (pdfHeight - pdfCoords.y - pdfCoords.height) * scaleFactor.scaleY;
  
  return {
    x: xPx,
    y: yPx,
    width: widthPx,
    height: heightPx,
  };
}

/**
 * Normalize coordinates to percentage-based for responsive positioning
 * This ensures fields stay anchored to content across different screen sizes
 */
export interface NormalizedCoordinates {
  xPercent: number;      // 0-100, percentage from left
  yPercent: number;      // 0-100, percentage from top
  widthPercent: number;  // 0-100, percentage of container width
  heightPercent: number; // 0-100, percentage of container height
}

export function normalizeToPercent(
  cssCoords: CSSCoordinates,
  containerWidth: number,
  containerHeight: number
): NormalizedCoordinates {
  return {
    xPercent: (cssCoords.x / containerWidth) * 100,
    yPercent: (cssCoords.y / containerHeight) * 100,
    widthPercent: (cssCoords.width / containerWidth) * 100,
    heightPercent: (cssCoords.height / containerHeight) * 100,
  };
}

export function denormalizeFromPercent(
  normalized: NormalizedCoordinates,
  containerWidth: number,
  containerHeight: number
): CSSCoordinates {
  return {
    x: (normalized.xPercent / 100) * containerWidth,
    y: (normalized.yPercent / 100) * containerHeight,
    width: (normalized.widthPercent / 100) * containerWidth,
    height: (normalized.heightPercent / 100) * containerHeight,
  };
}

/**
 * Generate the coordinate payload for backend API
 */
export interface FieldPayload {
  id: string;
  type: 'text' | 'signature' | 'image' | 'date' | 'radio';
  pdfCoordinates: PDFCoordinates;
  normalizedCoordinates: NormalizedCoordinates;
  value?: string;       // For text/date fields
  imageData?: string;   // Base64 for signature/image
  pageNumber: number;
}

export function generateFieldPayload(
  id: string,
  type: FieldPayload['type'],
  cssCoords: CSSCoordinates,
  containerWidth: number,
  containerHeight: number,
  pageNumber: number = 1,
  value?: string,
  imageData?: string
): FieldPayload {
  const scaleFactor = calculateScaleFactor(containerWidth, containerHeight);
  
  return {
    id,
    type,
    pdfCoordinates: cssToPoints(cssCoords, scaleFactor),
    normalizedCoordinates: normalizeToPercent(cssCoords, containerWidth, containerHeight),
    value,
    imageData,
    pageNumber,
  };
}
