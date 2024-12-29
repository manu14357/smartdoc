"use client";
import React from "react";
import { useState, useEffect, useRef } from "react";
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
  MessageSquare,
  StickyNote,
  Save,
  Edit,
  Trash2,
  Menu,
  X,
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useResizeDetector } from "react-resize-detector";
import SimpleBar from "simplebar-react";
import PdfFullscreen from "./PdfFullscreen";
import dynamic from "next/dynamic";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useToast } from "./ui/use-toast";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css"; // Quill styles

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Interfaces and Types
interface Comment {
  id: string;
  page: number;
  author: string;
  text: string;
  timestamp: number;
}

interface Note {
  id: string;
  content: string;
  timestamp: number;
}

interface PdfRendererProps {
  url: string;
}

const PdfRenderer = ({ url }: PdfRendererProps) => {
  const { toast } = useToast();
  const [numPages, setNumPages] = useState<number>();
  const [currPage, setCurrPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [renderedScale, setRenderedScale] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"single" | "double">("single");
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] =
    useState<boolean>(false);
  const [isNotepadDialogOpen, setIsNotepadDialogOpen] =
    useState<boolean>(false);
  // Advanced editing modes
  const [commentMode, setCommentMode] = useState(false);
  const [noteMode, setNoteMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Comments state
  const [comments, setComments] = useState<Comment[]>(() => {
    if (typeof window !== "undefined") {
      const savedComments = localStorage.getItem(`pdf-comments-${url}`);
      return savedComments ? JSON.parse(savedComments) : [];
    }
    return [];
  });
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [commentAuthor, setCommentAuthor] = useState("");
  const [commentText, setCommentText] = useState("");

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };
  // Notes state
  const [notes, setNotes] = useState<Note[]>(() => {
    if (typeof window !== "undefined") {
      const savedNotes = localStorage.getItem(`pdf-notes-${url}`);
      return savedNotes ? JSON.parse(savedNotes) : [];
    }
    return [];
  });
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteContent, setNoteContent] = useState("");

  // Search states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<
    { page: number; matches: number }[]
  >([]);

  // Highlighted words
  const [highlightedWord, setHighlightedWord] = useState<string>("");

  const searchInputRef = useRef<HTMLInputElement>(null);

  const isLoading = renderedScale !== scale;

  // Page navigation form
  const pageSchema = z.object({
    page: z
      .string()
      .refine(
        (val) => Number(val) > 0 && Number(val) <= (numPages || 1),
        "Page number is out of range",
      ),
  });
  type TPageSchema = z.infer<typeof pageSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TPageSchema>({
    defaultValues: { page: "1" },
    resolver: zodResolver(pageSchema),
  });

  const { width, ref } = useResizeDetector();

  // ----- Comment Logic (Advanced) -----
  const addComment = () => {
    if (!commentText.trim() || !commentAuthor.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill both Author and Comment text.",
        variant: "destructive",
      });
      return;
    }

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      page: currPage,
      author: commentAuthor,
      text: commentText,
      timestamp: Date.now(),
    };

    const updatedComments = [...comments, newComment];
    setComments(updatedComments);
    localStorage.setItem(
      `pdf-comments-${url}`,
      JSON.stringify(updatedComments),
    );

    // Reset inputs
    setCommentAuthor("");
    setCommentText("");
    setCommentMode(false);

    toast({
      title: "Comment Added",
      description: `A comment has been added for page ${currPage}.`,
    });
  };

  const editComment = (comment: Comment) => {
    setEditingComment(comment);
    setCommentAuthor(comment.author);
    setCommentText(comment.text);
    setCommentMode(false);
  };

  const saveEditedComment = () => {
    if (!editingComment) return;

    const updatedComments = comments.map((c) =>
      c.id === editingComment.id
        ? {
            ...c,
            author: commentAuthor,
            text: commentText,
            timestamp: Date.now(),
          }
        : c,
    );
    setComments(updatedComments);
    localStorage.setItem(
      `pdf-comments-${url}`,
      JSON.stringify(updatedComments),
    );

    // Reset
    setEditingComment(null);
    setCommentAuthor("");
    setCommentText("");

    toast({
      title: "Comment Updated",
      description: "The comment was successfully updated.",
    });
  };

  const removeComment = (commentId: string) => {
    const updatedComments = comments.filter((c) => c.id !== commentId);
    setComments(updatedComments);
    localStorage.setItem(
      `pdf-comments-${url}`,
      JSON.stringify(updatedComments),
    );

    toast({
      title: "Comment Removed",
      description: "The comment was successfully removed.",
    });
  };

  // ----- Note Logic (Advanced) -----
  const addNote = () => {
    if (!noteContent.trim()) {
      toast({
        title: "Validation Error",
        description: "Note content cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    const newNote: Note = {
      id: `note-${Date.now()}`,
      content: noteContent,
      timestamp: Date.now(),
    };

    const updatedNotes = [...notes, newNote];
    setNotes(updatedNotes);
    localStorage.setItem(`pdf-notes-${url}`, JSON.stringify(updatedNotes));

    // Reset
    setNoteContent("");
    setNoteMode(false);

    toast({
      title: "Note Added",
      description: "A new note has been successfully added to the notepad.",
    });
  };

  const editNote = (note: Note) => {
    setEditingNote(note);
    setNoteContent(note.content);
    setNoteMode(false);
  };

  const saveEditedNote = () => {
    if (!editingNote) return;

    const updatedNotes = notes.map((n) =>
      n.id === editingNote.id
        ? { ...n, content: noteContent, timestamp: Date.now() }
        : n,
    );
    setNotes(updatedNotes);
    localStorage.setItem(`pdf-notes-${url}`, JSON.stringify(updatedNotes));

    // Reset
    setEditingNote(null);
    setNoteContent("");

    toast({
      title: "Note Updated",
      description: "The note was successfully updated.",
    });
  };

  const removeNote = (noteId: string) => {
    const updatedNotes = notes.filter((n) => n.id !== noteId);
    setNotes(updatedNotes);
    localStorage.setItem(`pdf-notes-${url}`, JSON.stringify(updatedNotes));

    toast({
      title: "Note Removed",
      description: "The note was successfully removed.",
    });
  };

  // ----- Page Navigation -----
  const onSubmitPage = (data: TPageSchema) => {
    setCurrPage(Number(data.page));
    setValue("page", data.page);
  };

  // ----- Zoom & Rotation -----
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handlePrint = () => {
    const printWindow = window.open(url);
    printWindow?.print();
  };

  // ----- Search Logic (Advanced) -----
  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setHighlightedWord("");
      return;
    }

    try {
      const pdf = await pdfjs.getDocument(url).promise;
      const results: { page: number; matches: number }[] = [];
      let totalMatches = 0;

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => (item as { str: string }).str)
          .join(" ");

        const regex = new RegExp(searchQuery, "gi");
        const matches = (pageText.match(regex) || []).length;
        totalMatches += matches;

        if (matches > 0) {
          results.push({ page: pageNum, matches });
        }
      }

      setSearchResults(results);
      setHighlightedWord(searchQuery); // Set the word to be highlighted

      if (results.length > 0) {
        const firstMatch = results[0];
        setCurrPage(firstMatch.page);
        setValue("page", String(firstMatch.page));

        toast({
          title: "Search Results",
          description: `Found ${totalMatches} match(es) across ${results.length} page(s). Jumped to the first match.`,
        });
      } else {
        toast({
          title: "No Results",
          description: "No matches found for your search query.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Search Error",
        description: "There was an error performing the search.",
        variant: "destructive",
      });
    }
  };

  // ----- Mobile Detection -----
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768 && viewMode === "double") {
        setViewMode("single");
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [viewMode]);

  // ----- Highlighting Logic -----
  const customTextRenderer = (props: {
    str: string;
    pageIndex: number;
    pageNumber: number;
    itemIndex: number;
  }) => {
    const { str } = props;
    if (!highlightedWord) return str;
    const regex = new RegExp(`(${highlightedWord})`, "gi");
    const parts = str.split(regex);

    return parts
      .map((part, i) =>
        regex.test(part)
          ? React.createElement(
              "span",
              { key: i, style: { backgroundColor: "yellow" } },
              part,
            )
          : part,
      )
      .join("");
  };

  // ----- Mobile Gesture Handlers -----
  // Note: For advanced touch gestures like pinch-to-zoom and swipe navigation,
  // consider integrating a library like 'react-use-gesture' or 'hammer.js'.
  // Below is a basic implementation using touch events.

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchEndRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    const deltaX = touchEndRef.current.x - touchStartRef.current.x;
    const deltaY = touchEndRef.current.y - touchStartRef.current.y;

    // Simple swipe detection
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 50) {
        // Swipe Right - Previous Page
        const newPage = Math.max(currPage - 1, 1);
        setCurrPage(newPage);
        setValue("page", String(newPage));
      } else if (deltaX < -50) {
        // Swipe Left - Next Page
        if (!numPages) return;
        const newPage = Math.min(currPage + 1, numPages);
        setCurrPage(newPage);
        setValue("page", String(newPage));
      }
    }

    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  return (
    <div
      className="w-full bg-white rounded-md shadow flex flex-col items-center"
      // Add touch event handlers for mobile gestures
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchMove={isMobile ? handleTouchMove : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
    >
      {/* Top toolbar */}
      <div className="h-16 w-full border-b border-zinc-200 flex items-center justify-between px-4">
        {/* Mobile Menu Button */}
        {isMobile && (
          <div className="relative">
            <DropdownMenu
              open={isMobileMenuOpen}
              onOpenChange={setIsMobileMenuOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden relative z-50 hover:bg-gray-100 transition-colors"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5 text-gray-700" />
                  ) : (
                    <Menu className="h-5 w-5 text-gray-700" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="z-50 w-72 p-2 mt-2 border border-gray-200 rounded-lg shadow-lg bg-white animate-in fade-in-0 zoom-in-95"
                onInteractOutside={handleMobileMenuClose}
                onEscapeKeyDown={handleMobileMenuClose}
                align="start"
                sideOffset={5}
              >
                <div className="grid gap-2">
                  {/* Zoom Section */}
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-semibold text-gray-500 mb-2">
                      Zoom Controls
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <DropdownMenuItem
                        className="flex items-center justify-center p-2 hover:bg-gray-100 rounded-md transition-colors"
                        onClick={() => {
                          handleZoomOut();
                          handleMobileMenuClose();
                        }}
                      >
                        <ZoomOut className="h-4 w-4 mr-2" />
                        <span>Zoom Out</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        className="flex items-center justify-center p-2 hover:bg-gray-100 rounded-md transition-colors"
                        onClick={() => {
                          handleZoomIn();
                          handleMobileMenuClose();
                        }}
                      >
                        <ZoomIn className="h-4 w-4 mr-2" />
                        <span>Zoom In</span>
                      </DropdownMenuItem>
                    </div>
                  </div>

                  <DropdownMenuSeparator className="my-1 border-t border-gray-200" />

                  {/* Document Actions */}
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-semibold text-gray-500 mb-2">
                      Document Actions
                    </p>
                    <div className="grid gap-1.5">
                      <DropdownMenuItem
                        className="flex items-center p-2 hover:bg-gray-100 rounded-md transition-colors"
                        onClick={() => {
                          setRotation((prev) => prev + 90);
                          handleMobileMenuClose();
                        }}
                      >
                        <RotateCw className="h-4 w-4 mr-3 text-gray-600" />
                        <span>Rotate Page</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        className="flex items-center p-2 hover:bg-gray-100 rounded-md transition-colors"
                        onClick={() => {
                          window.open(url);
                          handleMobileMenuClose();
                        }}
                      >
                        <Download className="h-4 w-4 mr-3 text-gray-600" />
                        <span>Download PDF</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        className="flex items-center p-2 hover:bg-gray-100 rounded-md transition-colors"
                        onClick={() => {
                          handlePrint();
                          handleMobileMenuClose();
                        }}
                      >
                        <Printer className="h-4 w-4 mr-3 text-gray-600" />
                        <span>Print Document</span>
                      </DropdownMenuItem>
                    </div>
                  </div>

                  <DropdownMenuSeparator className="my-1 border-t border-gray-200" />

                  {/* Tools */}
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-semibold text-gray-500 mb-2">
                      Tools
                    </p>
                    <div className="grid gap-1.5">
                      <DropdownMenuItem
                        className="flex items-center p-2 hover:bg-gray-100 rounded-md transition-colors"
                        onClick={() => {
                          setIsNotepadDialogOpen(true);
                          setNoteMode(true);
                          handleMobileMenuClose();
                        }}
                      >
                        <StickyNote className="h-4 w-4 mr-3 text-gray-600" />
                        <span>Open Notepad</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        className="flex items-center p-2 hover:bg-gray-100 rounded-md transition-colors"
                        onClick={() => {
                          setIsCommentsDialogOpen(true);
                          handleMobileMenuClose();
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-3 text-gray-600" />
                        <span>View Comments</span>
                      </DropdownMenuItem>
                    </div>
                  </div>

                  {!isMobile && (
                    <>
                      <DropdownMenuSeparator className="my-1 border-t border-gray-200" />
                      <DropdownMenuItem
                        className="flex items-center p-2 hover:bg-gray-100 rounded-md transition-colors"
                        onClick={() => {
                          setViewMode(
                            viewMode === "single" ? "double" : "single",
                          );
                          handleMobileMenuClose();
                        }}
                      >
                        <BookOpen className="h-4 w-4 mr-3 text-gray-600" />
                        <span>
                          {viewMode === "single"
                            ? "Double Page"
                            : "Single Page"}
                        </span>
                      </DropdownMenuItem>
                    </>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Left side toolbar */}
        <div className="flex items-center gap-2">
          {/* Outline button hidden in example */}
          <div className="hidden md:block">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <SidebarOpen className="h-4 w-4" />
            </Button>
          </div>

          {/* Page navigation (desktop) */}
          <div className="hidden md:flex items-center gap-2 border-l border-zinc-200 pl-4">
            <Button
              disabled={currPage <= 1}
              onClick={() => {
                const newPage = Math.max(currPage - 1, 1);
                setCurrPage(newPage);
                setValue("page", String(newPage));
              }}
              variant="ghost"
              size="sm"
              className="h-8"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>

            <form
              onSubmit={handleSubmit(onSubmitPage)}
              className="flex items-center gap-1.5"
            >
              <Input
                {...register("page")}
                className={cn(
                  "w-12 h-8",
                  errors.page && "focus-visible:ring-red-500",
                )}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit(onSubmitPage)();
                }}
              />
              <span className="text-zinc-700 text-sm">/ {numPages ?? "x"}</span>
            </form>

            <Button
              disabled={!numPages || currPage === numPages}
              onClick={() => {
                const newPage = Math.min(currPage + 1, numPages || 1);
                setCurrPage(newPage);
                setValue("page", String(newPage));
              }}
              variant="ghost"
              size="sm"
              className="h-8"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Right side toolbar */}
        <div className="hidden md:flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1.5 border-r border-zinc-200 pr-4">
            <Button
              onClick={handleZoomOut}
              variant="ghost"
              size="sm"
              className="h-8"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 h-8">
                  <Search className="h-4 w-4" />
                  {Math.round(scale * 100)}%
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setScale(0.5)}>
                  50%
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setScale(1)}>
                  100%
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setScale(1.5)}>
                  150%
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setScale(2)}>
                  200%
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setScale(1)}>
                  Reset
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={handleZoomIn}
              variant="ghost"
              size="sm"
              className="h-8"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Rotate, Download, Print, View mode */}
          <div className="flex items-center gap-1.5">
            <Button
              onClick={() => setRotation((prev) => prev + 90)}
              variant="ghost"
              size="sm"
              className="h-8"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => window.open(url)}
              variant="ghost"
              size="sm"
              className="h-8"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              onClick={handlePrint}
              variant="ghost"
              size="sm"
              className="h-8"
            >
              <Printer className="h-4 w-4" />
            </Button>
            {!isMobile && (
              <Button
                onClick={() =>
                  setViewMode(viewMode === "single" ? "double" : "single")
                }
                variant="ghost"
                size="sm"
                className="h-8"
              >
                <BookOpen className="h-4 w-4" />
              </Button>
            )}
            <PdfFullscreen fileUrl={url} />
          </div>

          {/* Comments, Notes, and Search */}
          <div className="flex items-center gap-1.5">
            {/* Comments */}
            <Dialog
              open={isCommentsDialogOpen}
              onOpenChange={setIsCommentsDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <MessageSquare className="h-4 w-4" />
                  Comments
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>PDF Comments (Advanced)</DialogTitle>
                </DialogHeader>
                <div className="mt-4 space-y-4">
                  {/* Add or Edit Comment Block */}
                  {commentMode || editingComment ? (
                    <div className="flex flex-col gap-2">
                      <Input
                        placeholder="Author name"
                        value={commentAuthor}
                        onChange={(e) => setCommentAuthor(e.target.value)}
                      />
                      <Textarea
                        placeholder="Write your comment here..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                      />
                      <div className="flex justify-end gap-2">
                        {editingComment ? (
                          <Button onClick={saveEditedComment}>Save</Button>
                        ) : (
                          <Button onClick={addComment}>Add</Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => {
                            setCommentMode(false);
                            setEditingComment(null);
                            setCommentAuthor("");
                            setCommentText("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={() => {
                        setCommentMode(true);
                        setEditingComment(null);
                      }}
                    >
                      Add Comment to Page {currPage}
                    </Button>
                  )}

                  <div>
                    <h3 className="font-semibold mb-2 text-md">
                      Existing Comments (Page {currPage})
                    </h3>
                    {comments.filter((c) => c.page === currPage).length ===
                    0 ? (
                      <p className="text-sm text-zinc-500">
                        No comments on this page.
                      </p>
                    ) : (
                      comments
                        .filter((c) => c.page === currPage)
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .map((c) => (
                          <div
                            key={c.id}
                            className="bg-green-50 border-l-4 border-green-500 p-2 mb-2 rounded flex justify-between items-start"
                          >
                            <div>
                              <p className="text-xs font-semibold">
                                {c.author}
                              </p>
                              <p className="text-sm">{c.text}</p>
                            </div>
                            <div className="flex gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => editComment(c)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeComment(c.id)}
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

            {/* Notepad */}
            <Dialog
              open={isNotepadDialogOpen}
              onOpenChange={setIsNotepadDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <StickyNote className="h-4 w-4" />
                  Notepad
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Advanced Notepad</DialogTitle>
                </DialogHeader>
                <div className="mt-4 space-y-4">
                  {/* Add or Edit Note Block */}
                  {noteMode || editingNote ? (
                    <div className="flex flex-col gap-2">
                      <ReactQuill
                        theme="snow"
                        value={noteContent}
                        onChange={setNoteContent}
                        placeholder="Write your note here..."
                      />
                      <div className="flex justify-end gap-2">
                        {editingNote ? (
                          <Button onClick={saveEditedNote}>Save</Button>
                        ) : (
                          <Button onClick={addNote}>Add</Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => {
                            setNoteMode(false);
                            setEditingNote(null);
                            setNoteContent("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={() => {
                        setNoteMode(true);
                        setEditingNote(null);
                      }}
                    >
                      Add Note
                    </Button>
                  )}

                  <div>
                    <h3 className="font-semibold mb-2 text-md">Your Notes</h3>
                    {notes.length === 0 ? (
                      <p className="text-sm text-zinc-500">No notes yet.</p>
                    ) : (
                      notes
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .map((n) => (
                          <div
                            key={n.id}
                            className="bg-yellow-50 border-l-4 border-yellow-500 p-2 mb-2 rounded flex justify-between items-start"
                          >
                            <div
                              className="prose"
                              // Safely render HTML content from ReactQuill
                              dangerouslySetInnerHTML={{ __html: n.content }}
                            ></div>
                            <div className="flex gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => editNote(n)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeNote(n.id)}
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

            {/* Search */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Search className="h-4 w-4" />
                  Search
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Search in PDF</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input
                    ref={searchInputRef}
                    placeholder="Enter your search query..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") performSearch();
                    }}
                  />
                  <Button onClick={performSearch}>Search</Button>
                  <div>
                    <h3 className="font-semibold mb-2 text-md">Results</h3>
                    {searchResults.length === 0 ? (
                      <p className="text-sm text-zinc-500">No results found.</p>
                    ) : (
                      <div>
                        <p className="text-sm text-zinc-700 mb-2">
                          Total Matches:{" "}
                          {searchResults.reduce(
                            (acc, curr) => acc + curr.matches,
                            0,
                          )}
                        </p>
                        {searchResults.map((result) => (
                          <div
                            key={result.page}
                            className="flex justify-between items-center"
                          >
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setCurrPage(result.page);
                                setValue("page", String(result.page));
                              }}
                              className="flex-1 text-left"
                            >
                              Page {result.page} - {result.matches} match(es)
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 p-2 flex justify-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            disabled={currPage <= 1}
            onClick={() => {
              const newPage = Math.max(1, currPage - 1);
              setCurrPage(newPage);
              setValue("page", String(newPage));
            }}
          >
            Previous
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!numPages || currPage >= numPages}
            onClick={() => {
              if (!numPages) return;
              const newPage = Math.min(currPage + 1, numPages);
              setCurrPage(newPage);
              setValue("page", String(newPage));
            }}
          >
            Next
          </Button>
        </div>
      )}

      {/* PDF Viewer */}
      <div className="flex-1 w-full max-h-screen">
        <SimpleBar autoHide={false} className="max-h-[calc(100vh-9rem)]">
          <div ref={ref}>
            <Document
              file={url}
              loading={
                <div className="flex justify-center">
                  <Loader2 className="my-24 h-6 w-6 animate-spin" />
                </div>
              }
              onLoadError={() => {
                toast({
                  title: "Error Loading PDF",
                  description: "Check the file or try again later.",
                  variant: "destructive",
                });
              }}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              className="max-h-full"
            >
              <div
                className={cn(
                  "flex justify-center relative",
                  viewMode === "double" && !isMobile ? "gap-4" : "",
                )}
              >
                {isLoading && renderedScale ? (
                  <Page
                    pageNumber={currPage}
                    width={
                      width
                        ? viewMode === "double" && !isMobile
                          ? width / 2
                          : width
                        : 1
                    }
                    scale={scale}
                    rotate={rotation}
                    key={`loading-${renderedScale}`}
                  />
                ) : null}
                <Page
                  pageNumber={currPage}
                  className={isLoading ? "hidden" : ""}
                  width={
                    width
                      ? viewMode === "double" && !isMobile
                        ? width / 2
                        : width
                      : 1
                  }
                  scale={scale}
                  rotate={rotation}
                  key={`page-${scale}`}
                  loading={
                    <div className="flex justify-center">
                      <Loader2 className="my-24 h-6 w-6 animate-spin" />
                    </div>
                  }
                  onRenderSuccess={() => setRenderedScale(scale)}
                  renderTextLayer={true}
                  customTextRenderer={customTextRenderer} // Apply custom text renderer
                />
                {/* If in double mode, show next page side-by-side when available */}
                {viewMode === "double" &&
                  !isMobile &&
                  currPage < (numPages || 1) && (
                    <Page
                      pageNumber={currPage + 1}
                      width={width ? width / 2 : 1}
                      scale={scale}
                      rotate={rotation}
                      renderTextLayer={true}
                      customTextRenderer={customTextRenderer}
                    />
                  )}
              </div>
            </Document>
          </div>
        </SimpleBar>
      </div>

      {/* Validation Errors */}
      {errors.page && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center">
          <div className="bg-red-500 text-white px-4 py-2 rounded-md">
            {errors.page.message || "Invalid page number."}
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfRenderer;
