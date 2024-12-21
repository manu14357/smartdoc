'use client'

import { trpc } from '@/app/_trpc/client'
import ChatInput from './ChatInput'
import Messages from './Messages'
import { ChevronLeft, Loader2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '../ui/button'
import { ChatContextProvider } from './ChatContext'
import { PLANS } from '@/config/stripe'
import { motion } from 'framer-motion' // Importing motion

interface ChatWrapperProps {
  fileId: string
  isSubscribed: boolean
}

const ChatWrapper = ({
  fileId,
  isSubscribed,
}: ChatWrapperProps) => {
  const { data, isLoading } =
    trpc.getFileUploadStatus.useQuery(
      {
        fileId,
      },
      {
        refetchInterval: (data) =>
          data?.status === 'SUCCESS' ||
          data?.status === 'FAILED'
            ? false
            : 500,
      }
    )

  if (isLoading)
    return (
      <div className='relative min-h-full bg-zinc-50 flex flex-col justify-between gap-2 divide-y divide-zinc-200 md:px-4 px-2'>
        <div className='flex-1 flex justify-center items-center flex-col mb-28'>
          <div className='flex flex-col items-center gap-2 text-center'>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className='h-8 w-8 text-blue-500' />
            </motion.div>
            <h3 className='font-semibold text-xl'>
              We are preparing your content...
            </h3>
            <p className='text-zinc-500 text-sm'>
              This might take a few moments. Hang tight!
            </p>
          </div>
        </div>

        <ChatInput isDisabled />
      </div>
    )

  if (data?.status === 'PROCESSING')
    return (
      <div className='relative min-h-full bg-zinc-50 flex flex-col justify-between gap-2 divide-y divide-zinc-200 md:px-4 px-2'>
        <div className='flex-1 flex justify-center items-center flex-col mb-28'>
          <div className='flex flex-col items-center gap-2 text-center'>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className='h-8 w-8 text-blue-500' />
            </motion.div>
            <h3 className='font-semibold text-xl'>
              Processing your PDF, almost there...
            </h3>
            <p className='text-zinc-500 text-sm'>
              Please be patient while we process the file.
            </p>
          </div>
        </div>

        <ChatInput isDisabled />
      </div>
    )

  if (data?.status === 'FAILED')
    return (
      <div className='relative min-h-full bg-zinc-50 flex flex-col justify-between gap-2 divide-y divide-zinc-200 md:px-4 px-2'>
        <div className='flex-1 flex justify-center items-center flex-col mb-28'>
          <div className='flex flex-col items-center gap-2 text-center'>
            <motion.div
              className='mt-4'
              initial={{ scale: 1 }}
              animate={{ scale: 1.2 }}
              transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
            >
              <XCircle className='h-8 w-8 text-red-500' />
            </motion.div>
            <h3 className='font-semibold text-xl'>
              Oops! Too many pages in your PDF.
            </h3>
            <p className='text-zinc-500 text-sm'>
              Your{' '}
              <span className='font-medium'>
                {isSubscribed ? 'Pro' : 'Free'}
              </span>{' '}
              plan supports up to{' '}
              {isSubscribed
                ? PLANS.find((p) => p.name === 'Pro')
                    ?.pagesPerPdf
                : PLANS.find((p) => p.name === 'Free')
                    ?.pagesPerPdf}{' '}
              pages per PDF. Consider upgrading for more pages.
            </p>
            <Link
              href='/dashboard'
              className={buttonVariants({
                variant: 'secondary',
                className: 'mt-4',
              })}>
              <ChevronLeft className='h-3 w-3 mr-1.5' />
              Back to Dashboard
            </Link>
          </div>
        </div>

        <ChatInput isDisabled />
      </div>
    )

  return (
    <ChatContextProvider fileId={fileId}>
      <div className='relative min-h-full bg-zinc-50 flex flex-col justify-between gap-2 divide-y divide-zinc-200 md:px-4 px-2'>
        <div className='flex-1 flex flex-col justify-between mb-28'>
          <Messages fileId={fileId} />
        </div>

        <ChatInput />
      </div>
    </ChatContextProvider>
  )
}

export default ChatWrapper
