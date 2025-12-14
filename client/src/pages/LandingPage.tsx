import { PDFEditor } from '@/components/PDFEditor';
import { Toaster } from '@/components/ui/sonner';

export default function LandingPage() {
  return (
    <>
      <PDFEditor />
      <Toaster position="bottom-right" />
    </>
  );
};

