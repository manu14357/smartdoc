import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

// Ensure pdfjsLib is available
if (!pdfjsLib.getDocument) {
  throw new Error(
    "pdfjsLib.getDocument is undefined. Check your pdfjs-dist installation.",
  );
}
