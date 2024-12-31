declare module 'pdfreader' {
    export class PdfReader {
      parseBuffer(buffer: Buffer, callback: (err: Error | null, item: any) => void): void;
    }
  }