import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  MoreHorizontal 
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

const ExportButton: React.FC<{
  generatePDF: (preview: boolean, fullMessages?: boolean) => void;
  downloadPlainText: () => void;
  downloadExcel: () => void;
}> = ({ 
  generatePDF, 
  downloadPlainText, 
  downloadExcel 
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleExport = (exportType: 'pdf-summary' | 'pdf-full' | 'text' | 'excel') => {
    switch (exportType) {
      case 'pdf-summary':
        generatePDF(false);
        break;
      case 'pdf-full':
        generatePDF(false, true);
        break;
      case 'text':
        downloadPlainText();
        break;
      case 'excel':
        downloadExcel();
        break;
    }
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2"
        >
          <Download className="size-4" />
          Export
          <MoreHorizontal className="size-4 ml-2" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Chat History</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button 
            variant="outline" 
            className="justify-start gap-2"
            onClick={() => handleExport('pdf-summary')}
          >
            <Download className="size-4" /> 
            PDF (Summary)
          </Button>
          <Button 
            variant="outline" 
            className="justify-start gap-2"
            onClick={() => handleExport('pdf-full')}
          >
            <Download className="size-4" /> 
            PDF (Full Messages)
          </Button>
          <Button 
            variant="outline" 
            className="justify-start gap-2"
            onClick={() => handleExport('text')}
          >
            <FileText className="size-4" /> 
            Plain Text
          </Button>
          <Button 
            variant="outline" 
            className="justify-start gap-2"
            onClick={() => handleExport('excel')}
          >
            <FileSpreadsheet className="size-4" /> 
            Excel Spreadsheet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportButton