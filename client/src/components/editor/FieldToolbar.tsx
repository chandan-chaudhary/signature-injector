import { 
  Type, 
  PenTool, 
  Image, 
  Calendar, 
  CircleDot,
  GripVertical
} from 'lucide-react';
import { FieldType } from '@/types/editor';
import { cn } from '@/lib/utils';

interface FieldToolbarProps {
  onDragStart: (type: FieldType) => void;
  onDragEnd: () => void;
}

const fieldTypes: { type: FieldType; icon: React.ReactNode; label: string }[] = [
  { type: 'text', icon: <Type className="h-4 w-4" />, label: 'Text Box' },
  { type: 'signature', icon: <PenTool className="h-4 w-4" />, label: 'Signature' },
  { type: 'image', icon: <Image className="h-4 w-4" />, label: 'Image' },
  { type: 'date', icon: <Calendar className="h-4 w-4" />, label: 'Date' },
  { type: 'radio', icon: <CircleDot className="h-4 w-4" />, label: 'Radio' },
];

export function FieldToolbar({ onDragStart, onDragEnd }: FieldToolbarProps) {
  return (
    <div className="flex flex-col gap-2 p-3 bg-card border border-border rounded-lg shadow-sm">
      <h3 className="text-sm font-semibold text-foreground mb-1">Fields</h3>
      <div className="flex flex-col gap-1.5">
        {fieldTypes.map(({ type, icon, label }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('fieldType', type);
              onDragStart(type);
            }}
            onDragEnd={onDragEnd}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md cursor-grab",
              "bg-secondary text-secondary-foreground",
              "hover:bg-accent hover:text-accent-foreground",
              "active:cursor-grabbing transition-colors",
              "border border-transparent hover:border-border"
            )}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
            {icon}
            <span className="text-sm">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
