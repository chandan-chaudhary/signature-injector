export type FieldType = 'text' | 'signature' | 'image' | 'date' | 'radio';

export interface EditorField {
  id: string;
  type: FieldType;
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
  value?: string;
  imageData?: string;
  radioGroup?: string;
  radioValue?: string;
  isSelected?: boolean;
}

export interface DragItem {
  type: FieldType;
  id?: string;
}
