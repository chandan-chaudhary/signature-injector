import { PDFEditor } from '@/components/PDFEditor';
import { Toaster } from '@/components/ui/sonner';

const Index = () => {
  return (
    <>
      <PDFEditor />
      <Toaster position="bottom-right" />
    </>
  );
};

export default Index;
