import { Rnd } from 'react-rnd';
import { 
  Type, 
  PenTool, 
  Image, 
  Calendar, 
  CircleDot,
  X
} from 'lucide-react';
import { EditorField } from '@/types/editor';
import { cn } from '@/lib/utils';

interface DraggableFieldProps {
  field: EditorField;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<EditorField>) => void;
  onDelete: (id: string) => void;
  onClick: (id: string) => void;
  containerBounds: { width: number; height: number };
}

const fieldIcons = {
  text: Type,
  signature: PenTool,
  image: Image,
  date: Calendar,
  radio: CircleDot,
};

const fieldColors = {
  text: 'border-blue-500 bg-blue-500/10',
  signature: 'border-green-500 bg-green-500/10',
  image: 'border-purple-500 bg-purple-500/10',
  date: 'border-orange-500 bg-orange-500/10',
  radio: 'border-pink-500 bg-pink-500/10',
};

export function DraggableField({
  field,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onClick,
  containerBounds,
}: DraggableFieldProps) {
  const Icon = fieldIcons[field.type];

  const renderFieldContent = () => {
    switch (field.type) {
      case 'text':
        return field.value ? (
          <span className="text-sm text-foreground truncate px-1">{field.value}</span>
        ) : (
          <span className="text-sm text-muted-foreground">Text</span>
        );
      case 'signature':
        return field.imageData ? (
          <img 
            src={field.imageData} 
            alt="Signature" 
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-sm text-muted-foreground">Sign here</span>
        );
      case 'image':
        return field.imageData ? (
          <img 
            src={field.imageData} 
            alt="Uploaded" 
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-sm text-muted-foreground">Image</span>
        );
      case 'date':
        return field.value ? (
          <span className="text-sm text-foreground">{field.value}</span>
        ) : (
          <span className="text-sm text-muted-foreground">Date</span>
        );
      case 'radio':
        return (
          <div className="flex items-center gap-1">
            <div className={cn(
              "w-4 h-4 rounded-full border-2 border-current",
              field.value === 'selected' && "bg-current"
            )} />
            <span className="text-xs text-muted-foreground">Option</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Rnd
      size={{ width: field.width, height: field.height }}
      position={{ x: field.x, y: field.y }}
      onDragStop={(e, d) => {
        onUpdate(field.id, { x: d.x, y: d.y });
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        onUpdate(field.id, {
          width: parseInt(ref.style.width),
          height: parseInt(ref.style.height),
          x: position.x,
          y: position.y,
        });
      }}
      bounds="parent"
      minWidth={50}
      minHeight={30}
      enableResizing={{
        top: isSelected,
        right: isSelected,
        bottom: isSelected,
        left: isSelected,
        topRight: isSelected,
        bottomRight: isSelected,
        bottomLeft: isSelected,
        topLeft: isSelected,
      }}
      className={cn(
        "group",
        isSelected && "z-50"
      )}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          onSelect(field.id);
          onClick(field.id);
        }}
        className={cn(
          "w-full h-full rounded border-2 border-dashed flex items-center justify-center",
          "cursor-move transition-all relative",
          fieldColors[field.type],
          isSelected && "ring-2 ring-ring ring-offset-1"
        )}
      >
        {/* Delete button */}
        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(field.id);
            }}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 z-10"
          >
            <X className="h-3 w-3" />
          </button>
        )}
        
        {/* Field type indicator */}
        <div className="absolute top-0.5 left-0.5 opacity-50">
          <Icon className="h-3 w-3" />
        </div>
        
        {/* Field content */}
        <div className="flex items-center justify-center overflow-hidden p-1">
          {renderFieldContent()}
        </div>
      </div>
    </Rnd>
  );
}
