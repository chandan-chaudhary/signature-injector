import { useState, useCallback } from 'react';
import { EditorField, FieldType } from '@/types/editor';
import { 
  normalizeToPercent, 
  denormalizeFromPercent,
  NormalizedCoordinates 
} from '@/lib/coordinateUtils';

const DEFAULT_FIELD_SIZES: Record<FieldType, { width: number; height: number }> = {
  text: { width: 150, height: 30 },
  signature: { width: 200, height: 60 },
  image: { width: 100, height: 100 },
  date: { width: 120, height: 30 },
  radio: { width: 80, height: 24 },
};

interface UseEditorFieldsReturn {
  fields: EditorField[];
  selectedFieldId: string | null;
  addField: (type: FieldType, x: number, y: number, pageNumber?: number) => void;
  updateField: (id: string, updates: Partial<EditorField>) => void;
  deleteField: (id: string) => void;
  selectField: (id: string | null) => void;
  getSelectedField: () => EditorField | null;
  recalculateFieldPositions: (
    oldDimensions: { width: number; height: number },
    newDimensions: { width: number; height: number }
  ) => void;
}

export function useEditorFields(): UseEditorFieldsReturn {
  const [fields, setFields] = useState<EditorField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  // Store normalized coordinates for responsive repositioning
  const [normalizedCoords, setNormalizedCoords] = useState<Map<string, NormalizedCoordinates>>(new Map());

  const addField = useCallback((type: FieldType, x: number, y: number, pageNumber: number = 1) => {
    const id = `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const defaultSize = DEFAULT_FIELD_SIZES[type];
    
    const newField: EditorField = {
      id,
      type,
      x: x - defaultSize.width / 2, // Center on drop point
      y: y - defaultSize.height / 2,
      width: defaultSize.width,
      height: defaultSize.height,
      pageNumber,
    };

    setFields(prev => [...prev, newField]);
    setSelectedFieldId(id);
  }, []);

  const updateField = useCallback((id: string, updates: Partial<EditorField>) => {
    setFields(prev => prev.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  }, []);

  const deleteField = useCallback((id: string) => {
    setFields(prev => prev.filter(field => field.id !== id));
    if (selectedFieldId === id) {
      setSelectedFieldId(null);
    }
    setNormalizedCoords(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, [selectedFieldId]);

  const selectField = useCallback((id: string | null) => {
    setSelectedFieldId(id);
  }, []);

  const getSelectedField = useCallback(() => {
    return fields.find(f => f.id === selectedFieldId) || null;
  }, [fields, selectedFieldId]);

  // Recalculate field positions when container size changes (responsive)
  const recalculateFieldPositions = useCallback((
    oldDimensions: { width: number; height: number },
    newDimensions: { width: number; height: number }
  ) => {
    if (!oldDimensions.width || !oldDimensions.height) return;

    setFields(prev => prev.map(field => {
      // First, normalize current position based on old dimensions
      const normalized = normalizeToPercent(
        { x: field.x, y: field.y, width: field.width, height: field.height },
        oldDimensions.width,
        oldDimensions.height
      );

      // Then, denormalize to new dimensions
      const newCoords = denormalizeFromPercent(
        normalized,
        newDimensions.width,
        newDimensions.height
      );

      return {
        ...field,
        x: newCoords.x,
        y: newCoords.y,
        width: newCoords.width,
        height: newCoords.height,
      };
    }));
  }, []);

  return {
    fields,
    selectedFieldId,
    addField,
    updateField,
    deleteField,
    selectField,
    getSelectedField,
    recalculateFieldPositions,
  };
}
