import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Eraser, Check } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureData: string) => void;
}

export function SignatureModal({ isOpen, onClose, onSave }: SignatureModalProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
  };

  const handleSave = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      onSave(dataUrl);
      handleClear();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Draw Your Signature</DialogTitle>
        </DialogHeader>
        <div className="border border-border rounded-lg overflow-hidden bg-white">
          <SignatureCanvas
            ref={sigCanvas}
            canvasProps={{
              width: 400,
              height: 200,
              className: 'w-full',
              style: { width: '100%', height: '200px' }
            }}
            backgroundColor="white"
            penColor="black"
            onBegin={() => setIsEmpty(false)}
          />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Draw your signature in the box above
        </p>
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClear}>
            <Eraser className="h-4 w-4 mr-2" />
            Clear
          </Button>
          <Button onClick={handleSave} disabled={isEmpty}>
            <Check className="h-4 w-4 mr-2" />
            Apply Signature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
