// src/components/Dashboard.tsx

'use client';

import { trpc } from '@/app/_trpc/client';
import UploadButton from './UploadButton';
import { Ghost, Loader2, Trash, FileText } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import Link from 'next/link';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';
import { getUserSubscriptionPlan } from '@/lib/stripe';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import ExportButton from '../components/chat/ExportButton';
import FeedbackModal from './FeedbackModal'; // Import the FeedbackModal component
import { FaStar } from "react-icons/fa";
interface PageProps {
  subscriptionPlan: Awaited<ReturnType<typeof getUserSubscriptionPlan>>;
}

const Dashboard = ({ subscriptionPlan }: PageProps) => {
  const [currentlyDeletingFile, setCurrentlyDeletingFile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'date' | 'month' | 'week'>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  const [isHovered, setIsHovered] = useState(false);
  // State for Feedback Modal
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const utils = trpc.useContext();
  const { data: files, isLoading } = trpc.getUserFiles.useQuery();

  const { mutate: deleteFile } = trpc.deleteFile.useMutation({
    onSuccess: () => {
      utils.getUserFiles.invalidate();
    },
    onMutate({ id }) {
      setCurrentlyDeletingFile(id);
    },
    onSettled() {
      setCurrentlyDeletingFile(null);
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    },
  });

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

  const filteredFiles = files?.filter((file) => {
    const matchesSearchQuery = file.name.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesDateFilter = true;
    if (selectedFilter === 'date' && selectedDate) {
      const fileDate = new Date(file.createdAt);
      matchesDateFilter = fileDate.toDateString() === selectedDate.toDateString();
    }

    if (selectedFilter === 'month' && selectedDate) {
      const fileDate = new Date(file.createdAt);
      matchesDateFilter =
        fileDate.getMonth() === selectedDate.getMonth() &&
        fileDate.getFullYear() === selectedDate.getFullYear();
    }

    if (selectedFilter === 'week' && selectedDate) {
      const fileDate = new Date(file.createdAt);
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      matchesDateFilter = fileDate >= startOfWeek && fileDate <= endOfWeek;
    }

    return matchesSearchQuery && matchesDateFilter;
  });

  // Handle the confirmation of file deletion
  const handleDeleteConfirmation = (fileId: string) => {
    setFileToDelete(fileId);
    setDeleteDialogOpen(true);
  };

  // Handle the actual deletion of file after confirmation
  const confirmDelete = () => {
    if (fileToDelete) {
      deleteFile({ id: fileToDelete });
    }
  };

  // Effect to open Feedback Modal after 2 minutes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFeedbackOpen(true);
    }, 0.2 * 60 * 1000); // 2 minutes in milliseconds

    return () => clearTimeout(timer);
  }, []);

  // Handle Feedback Submission
  const handleFeedbackSubmit = (feedback: string) => {
    // TODO: Send the feedback to your backend or API
    console.log('User Feedback:', feedback);
    // Example: trpc.sendFeedback.mutate({ feedback });
  };

  return (
    <main className='mx-auto max-w-7xl p-4 md:p-10'>
      <div className='mt-12 flex flex-col items-start justify-between gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:gap-0'>
        <h1 className='mb-3 font-bold text-2xl md:text-5xl text-gray-900'>My Files</h1>
        <UploadButton isSubscribed={subscriptionPlan.isSubscribed} />
      </div>

      {/* Search and Filter Section */}
      <div className='mt-6 flex flex-col gap-4 sm:flex-row sm:items-center justify-between'>
        <input
          type='text'
          className='px-4 py-2 w-full sm:w-1/3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500'
          placeholder='Search files...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className='flex items-center space-x-2'>
          <Button
            variant={selectedFilter === 'all' ? 'primary' : 'outline'}
            onClick={() => setSelectedFilter('all')}
          >
            All Files
          </Button>
          <Button
            variant={selectedFilter === 'date' ? 'primary' : 'outline'}
            onClick={() => setSelectedFilter('date')}
          >
            By Date
          </Button>
          <Button
            variant={selectedFilter === 'month' ? 'primary' : 'outline'}
            onClick={() => setSelectedFilter('month')}
          >
            By Month
          </Button>
          <Button
            variant={selectedFilter === 'week' ? 'primary' : 'outline'}
            onClick={() => setSelectedFilter('week')}
          >
            By Week
          </Button>
        </div>
      </div>

      {/* Calendar Filter */}
      {selectedFilter !== 'all' && (
        <div className='mt-6'>
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            className='react-calendar'
          />
        </div>
      )}

      {/* Display all user files */}
      {filteredFiles && filteredFiles.length !== 0 ? (
        <ul className='mt-8 grid grid-cols-1 gap-6 divide-y divide-zinc-200 md:grid-cols-2 lg:grid-cols-3'>
          {filteredFiles
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((file) => (
              <li
                key={file.id}
                className='col-span-1 border border-gray-300 rounded-lg bg-white shadow-lg transition-all hover:shadow-2xl'>
                <Link href={`/dashboard/${file.id}`} className='block p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='truncate text-lg font-semibold text-gray-800'>{file.name}</h3>
                    {getFileTypeIcon(file.name)}
                  </div>
                  <div className='text-sm text-gray-500'>
                    Uploaded on: {format(new Date(file.createdAt), 'MMM dd, yyyy')}
                  </div>
                </Link>

                <div className='border-t border-gray-200 p-4 '>
                  <Button
                    onClick={() => handleDeleteConfirmation(file.id)}
                    size='sm'
                    className='w-full bg-[hsl(271.5,81.3%,55.9%)] hover:bg-[hsl(271.5,81.3%,55.9%)] hover:bg-opacity-80'
                    variant='destructive'>
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
        <Skeleton height={100} className='my-2' count={3} />
      ) : (
        <div className='mt-16 flex flex-col items-center gap-2'>
          <Ghost className='h-8 w-8 text-zinc-800' />
          <h3 className='font-semibold text-xl'>Pretty empty around here</h3>
          <p>Let&apos;s upload your first file.</p>
        </div>
      )}

      {/* Confirmation Dialog */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-500 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm">
            <h3 className="font-semibold text-xl mb-4">Confirm Deletion</h3>
            <p>Are you sure you want to delete this file?</p>
            <div className="mt-4 flex justify-between">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
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
        onSubmit={handleFeedbackSubmit}
      />

      {/* Fixed Feedback Button */}
      <Button
      className="
        hidden md:flex
        fixed bottom-4 right-4
        items-center justify-center
        rounded-full
        bg-[hsl(271.5,81.3%,55.9%)]
        w-12 h-12  // Set width and height to make the button round
        text-white
        shadow-md hover:shadow-lg
        hover:bg-[hsl(271.5,81.3%,65%)]
        focus:outline-none focus:ring-4 focus:ring-[hsl(271.5,81.3%,80%)]
        transition-all duration-300
        ease-in-out
      "
      onClick={() => setIsFeedbackOpen(true)}
    >
      <FaStar className="text-lg" />
    </Button>
    </main>
  );
};

export default Dashboard;