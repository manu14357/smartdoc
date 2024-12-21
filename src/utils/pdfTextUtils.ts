// pdfTextUtils.ts

import { pdfjs } from 'react-pdf'

export const findText = (text: string, pageNum: number, totalPages: number) => {
  // Utilize the PDF.js API to search for text within the document
  return new Promise((resolve, reject) => {
    const loadingTask = pdfjs.getDocument({ url: 'https://utfs.io/f/37e05cc3-e76e-4180-8407-b82c0b104f5d-ujzuhg.pdf' })

    loadingTask.promise.then((pdf) => {
      pdf.getPage(pageNum).then((page) => {
        page.getTextContent().then((textContent) => {
          let foundText = []
          textContent.items.forEach((item: any) => {
            if (item.str.includes(text)) {
              foundText.push(item)
            }
          })
          resolve(foundText)
        })
      })
    })
  })
}

export const highlightText = (text: string, pageNum: number) => {
  // Implement functionality to highlight text on the page
}
