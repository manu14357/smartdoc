declare module 'pdf-parse/lib/pdf-parse.js' {
    interface PDFData {
      text: string;
      numpages: number;
      numrender: number;
      info: any;
      metadata: any;
      version: string;
    }
  
    function PDFParse(dataBuffer: Buffer): Promise<PDFData>;
    
    export default PDFParse;
  }