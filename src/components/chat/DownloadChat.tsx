import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Download, Eye, FileText, List, MessageCircle, BarChart, Tag, Copy, Share2, FileSpreadsheet } from 'lucide-react';
import { trpc } from '@/app/_trpc/client';
import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query';
import { useToast } from '@/components/ui/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import ExportButton from './ExportButton';

interface Message {
  id: string;
  text: string;
  isUserMessage: boolean;
  createdAt: Date;
  metadata?: Record<string, any>;
}

interface DownloadChatProps {
  fileId: string;
  fileName?: string;
  additionalMetadata?: Record<string, any>;
}

const DownloadChat: React.FC<DownloadChatProps> = ({ 
  fileId, 
  fileName = 'Untitled',
  additionalMetadata = {}
}) => {
  const { toast } = useToast();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>('');
  const [previewMode, setPreviewMode] = useState<'pdf' | 'list' | 'stats'>('pdf');

  const { data: messagePages } = trpc.getFileMessages.useInfiniteQuery(
    { fileId, limit: INFINITE_QUERY_LIMIT },
    {
      getNextPageParam: (lastPage) => lastPage?.nextCursor,
      keepPreviousData: true,
    }
  );

  const messages = useMemo(() => 
    messagePages?.pages.flatMap((page) => page.messages) ?? [], 
    [messagePages]
  );

  // ... [keep all previous utility functions like generatePlainTextExport, generateExcelExport, createComprehensivePdfDocument, etc.]

  // Responsive Export Menu for Mobile

  const generatePlainTextExport = (messages: Message[]) => {
    return messages.map(message => 
      `[${message.isUserMessage ? 'You' : 'Assistant'} - ${new Date(message.createdAt).toLocaleString()}]\n${message.text}`
    ).join('\n\n');
  };

// Utility function to create an Excel export
const generateExcelExport = (messages: Message[]) => {
  const worksheetData = messages.map(message => ({
    Sender: message.isUserMessage ? 'You' : 'Assistant',
    Message: message.text,
    Timestamp: new Date(message.createdAt).toLocaleString()
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Chat History');
  
  return workbook;
};

const createComprehensivePdfDocument = (messages: Message[], fullMessageListMode = false): jsPDF => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 20;

  // Document Metadata and Overview
  pdf.setProperties({
    title: `Comprehensive Chat History - ${fileName}`,
    subject: 'Detailed Conversation Export',
    author: 'Chat Application',
    creator: 'Chat Application',
  });

  // Color Palette
  const colors = {
    primary: [31, 97, 141],   // Deep Blue
    secondary: [22, 160, 133], // Teal
    background: [240, 248, 255], // Light Blue Background
    text: [0, 0, 0]
  };

  // Title Page
  pdf.setFontSize(24);
  pdf.setTextColor(...colors.primary);
  pdf.text('Comprehensive Chat Export', margin, 40);
  
  pdf.setFontSize(14);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Conversation: ${fileName}`, margin, 50);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, 60);

  // Metadata Section
  pdf.setFontSize(12);
  pdf.setTextColor(...colors.secondary);
  pdf.text('Conversation Metadata', margin, 80);
  
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  let metadataY = 90;
  Object.entries({
    ...additionalMetadata,
    'Total Messages': messages.length,
    'User Messages': messages.filter(m => m.isUserMessage).length,
    'Assistant Messages': messages.filter(m => !m.isUserMessage).length,
  }).forEach(([key, value]) => {
    pdf.text(`${key}: ${value}`, margin, metadataY);
    metadataY += 7;
  });

  // Message Statistics
  pdf.addPage();
  pdf.setFontSize(16);
  pdf.setTextColor(...colors.primary);
  pdf.text('Message Statistics', margin, 30);

  pdf.autoTable({
    startY: 40,
    head: [['Statistic', 'Value']],
    body: [
      ['Total Messages', messages.length.toString()],
      ['User Messages', messages.filter(m => m.isUserMessage).length.toString()],
      ['Assistant Messages', messages.filter(m => !m.isUserMessage).length.toString()],
      ['First Message Date', messages[0]?.createdAt.toLocaleString() || 'N/A'],
      ['Last Message Date', messages[messages.length - 1]?.createdAt.toLocaleString() || 'N/A'],
    ],
    theme: 'striped',
    headStyles: { 
      fillColor: colors.secondary, 
      textColor: [255, 255, 255] 
    },
  });

  // Truncated Conversation or Full Conversation based on mode
  pdf.addPage();
  pdf.setFontSize(16);
  pdf.setTextColor(...colors.primary);
  pdf.text('Full Conversation', margin, 30);

  // Helper function to process text formatting
  const processFormattedText = (text: string) => {
    // Handle bold text (enclosed in ** or between asterisks)
    const processedText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Replace **bold** with just the text
      .replace(/\*(.*?)\*/g, '$1');     // Replace *italic* with just the text

    return processedText;
  };

  // Conditional rendering based on fullMessageListMode
  if (fullMessageListMode) {
    // Full message list with complete text
    pdf.autoTable({
      startY: 40,
      head: [['Sender', 'Message', 'Timestamp']],
      body: messages.map(message => [
        message.isUserMessage ? 'You' : 'Assistant', 
        processFormattedText(message.text),
        new Date(message.createdAt).toLocaleString()
      ]),
      theme: 'striped',
      headStyles: { 
        fillColor: colors.secondary, 
        textColor: [255, 255, 255] 
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 120 },
        2: { cellWidth: 40 }
      },
      // Enable text wrapping for full messages
      styles: {
        cellPadding: 3,
        fontSize: 8,
        overflow: 'linebreak'
      }
    });
  } else {
    // Truncated message list
    pdf.autoTable({
      startY: 40,
      head: [['Sender', 'Message', 'Timestamp']],
      body: messages.map(message => [
        message.isUserMessage ? 'You' : 'Assistant', 
        message.text.length > 100 
          ? processFormattedText(message.text.substring(0, 100)) + '...' 
          : processFormattedText(message.text),
        new Date(message.createdAt).toLocaleString()
      ]),
      theme: 'striped',
      headStyles: { 
        fillColor: colors.secondary, 
        textColor: [255, 255, 255] 
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 100 },
        2: { cellWidth: 60 }
      }
    });
  }

  return pdf;
};

const generatePDF = (preview = false, fullMessageList = false) => {
  try {
    const pdf = createComprehensivePdfDocument(messages, fullMessageList);

    if (preview) {
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfPreviewUrl(url);
      setIsPreviewOpen(true);
    } else {
      pdf.save(`comprehensive-chat-history-${fileName}${fullMessageList ? '-full-messages' : ''}.pdf`);
      toast({
        title: 'Success',
        description: `${fullMessageList ? 'Full Messages' : 'Comprehensive'} chat history downloaded`,
        variant: 'default',
      });
    }
  } catch (error) {
    console.error(error);
    toast({
      title: 'Export Failed',
      description: 'Unable to generate comprehensive chat document',
      variant: 'destructive',
    });
  }
};

const downloadPlainText = () => {
  try {
    const textContent = generatePlainTextExport(messages);
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-history-${fileName}.txt`;
    link.click();
    
    toast({
      title: 'Success',
      description: 'Chat history downloaded as plain text',
      variant: 'default',
    });
  } catch (error) {
    console.error(error);
    toast({
      title: 'Export Failed',
      description: 'Unable to generate plain text export',
      variant: 'destructive',
    });
  }
};

const downloadExcel = () => {
  try {
    const workbook = generateExcelExport(messages);
    XLSX.writeFile(workbook, `chat-history-${fileName}.xlsx`);
    
    toast({
      title: 'Success',
      description: 'Chat history downloaded as Excel spreadsheet',
      variant: 'default',
    });
  } catch (error) {
    console.error(error);
    toast({
      title: 'Export Failed',
      description: 'Unable to generate Excel export',
      variant: 'destructive',
    });
  }
};

const copyToClipboard = () => {
  try {
    const textContent = generatePlainTextExport(messages);
    navigator.clipboard.writeText(textContent);
    
    toast({
      title: 'Copied',
      description: 'Chat history copied to clipboard',
      variant: 'default',
    });
  } catch (error) {
    console.error(error);
    toast({
      title: 'Copy Failed',
      description: 'Unable to copy chat history',
      variant: 'destructive',
    });
  }
};

const ResponsiveMobileActions = () => {
    return (
      <div className="flex items-center space-x-2 md:hidden">
        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
            >
              <Download className="size-4" /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              className="flex items-center gap-2" 
              onSelect={() => generatePDF(false)}
            >
              <FileText className="size-4" /> PDF Export
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="flex items-center gap-2" 
              onSelect={() => downloadPlainText()}
            >
              <FileText className="size-4" /> Text Export
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="flex items-center gap-2" 
              onSelect={() => downloadExcel()}
            >
              <FileSpreadsheet className="size-4" /> Excel Export
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="flex items-center gap-2" 
              onSelect={copyToClipboard}
            >
              <Copy className="size-4" /> Copy to Clipboard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
  
        {/* Preview Button */}
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={() => {
            generatePDF(true);
            setIsPreviewOpen(true);
            setPreviewMode('pdf');
          }}
        >
          <Eye className="size-4" /> Preview
        </Button>
      </div>
    );
  };

  // Responsive Preview Tabs
  const ResponsivePreviewTabs = () => {
    return (
      <div className="flex flex-wrap md:flex-nowrap gap-2 mb-4">
        <button
          onClick={() => setPreviewMode('pdf')}
          className={`
            flex-1 p-2 flex items-center justify-center gap-2 rounded-lg 
            text-sm md:text-base
            ${
              previewMode === 'pdf' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
          `}
        >
          <FileText className="size-4" /> PDF View
        </button>
        <button
          onClick={() => setPreviewMode('list')}
          className={`
            flex-1 p-2 flex items-center justify-center gap-2 rounded-lg 
            text-sm md:text-base
            ${
              previewMode === 'list' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
          `}
        >
          <List className="size-4" /> Messages List
        </button>
        <button
          onClick={() => setPreviewMode('stats')}
          className={`
            flex-1 p-2 flex items-center justify-center gap-2 rounded-lg 
            text-sm md:text-base
            ${
              previewMode === 'stats' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
          `}
        >
          <BarChart className="size-4" /> Analytics
        </button>
      </div>
    );
  };

  // Update renderMessageList and renderStatistics to be more mobile-friendly
  const renderMessageList = () => {
    return (
      <div className="h-[65vh] w-full overflow-y-auto border rounded-md p-2 md:p-4">
        {messages.map((message, index) => (
          <div 
            key={message.id || index} 
            className={`
              mb-2 md:mb-4 p-2 md:p-3 rounded-lg 
              ${
                message.isUserMessage 
                  ? 'bg-blue-50 text-blue-900' 
                  : 'bg-green-50 text-green-900'
              }
            `}
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2">
              <div className="flex items-center gap-2 mb-1 md:mb-0">
                <span className="font-semibold text-sm md:text-base">
                  {message.isUserMessage ? 'You' : 'Assistant'}
                </span>
                {message.isUserMessage 
                  ? <Tag className="size-3 md:size-4 text-blue-500" /> 
                  : <MessageCircle className="size-3 md:size-4 text-green-500" />
                }
              </div>
              <span className="text-xs text-gray-500">
                {new Date(message.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="text-sm md:text-base">{message.text}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderStatistics = () => {
    const userMessages = messages.filter(m => m.isUserMessage);
    const assistantMessages = messages.filter(m => !m.isUserMessage);

    return (
      <div className="h-[65vh] w-full overflow-y-auto border rounded-md p-4">
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-blue-700">
          Conversation Analytics
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="bg-blue-50 p-3 md:p-4 rounded-lg">
            <h3 className="text-base md:text-lg font-semibold text-blue-600 mb-1 md:mb-2">
              Total Messages
            </h3>
            <p className="text-2xl md:text-3xl font-bold text-blue-800">
              {messages.length}
            </p>
          </div>
          
          <div className="bg-green-50 p-3 md:p-4 rounded-lg">
            <h3 className="text-base md:text-lg font-semibold text-green-600 mb-1 md:mb-2">
              Message Breakdown
            </h3>
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium">User Messages</p>
                <p className="text-xl md:text-2xl font-bold text-green-800">
                  {userMessages.length}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Assistant Messages</p>
                <p className="text-xl md:text-2xl font-bold text-green-800">
                  {assistantMessages.length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-3 md:p-4 rounded-lg col-span-1 md:col-span-2">
            <h3 className="text-base md:text-lg font-semibold text-purple-600 mb-1 md:mb-2">
              Conversation Timeline
            </h3>
            <div className="flex justify-between text-sm">
              <div>
                <p className="font-medium">First Message</p>
                <p>{messages[0]?.createdAt.toLocaleString() || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium">Last Message</p>
                <p>{messages[messages.length - 1]?.createdAt.toLocaleString() || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Desktop Export Buttons */}
      <div className="hidden md:flex space-x-2">
        <TooltipProvider>
          <ExportButton 
            generatePDF={generatePDF}
            downloadPlainText={downloadPlainText}
            downloadExcel={downloadExcel}
          />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Copy className="size-4" />
                Copy
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy Chat to Clipboard</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => {
                  generatePDF(true);
                  setPreviewMode('pdf');
                }}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Eye className="size-4" />
                Preview
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Preview Chat Export</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Mobile Export Menu */}
      <ResponsiveMobileActions />


      {/* Preview Dialog with Responsive Considerations */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-full md:max-w-4xl h-[90vh] md:h-[80vh] p-2 md:p-6">
          <DialogHeader className="p-2 md:p-0">
            <DialogTitle className="text-base md:text-xl">
              Chat History Export
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Comprehensive conversation export with multiple views
            </DialogDescription>
          </DialogHeader>
          
          <ResponsivePreviewTabs />
          
          <div className="h-[70vh] md:h-[65vh]">
            {previewMode === 'pdf' && pdfPreviewUrl && (
              <div className="w-full h-full overflow-hidden">
                <iframe
                  src={pdfPreviewUrl}
                  className="w-full h-full rounded-md border"
                  title="PDF Preview"
                />
              </div>
            )}
            
            {previewMode === 'list' && renderMessageList()}
            
            {previewMode === 'stats' && renderStatistics()}
          </div>

          <div className="flex flex-col md:flex-row justify-end space-y-2 md:space-y-0 md:space-x-2 mt-2 md:mt-4">
            <Button 
              variant="outline" 
              size="sm"
              className="w-full md:w-auto"
              onClick={() => {
                switch(previewMode) {
                  case 'pdf':
                    generatePDF(false);
                    break;
                  case 'list':
                    downloadPlainText();
                    break;
                  case 'stats':
                    downloadExcel();
                    break;
                }
                setIsPreviewOpen(false);
              }}
            >
              <Download className="size-4 mr-2" /> 
              Download Current View
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              className="w-full md:w-auto"
              onClick={() => setIsPreviewOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DownloadChat;