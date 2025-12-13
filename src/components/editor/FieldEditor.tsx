import { useState } from 'react';
import { EditorField } from '@/types/editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Upload, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FieldEditorProps {
  field: EditorField | null;
  onUpdate: (id: string, updates: Partial<EditorField>) => void;
  onDelete: (id: string) => void;
  onOpenSignature: () => void;
}

export function FieldEditor({ field, onUpdate, onDelete, onOpenSignature }: FieldEditorProps) {
  const [date, setDate] = useState<Date | undefined>(
    field?.value ? new Date(field.value) : undefined
  );

  if (!field) {
    return (
      <div className="p-4 bg-card border border-border rounded-lg">
        <p className="text-sm text-muted-foreground text-center">
          Select a field to edit its properties
        </p>
      </div>
    );
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate(field.id, { imageData: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      onUpdate(field.id, { value: format(selectedDate, 'yyyy-MM-dd') });
    }
  };

  return (
    <div className="p-4 bg-card border border-border rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold capitalize">{field.type} Field</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(field.id)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {field.type === 'text' && (
        <div className="space-y-2">
          <Label htmlFor="text-value">Text Content</Label>
          <Input
            id="text-value"
            value={field.value || ''}
            onChange={(e) => onUpdate(field.id, { value: e.target.value })}
            placeholder="Enter text..."
          />
        </div>
      )}

      {field.type === 'signature' && (
        <div className="space-y-2">
          <Label>Signature</Label>
          {field.imageData ? (
            <div className="border border-border rounded p-2 bg-white">
              <img 
                src={field.imageData} 
                alt="Signature" 
                className="max-h-20 mx-auto"
              />
            </div>
          ) : null}
          <Button onClick={onOpenSignature} className="w-full">
            {field.imageData ? 'Re-draw Signature' : 'Draw Signature'}
          </Button>
        </div>
      )}

      {field.type === 'image' && (
        <div className="space-y-2">
          <Label>Image Upload</Label>
          {field.imageData && (
            <div className="border border-border rounded p-2">
              <img 
                src={field.imageData} 
                alt="Uploaded" 
                className="max-h-20 mx-auto object-contain"
              />
            </div>
          )}
          <div className="flex gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => document.getElementById('image-upload')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </Button>
          </div>
        </div>
      )}

      {field.type === 'date' && (
        <div className="space-y-2">
          <Label>Select Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {field.type === 'radio' && (
        <div className="space-y-2">
          <Label>Radio Button</Label>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={field.value === 'selected'}
              onChange={(e) => onUpdate(field.id, { 
                value: e.target.checked ? 'selected' : '' 
              })}
              className="h-4 w-4"
            />
            <span className="text-sm text-muted-foreground">Selected</span>
          </div>
        </div>
      )}

      {/* Position info */}
      <div className="pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Position: ({Math.round(field.x)}, {Math.round(field.y)})
        </p>
        <p className="text-xs text-muted-foreground">
          Size: {Math.round(field.width)} × {Math.round(field.height)}
        </p>
      </div>
    </div>
  );
}
