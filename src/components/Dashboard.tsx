'use client';
// Dashboard.tsx

import React, { useState, useEffect } from 'react';
import { trpc } from '@/app/_trpc/client';
import UploadButton from './UploadButton';
import { Ghost, Loader2, Trash, FileText } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import Link from 'next/link';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { getUserSubscriptionPlan } from '@/lib/stripe';
import Calendar, { CalendarProps } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import ExportButton from '../components/chat/ExportButton';
import FeedbackModal from './FeedbackModal'; // Importing FeedbackModal with corrected props
import { FaStar } from 'react-icons/fa';

// Define the type for selectedDate based on react-calendar's expected value
type CalendarValue = Date | [Date, Date] | null;

interface PageProps {
  subscriptionPlan: Awaited<ReturnType<typeof getUserSubscriptionPlan>>;
}

const Dashboard: React.FC<PageProps> = ({ subscriptionPlan }) => {
  // State declarations
  const [currentlyDeletingFile, setCurrentlyDeletingFile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'date' | 'month' | 'week' | 'range'>('all');
  const [selectedDate, setSelectedDate] = useState<CalendarValue>(null); // Initialized as null
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const utils = trpc.useContext();
  const { data: files, isLoading } = trpc.getUserFiles.useQuery();

  // Mutation to delete a file
  const { mutate: deleteFile } = trpc.deleteFile.useMutation({
    onSuccess: () => {
      utils.getUserFiles.invalidate(); // Refresh the list of files after deletion
    },
    onMutate({ id }) {
      setCurrentlyDeletingFile(id); // Indicate which file is being deleted
    },
    onSettled() {
      // Reset states after mutation is settled
      setCurrentlyDeletingFile(null);
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    },
  });

  /**
   * Returns the appropriate icon based on the file type.
   * @param fileName - Name of the file
   * @returns JSX Element representing the file icon
   */
  const getFileTypeIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'doc':
      case 'docx':
        return <FileText className='h-5 w-5 text-[hsl(272.1,71.7%,47.1%)]' />;
      case 'pdf':
        return <FileText className='h-5 w-5 text-[hsl(272.1,71.7%,47.1%)]' />;
      case 'txt':
        return <FileText className='h-5 w-5 text-green-500' />;
      default:
        return <FileText className='h-5 w-5 text-gray-500' />;
    }
  };

  /**
   * Filters the files based on search query and selected date filters.
   */
  const filteredFiles = files?.filter((file) => {
    const matchesSearchQuery = file.name.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesDateFilter = true;
    const fileDate = new Date(file.createdAt);

    if (selectedFilter === 'date' && selectedDate) {
      if (Array.isArray(selectedDate) && selectedDate.length === 2) {
        // If selectedDate is a range, check if fileDate is within the range
        const [start, end] = selectedDate;
        matchesDateFilter = fileDate >= start && fileDate <= end;
      } else if (selectedDate instanceof Date) {
        // If selectedDate is a single Date, compare using toDateString
        matchesDateFilter = fileDate.toDateString() === selectedDate.toDateString();
      }
    }

    if (selectedFilter === 'month' && selectedDate) {
      const fileMonth = fileDate.getMonth();
      const fileYear = fileDate.getFullYear();
      if (Array.isArray(selectedDate) && selectedDate.length === 2) {
        const [start] = selectedDate;
        const selectedMonth = start.getMonth();
        const selectedYear = start.getFullYear();
        matchesDateFilter = fileMonth === selectedMonth && fileYear === selectedYear;
      } else if (selectedDate instanceof Date) {
        const selectedMonth = selectedDate.getMonth();
        const selectedYear = selectedDate.getFullYear();
        matchesDateFilter = fileMonth === selectedMonth && fileYear === selectedYear;
      }
    }

    if (selectedFilter === 'week' && selectedDate) {
      if (Array.isArray(selectedDate) && selectedDate.length === 2) {
        const [start, end] = selectedDate;
        matchesDateFilter = fileDate >= start && fileDate <= end;
      } else if (selectedDate instanceof Date) {
        const startOfWeek = new Date(selectedDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        matchesDateFilter = fileDate >= startOfWeek && fileDate <= endOfWeek;
      }
    }

    return matchesSearchQuery && matchesDateFilter;
  });

  /**
   * Opens the delete confirmation dialog for a specific file.
   * @param fileId - ID of the file to delete
   */
  const handleDeleteConfirmation = (fileId: string) => {
    setFileToDelete(fileId);
    setDeleteDialogOpen(true);
  };

  /**
   * Confirms the deletion of the selected file.
   */
  const confirmDelete = () => {
    if (fileToDelete) {
      deleteFile({ id: fileToDelete });
    }
  };

  /**
   * Effect to open the Feedback Modal after 2 minutes of component mount.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFeedbackOpen(true);
    }, 2 * 60 * 1000); // 2 minutes in milliseconds

    return () => clearTimeout(timer); // Cleanup the timer on unmount
  }, []);

  /**
   * Handles the submission of user feedback.
   * @param feedback - User's feedback input
   */
  const handleFeedbackSubmit = (feedback: string) => {
    // TODO: Send the feedback to your backend or API
    console.log('User Feedback:', feedback);
    // Example: trpc.sendFeedback.mutate({ feedback });
  };

  /**
   * Handles changes in the selected date or date range from the Calendar component.
   * @param value - Selected date or date range
   */
  const handleDateChange: CalendarProps['onChange'] = (value) => {
    setSelectedDate(value as CalendarValue);
  };

  return (
    <main className='mx-auto max-w-7xl p-4 md:p-10'>
      {/* Header Section */}
      <div className='mt-12 flex flex-col items-start justify-between gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:gap-0'>
        <h1 className='mb-3 font-bold text-2xl md:text-5xl text-gray-900'>My Files</h1>
        <UploadButton isSubscribed={subscriptionPlan.isSubscribed} />
      </div>

      {/* Search and Filter Section */}
      <div className='mt-6 flex flex-col gap-4 sm:flex-row sm:items-center justify-between'>
        {/* Search Input */}
        <input
          type='text'
          className='px-4 py-2 w-full sm:w-1/3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500'
          placeholder='Search files...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {/* Filter Buttons */}
        <div className='flex items-center space-x-2'>
          <Button
            variant={selectedFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedFilter('all')}
          >
            All Files
          </Button>
          <Button
            variant={selectedFilter === 'date' ? 'default' : 'outline'}
            onClick={() => setSelectedFilter('date')}
          >
            By Date
          </Button>
          <Button
            variant={selectedFilter === 'month' ? 'default' : 'outline'}
            onClick={() => setSelectedFilter('month')}
          >
            By Month
          </Button>
          <Button
            variant={selectedFilter === 'week' ? 'default' : 'outline'}
            onClick={() => setSelectedFilter('week')}
          >
            By Week
          </Button>
          <Button
            variant={selectedFilter === 'range' ? 'default' : 'outline'}
            onClick={() => setSelectedFilter('range')}
          >
            By Range
          </Button>
        </div>
      </div>

      {/* Calendar Filter */}
      {selectedFilter !== 'all' && (
        <div className='mt-6'>
          <Calendar
            onChange={handleDateChange} // Updated handler without destructuring event
            value={selectedDate}
            className='react-calendar'
            selectRange={selectedFilter === 'range'} // Enable range selection based on filter
          />
        </div>
      )}

      {/* Display User Files */}
      {filteredFiles && filteredFiles.length !== 0 ? (
        <ul className='mt-8 grid grid-cols-1 gap-6 divide-y divide-zinc-200 md:grid-cols-2 lg:grid-cols-3'>
          {filteredFiles
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((file) => (
              <li
                key={file.id}
                className='col-span-1 border border-gray-300 rounded-lg bg-white shadow-lg transition-all hover:shadow-2xl'
              >
                <Link href={`/dashboard/${file.id}`} className='block p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='truncate text-lg font-semibold text-gray-800'>{file.name}</h3>
                    {getFileTypeIcon(file.name)}
                  </div>
                  <div className='text-sm text-gray-500'>
                    Uploaded on: {format(new Date(file.createdAt), 'MMM dd, yyyy')}
                  </div>
                </Link>

                <div className='border-t border-gray-200 p-4'>
                  <Button
                    onClick={() => handleDeleteConfirmation(file.id)}
                    size='sm'
                    className='w-full bg-[hsl(271.5,81.3%,55.9%)] hover:bg-[hsl(271.5,81.3%,55.9%)] hover:bg-opacity-80'
                    variant='destructive'
                  >
                    {currentlyDeletingFile === file.id ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      <>
                        <Trash className='h-4 w-4 mr-2' />
                        Delete File
                      </>
                    )}
                  </Button>
                </div>
              </li>
            ))}
        </ul>
      ) : isLoading ? (
        // Display skeleton loaders while files are loading
        <Skeleton height={100} className='my-2' count={3} />
      ) : (
        // Message when no files are available
        <div className='mt-16 flex flex-col items-center gap-2'>
          <Ghost className='h-8 w-8 text-zinc-800' />
          <h3 className='font-semibold text-xl'>Pretty empty around here</h3>
          <p>Let&apos;s upload your first file.</p> {/* Escaped Apostrophe */}
        </div>
      )}

      {/* Confirmation Dialog for Deletion */}
      {deleteDialogOpen && (
        <div className='fixed inset-0 flex items-center justify-center z-50 bg-gray-500 bg-opacity-50'>
          <div className='bg-white p-6 rounded-lg shadow-lg max-w-sm'>
            <h3 className='font-semibold text-xl mb-4'>Confirm Deletion</h3>
            <p>Are you sure you want to delete this file?</p>
            <div className='mt-4 flex justify-between'>
              <Button variant='outline' onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant='destructive' onClick={confirmDelete}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        onSubmit={handleFeedbackSubmit} // Now correctly passed
      />

      {/* Fixed Feedback Button */}
      <Button
        className="
          hidden md:flex
          fixed bottom-4 right-4
          items-center justify-center
          rounded-full
          bg-[hsl(271.5,81.3%,55.9%)]
          w-12 h-12 /* Set width and height to make the button round */
          text-white
          shadow-md hover:shadow-lg
          hover:bg-[hsl(271.5,81.3%,65%)]
          focus:outline-none focus:ring-4 focus:ring-[hsl(271.5,81.3%,80%)]
          transition-all duration-300
          ease-in-out
        "
        onClick={() => setIsFeedbackOpen(true)}
      >
        <FaStar className='text-lg' />
      </Button>
    </main>
  );
};

export default Dashboard