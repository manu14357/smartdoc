import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface Message {
  text: string
  isUserMessage: boolean
  createdAt: string
  metadata?: {
    sentiment?: 'positive' | 'neutral' | 'negative';
    tags?: string[];
    complexity?: number;
  }
}

interface ExportOptions {
  includeMetadata?: boolean;
  formatStyle?: 'professional' | 'casual' | 'compact';
}

class ChatPDFExporter {
  private pdf: jsPDF
  private currentY: number
  private pageWidth: number
  private pageHeight: number
  private margin: number
  private contentWidth: number
  
  // Enhanced styling constants
  private readonly defaultFontSize: number
  private readonly headerFontSize: number
  private readonly lineHeight: number
  private readonly messageSpacing: number
  private readonly maxWidth: number
  private readonly websiteName: string
  private readonly colors: {
    userMessageBg: [number, number, number]
    assistantMessageBg: [number, number, number]
    timestamp: [number, number, number]
    text: [number, number, number]
    header: [number, number, number]
    headerText: [number, number, number]
  }

  constructor(websiteName: string = 'SmartChat') {
    // PDF Configuration
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
    
    // Website Name
    this.websiteName = websiteName
    
    // Responsive Dimensions
    this.pageWidth = this.pdf.internal.pageSize.width
    this.pageHeight = this.pdf.internal.pageSize.height
    this.margin = 20
    this.contentWidth = this.pageWidth - (this.margin * 2)
    this.maxWidth = this.contentWidth - 10
    this.currentY = this.margin

    // Enhanced Styling
    this.defaultFontSize = 11
    this.headerFontSize = 18
    this.lineHeight = 7
    this.messageSpacing = 10

    // Sophisticated Color Palette
    this.colors = {
      userMessageBg: [240, 240, 255],     // Soft Blue
      assistantMessageBg: [248, 248, 248], // Light Gray
      timestamp: [128, 128, 128],          // Muted Gray
      text: [0, 0, 0],                     // Black
      header: [44, 62, 80],                // Dark Blue-Gray
      headerText: [255, 255, 255]          // White
    }

    // Set default font
    this.pdf.setFont('helvetica')
  }

  // Advanced text parsing for markdown-like formatting
  private parseFormattedText(text: string, pdf: jsPDF, x: number, y: number, options: { align?: 'left' | 'right' } = {}) {
    const parts = this.tokenizeText(text)
    let currentX = x;

    parts.forEach(part => {
      switch(part.type) {
        case 'bold':
          pdf.setFont('helvetica', 'bold')
          break;
        case 'italic':
          pdf.setFont('helvetica', 'italic')
          break;
        case 'normal':
          pdf.setFont('helvetica', 'normal')
          break;
      }

      if (options.align === 'right') {
        pdf.text(part.text, this.pageWidth - this.margin - 5, y, { align: 'right' })
      } else {
        pdf.text(part.text, currentX, y)
      }

      // Measure text width to adjust positioning
      currentX += pdf.getTextWidth(part.text)
    })
  }

  // Tokenize text for advanced formatting
  private tokenizeText(text: string) {
    const tokens = [];
    const boldRegex = /\*\*(.*?)\*\*/g;
    const italicRegex = /\*(.*?)\*/g;

    let lastIndex = 0;
    let match;

    // Bold text parsing
    while ((match = boldRegex.exec(text)) !== null) {
      // Text before bold
      if (match.index > lastIndex) {
        tokens.push({ 
          type: 'normal', 
          text: text.slice(lastIndex, match.index) 
        });
      }

      // Bold text
      tokens.push({ 
        type: 'bold', 
        text: match[1] 
      });

      lastIndex = match.index + match[0].length;
    }

    // Remaining text
    if (lastIndex < text.length) {
      tokens.push({ 
        type: 'normal', 
        text: text.slice(lastIndex) 
      });
    }

    return tokens;
  }

  private addPage() {
    this.pdf.addPage()
    this.currentY = this.margin
    this.addHeader()
  }

  private checkAndAddPage(heightNeeded: number) {
    if (this.currentY + heightNeeded > this.pageHeight - this.margin) {
      this.addPage()
      return true
    }
    return false
  }

