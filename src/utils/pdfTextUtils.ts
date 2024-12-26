import { pdfjs } from 'react-pdf';

// Define the type for the text items
interface TextItem {
  str: string;
  [key: string]: any; // Allow additional properties
}

// Define the type for marked content in PDF
interface TextMarkedContent {
  [key: string]: any; // Allow additional properties, but no 'str' property
}

// Function to find text in a PDF document
export const findText = (text: string, pageNum: number, totalPages: number) => {
  // Utilize the PDF.js API to search for text within the document
  return new Promise<TextItem[]>((resolve, reject) => {
    const loadingTask = pdfjs.getDocument({ url: 'https://utfs.io/f/37e05cc3-e76e-4180-8407-b82c0b104f5d-ujzuhg.pdf' });

    loadingTask.promise.then((pdf) => {
      pdf.getPage(pageNum).then((page) => {
        page.getTextContent().then((textContent) => {
          let foundText: TextItem[] = [];
          textContent.items.forEach((item: TextItem | TextMarkedContent) => {
            // Check if item is of type TextItem
            if ((item as TextItem).str && (item as TextItem).str.includes(text)) {
              foundText.push(item as TextItem);
            }
          });
          resolve(foundText);
        }).catch((error) => {
          reject(error);
        });
      }).catch((error) => {
        reject(error);
      });
    }).catch((error) => {
      reject(error);
    });
  });
};

// Function to highlight text in a PDF document (implementation placeholder)
export const highlightText = (text: string, pageNum: number) => {
  // Implement functionality to highlight text on the page
};