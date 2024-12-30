import * as pdfjsLib from 'pdfjs-dist';


// Ensure pdfjsLib is available
if (!pdfjsLib.getDocument) {
  throw new Error(
    "pdfjsLib.getDocument is undefined. Check your pdfjs-dist installation.",
  );
}