  private addHeader() {
    // Gradient-like header background
    this.pdf.setFillColor(...this.colors.header)
    this.pdf.rect(0, 0, this.pageWidth, 25, 'F')
    
    // Website Name with modern typography
    this.pdf.setFontSize(this.headerFontSize)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setTextColor(...this.colors.headerText)
    
    // Center the website name
    const websiteNameWidth = this.pdf.getTextWidth(this.websiteName)
    const centerX = (this.pageWidth - websiteNameWidth) / 2
    this.pdf.text(this.websiteName, centerX, 18)
    
    // Subtle decorative line
    this.pdf.setDrawColor(255, 255, 255)
    this.pdf.setLineWidth(0.5)
    this.pdf.line(this.margin, 25, this.pageWidth - this.margin, 25)
    
    // Reset Y position
    this.currentY = 35
  }

  private addMessage(message: Message, options: ExportOptions = {}) {
    // Text processing with advanced formatting
    const messageText = message.text || 'Loading...'
    const textLines = this.pdf.splitTextToSize(messageText, this.maxWidth)
    const textHeight = (textLines.length * this.lineHeight) + this.messageSpacing

    // Page management
    this.checkAndAddPage(textHeight + 15)

    // Message styling with subtle shadow effect
    const containerHeight = textHeight + 10
    this.pdf.setFillColor(...(
      message.isUserMessage 
        ? this.colors.userMessageBg 
        : this.colors.assistantMessageBg
    ))
    
    // Rounded rectangle with subtle shadow
    this.pdf.setDrawColor(200, 200, 200)
    this.pdf.roundedRect(
      message.isUserMessage 
        ? this.pageWidth - this.margin - this.contentWidth 
        : this.margin,
      this.currentY - 5,
      this.contentWidth,
      containerHeight,
      2, 2, 'FD'
    )

    // Timestamp with improved styling
    const timestamp = new Date(message.createdAt).toLocaleString()
    this.pdf.setFontSize(8)
    this.pdf.setTextColor(...this.colors.timestamp)
    
    const timestampText = `${message.isUserMessage ? 'You' : 'Assistant'} - ${timestamp}`
    this.pdf.text(
      timestampText,
      message.isUserMessage 
        ? this.pageWidth - this.margin - 5 
        : this.margin + 5,
      this.currentY + 3,
      { align: message.isUserMessage ? 'right' : 'left' }
    )

    // Metadata display if enabled
    if (options.includeMetadata && message.metadata) {
      const metadataText = Object.entries(message.metadata)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => `${key}: ${value}`)
        .join(' | ')
      
      this.pdf.setFontSize(8)
      this.pdf.setTextColor(...this.colors.timestamp)
      this.pdf.text(
        metadataText,
        message.isUserMessage 
          ? this.pageWidth - this.margin - 5 
          : this.margin + 5,
        this.currentY + 10,
        { align: message.isUserMessage ? 'right' : 'left' }
      )
    }

    // Message text with advanced formatting
    this.currentY += 10
    this.pdf.setFontSize(this.defaultFontSize)
    this.pdf.setTextColor(...this.colors.text)

    textLines.forEach(line => {
      if (message.isUserMessage) {
        this.parseFormattedText(line, this.pdf, 0, this.currentY, { align: 'right' })
      } else {
        this.parseFormattedText(line, this.pdf, this.margin + 5, this.currentY)
      }
      this.currentY += this.lineHeight
    })

    this.currentY += this.messageSpacing
  }

  public generatePDF(
    messages: Message[], 
    websiteName?: string, 
    options: ExportOptions = {
      includeMetadata: false,
      formatStyle: 'professional'
    }
  ) {
    // Override website name if provided
    if (websiteName) {
      this.websiteName = websiteName
    }

    // Title page and header
    this.addHeader()
    
    // Comprehensive metadata
    this.pdf.setProperties({
      title: `${this.websiteName} Conversation History`,
      subject: 'Detailed Chat Export',
      creator: `${this.websiteName} Chat Exporter`,
      author: this.websiteName,
      keywords: 'chat, conversation, export, pdf',
      creationDate: new Date().toISOString()
    })

    // Adjust message order based on format style
    const processedMessages = options.formatStyle === 'compact' 
      ? messages 
      : messages.reverse()

    // Process messages with export options
    processedMessages.forEach(message => this.addMessage(message, options))

    // Advanced footer with page numbers and export timestamp
    const pageCount = this.pdf.getNumberOfPages()
    const exportTimestamp = new Date().toLocaleString()

    for (let i = 1; i <= pageCount; i++) {
      this.pdf.setPage(i)
      this.pdf.setFontSize(8)
      this.pdf.setTextColor(...this.colors.timestamp)
      
      // Centered page numbers with website name
      this.pdf.text(
        `${this.websiteName} | Page ${i} of ${pageCount} | Exported: ${exportTimestamp}`,
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: 'center' }
      )
    }

    return this.pdf
  }
}

export default ChatPDFExporter;