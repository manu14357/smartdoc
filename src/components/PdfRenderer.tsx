'use client'

import {
  ChevronDown,
  ChevronUp,
  Loader2,
  RotateCw,
  Search,
  ZoomIn,
  ZoomOut,
  Download,
  Printer,
  SidebarOpen,
  BookOpen,
  Settings,
  Menu,
  FileText,
  FilePlus,
  FileCheck,
  Edit,
  Save,
  Trash2
} from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { useToast } from './ui/use-toast'
import { useResizeDetector } from 'react-resize-detector'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu'
import SimpleBar from 'simplebar-react'
import PdfFullscreen from './PdfFullscreen'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

// Interfaces and Types
interface Bookmark {
  page: number
  name?: string
  timestamp: number
}

interface Annotation {
  id: string
  page: number
  text: string
  timestamp: number
}

interface PdfRendererProps {
  url: string
}

const PdfRenderer = ({ url }: PdfRendererProps) => {
  const { toast } = useToast()
  const [numPages, setNumPages] = useState<number>()
  const [currPage, setCurrPage] = useState<number>(1)
  const [scale, setScale] = useState<number>(1)
  const [rotation, setRotation] = useState<number>(0)
  const [renderedScale, setRenderedScale] = useState<number | null>(null)
  const [isOutlineOpen, setIsOutlineOpen] = useState<boolean>(false)
  const [viewMode, setViewMode] = useState<'single' | 'double'>('single')
  const [isMobile, setIsMobile] = useState<boolean>(false)
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  
  // Bookmarks State
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    if (typeof window !== 'undefined') {
      const savedBookmarks = localStorage.getItem(`pdf-bookmarks-${url}`)
      return savedBookmarks ? JSON.parse(savedBookmarks) : []
    }
    return []
  })

  // Annotations State
  const [annotations, setAnnotations] = useState<Annotation[]>(() => {
    if (typeof window !== 'undefined') {
      const savedAnnotations = localStorage.getItem(`pdf-annotations-${url}`)
      return savedAnnotations ? JSON.parse(savedAnnotations) : []
    }
    return []
  })

  // Annotation Editing States
  const [isAnnotationMode, setIsAnnotationMode] = useState(false)
  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(null)
  const [newAnnotationText, setNewAnnotationText] = useState('')

  // Bookmarks Dialog State
  const [isBookmarkDialogOpen, setIsBookmarkDialogOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<{page: number, matches: number}[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)

  const isLoading = renderedScale !== scale

  // Update bookmarks in localStorage
  const updateBookmarks = useCallback((newBookmarks: Bookmark[]) => {
    setBookmarks(newBookmarks)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`pdf-bookmarks-${url}`, JSON.stringify(newBookmarks))
    }
  }, [url])

  // Update annotations in localStorage
  const updateAnnotations = useCallback((newAnnotations: Annotation[]) => {
    setAnnotations(newAnnotations)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`pdf-annotations-${url}`, JSON.stringify(newAnnotations))
    }
  }, [url])

  // Bookmark Methods
  const addBookmark = () => {
    const newBookmark: Bookmark = {
      page: currPage,
      timestamp: Date.now(),
      name: `Page ${currPage}`
    }
    const updatedBookmarks = [...bookmarks, newBookmark]
    updateBookmarks(updatedBookmarks)
    
    toast({
      title: 'Bookmark Added',
      description: `Bookmarked page ${currPage}`,
      variant: 'default'
    })
  }

  const removeBookmark = (timestamp: number) => {
    const updatedBookmarks = bookmarks.filter(b => b.timestamp !== timestamp)
    updateBookmarks(updatedBookmarks)
  }

  const goToBookmark = (page: number) => {
    setCurrPage(page)
    setValue('page', String(page))
    setIsBookmarkDialogOpen(false)
  }

  // Annotation Methods
  const addAnnotation = () => {
    if (!newAnnotationText.trim()) return

    const newAnnotation: Annotation = {
      id: `annotation-${Date.now()}`,
      page: currPage,
      text: newAnnotationText,
      timestamp: Date.now()
    }

    const updatedAnnotations = [...annotations, newAnnotation]
    updateAnnotations(updatedAnnotations)
    
    // Reset annotation input
    setNewAnnotationText('')
    setIsAnnotationMode(false)

    toast({
      title: 'Annotation Added',
      description: `Added annotation to page ${currPage}`,
      variant: 'default'
    })
  }

  const startEditingAnnotation = (annotation: Annotation) => {
    setEditingAnnotation(annotation)
    setNewAnnotationText(annotation.text)
  }

  const saveEditedAnnotation = () => {
    if (!editingAnnotation) return

    const updatedAnnotations = annotations.map(a => 
      a.id === editingAnnotation.id 
        ? { ...a, text: newAnnotationText, timestamp: Date.now() }
        : a
    )

    updateAnnotations(updatedAnnotations)
    
    // Reset editing state
    setEditingAnnotation(null)
    setNewAnnotationText('')

    toast({
      title: 'Annotation Updated',
      description: 'Successfully updated the annotation',
      variant: 'default'
    })
  }

  const removeAnnotation = (annotationId: string) => {
    const updatedAnnotations = annotations.filter(a => a.id !== annotationId)
    updateAnnotations(updatedAnnotations)

    toast({
      title: 'Annotation Removed',
      description: 'Annotation has been deleted',
      variant: 'default'
    })
  }

  // Page Validation Schema
  const CustomPageValidator = z.object({
    page: z.string().refine(
      (num) => Number(num) > 0 && Number(num) <= (numPages || 1)
    ),
  })

  type TCustomPageValidator = z.infer<typeof CustomPageValidator>

  // Form Handling
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TCustomPageValidator>({
    defaultValues: {
      page: '1',
    },
    resolver: zodResolver(CustomPageValidator),
  })

  // Resize Detection
  const { width, ref } = useResizeDetector()

  // Page Navigation
  const handlePageSubmit = ({ page }: TCustomPageValidator) => {
    setCurrPage(Number(page))
    setValue('page', String(page))
  }

  // Zoom and Rotation Handlers
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 3))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5))
  }

  const handlePrint = () => {
    const printWindow = window.open(url)
    printWindow?.print()
  }

  // Mobile Detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768 && viewMode === 'double') {
        setViewMode('single')
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [viewMode])

  // Search Functionality
  const performSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      const pdf = await pdfjs.getDocument(url).promise
      const results: {page: number, matches: number}[] = []

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map(item => 
          (item as {str: string}).str
        ).join(' ')

        const matches = (pageText.match(new RegExp(searchQuery, 'gi')) || []).length
        
        if (matches > 0) {
          results.push({ page: pageNum, matches })
        }
      }

      setSearchResults(results)
      
      if (results.length > 0) {
        setCurrPage(results[0].page)
        setValue('page', String(results[0].page))
        
        toast({
          title: 'Search Results',
          description: `Found ${results.length} pages with matches`,
          variant: 'default'
        })
      } else {
        toast({
          title: 'No Results',
          description: 'No pages found matching the search query',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Search Error',
        description: 'Unable to perform search',
        variant: 'destructive'
      })
    }
  }

  // Dialogs and UI Components
  const MobileControls = () => (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      {/* Mobile controls implementation */}
    </Dialog>
  )

  const BookmarkDialog = () => (
    <Dialog open={isBookmarkDialogOpen} onOpenChange={setIsBookmarkDialogOpen}>
      {/* Bookmark dialog implementation */}
    </Dialog>
  )

  const AnnotationDialog = () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <Edit className="h-4 w-4" />
          Annotations
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>PDF Annotations</DialogTitle>
        </DialogHeader>
        
        {/* Annotation input and list */}
        <div className="space-y-4">
          {isAnnotationMode ? (
            <div className="flex flex-col gap-2">
              <Textarea
                placeholder="Enter your annotation"
                value={newAnnotationText}
                onChange={(e) => setNewAnnotationText(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={addAnnotation}>Save</Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAnnotationMode(false)
                    setNewAnnotationText('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button 
              onClick={() => setIsAnnotationMode(true)}
              className="w-full"
            >
              Add Annotation for Page {currPage}
            </Button>
          )}

          {/* Existing Annotations List */}
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Existing Annotations</h3>
            {annotations.length === 0 ? (
              <p className="text-center text-zinc-500">No annotations yet</p>
            ) : (
              annotations
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((annotation) => (
                  <div 
                    key={annotation.id} 
                    className="border-b pb-2 mb-2 flex justify-between items-start"
                  >
                    <div>
                      <p className="text-sm font-medium">Page {annotation.page}</p>
                      {editingAnnotation?.id === annotation.id ? (
                        <Textarea
                          value={newAnnotationText}
                          onChange={(e) => setNewAnnotationText(e.target.value)}
                          className="mt-2"
                        />
                      ) : (
                        <p className="text-zinc-700">{annotation.text}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {editingAnnotation?.id === annotation.id ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={saveEditedAnnotation}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => startEditingAnnotation(annotation)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeAnnotation(annotation.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  const SearchDialog = () => (
    <Dialog>
      {/* Search dialog implementation */}
    </Dialog>
  )

  // ... [Previous code continues]

  return (
    <div className="w-full bg-white rounded-md shadow flex flex-col items-center">
      {/* Top Toolbar */}
      <div className="h-16 w-full border-b border-zinc-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <MobileControls />
          
          <div className="hidden md:flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOutlineOpen(!isOutlineOpen)}
                    className="gap-1.5">
                    <SidebarOpen className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle Outline</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex items-center gap-1.5 border-l border-zinc-200 pl-4">
              <div className="flex items-center gap-1.5">
                <Button
                  disabled={currPage <= 1}
                  onClick={() => {
                    setCurrPage((prev) => (prev - 1 > 1 ? prev - 1 : 1))
                    setValue('page', String(currPage - 1))
                  }}
                  variant="ghost"
                  size="sm"
                  className="h-8">
                  <ChevronDown className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1.5">
                  <Input
                    {...register('page')}
                    className={cn(
                      'w-12 h-8',
                      errors.page && 'focus-visible:ring-red-500'
                    )}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSubmit(handlePageSubmit)()
                      }
                    }}
                  />
                  <p className="text-zinc-700 text-sm space-x-1">
                    <span>/</span>
                    <span>{numPages ?? 'x'}</span>
                  </p>
                </div>

                <Button
                  disabled={numPages === undefined || currPage === numPages}
                  onClick={() => {
                    setCurrPage((prev) =>
                      prev + 1 > numPages! ? numPages! : prev + 1
                    )
                    setValue('page', String(currPage + 1))
                  }}
                  variant="ghost"
                  size="sm"
                  className="h-8">
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1.5 border-r border-zinc-200 pr-4">
            <Button
              onClick={handleZoomOut}
              variant="ghost"
              size="sm"
              className="h-8">
              <ZoomOut className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-1.5" aria-label="zoom" variant="ghost" size="sm">
                  <Search className="h-4 w-4" />
                  {Math.round(scale * 100)}%
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => setScale(0.5)}>
                  50%
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setScale(1)}>
                  100%
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setScale(1.5)}>
                  150%
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setScale(2)}>
                  200%
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setScale(1)}>
                  Reset
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={handleZoomIn}
              variant="ghost"
              size="sm"
              className="h-8">
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Additional Controls */}
          <div className="flex items-center gap-1.5">
            <Button
              onClick={() => setRotation((prev) => prev + 90)}
              variant="ghost"
              size="sm"
              className="h-8">
              <RotateCw className="h-4 w-4" />
            </Button>

            <Button
              onClick={() => window.open(url)}
              variant="ghost"
              size="sm"
              className="h-8">
              <Download className="h-4 w-4" />
            </Button>

            <Button
              onClick={handlePrint}
              variant="ghost"
              size="sm"
              className="h-8">
              <Printer className="h-4 w-4" />
            </Button>

            {!isMobile && (
              <Button
                onClick={() => setViewMode(viewMode === 'single' ? 'double' : 'single')}
                variant="ghost"
                size="sm"
                className="h-8">
                <BookOpen className="h-4 w-4" />
              </Button>
            )}

            <PdfFullscreen fileUrl={url} />
          </div>

          {/* Annotations and Search Controls */}
          <div className="flex items-center gap-1.5">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={addBookmark}
              className="gap-1.5"
            >
              <FilePlus className="h-4 w-4" />
              Bookmark
            </Button>
            <BookmarkDialog />
            <AnnotationDialog />
            <SearchDialog />
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 w-full max-h-screen">
        <SimpleBar autoHide={false} className="max-h-[calc(100vh-10rem)]">
          <div ref={ref}>
            <Document
              loading={
                <div className="flex justify-center">
                  <Loader2 className="my-24 h-6 w-6 animate-spin" />
                </div>
              }
              onLoadError={() => {
                toast({
                  title: 'Error loading PDF',
                  description: 'Please try again later',
                  variant: 'destructive',
                })
              }}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              file={url}
              className="max-h-full">
              <div className={cn(
                'flex justify-center relative',
                viewMode === 'double' && !isMobile && 'gap-4'
              )}>
                {isLoading && renderedScale ? (
                  <Page
                    width={width ? (viewMode === 'double' && !isMobile ? width / 2 : width) : 1}
                    pageNumber={currPage}
                    scale={scale}
                    rotate={rotation}
                    key={'@' + renderedScale}
                  />
                ) : null}

                <Page
                  className={cn(isLoading ? 'hidden' : '')}
                  width={width ? (viewMode === 'double' && !isMobile ? width / 2 : width) : 1}
                  pageNumber={currPage}
                  scale={scale}
                  rotate={rotation}
                  key={'@' + scale}
                  loading={
                    <div className="flex justify-center">
                      <Loader2 className="my-24 h-6 w-6 animate-spin" />
                    </div>
                  }
                  onRenderSuccess={() => setRenderedScale(scale)}
                />
  
                {viewMode === 'double' && !isMobile && currPage < numPages! && (
                  <Page
                    width={width ? width / 2 : 1}
                    pageNumber={currPage + 1}
                    scale={scale}
                    rotate={rotation}
                  />
                )}
              </div>

              {/* Annotations Display */}
              <div className="mt-4 px-4">
                {annotations
                  .filter(a => a.page === currPage)
                  .map((annotation) => (
                    <div 
                      key={annotation.id} 
                      className="bg-blue-50 border-l-4 border-blue-500 p-2 mb-2"
                    >
                      <p className="text-sm text-zinc-700">{annotation.text}</p>
                    </div>
                  ))
                }
              </div>
            </Document>
          </div>
        </SimpleBar>
      </div>
  
      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 p-2 flex justify-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            disabled={currPage <= 1}
            onClick={() => {
              setCurrPage((prev) => (prev - 1 > 1 ? prev - 1 : 1))
              setValue('page', String(currPage - 1))
            }}>
            Previous
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={numPages === undefined || currPage === numPages}
            onClick={() => {
              setCurrPage((prev) =>
                prev + 1 > numPages! ? numPages! : prev + 1
              )
              setValue('page', String(currPage + 1))
            }}>
            Next
          </Button>
        </div>
      )}
  
      {/* Page Number Validation Toast */}
      {errors.page && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center">
          <div className="bg-red-500 text-white px-4 py-2 rounded-md">
            Please enter a valid page number
          </div>
        </div>
      )}
    </div>
  )
}

export default PdfRenderer