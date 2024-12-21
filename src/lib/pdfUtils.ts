import axios from 'axios'
import pdfParse from 'pdf-parse'

export const getPDFTextFromURL = async (pdfUrl: string): Promise<string> => {
  try {
    const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' })
    const pdfData = await pdfParse(response.data)
    return pdfData.text
  } catch (error) {
    throw new Error('Error extracting text from PDF')
  }
}
