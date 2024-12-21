import { cn } from '@/lib/utils'
import { ExtendedMessage } from '@/types/message'
import { Icons } from '../Icons'
import ReactMarkdown from 'react-markdown'
import { format } from 'date-fns'
import { forwardRef, useState, useEffect } from 'react'
import { FiClipboard, FiCheck } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'

interface MessageProps {
  message: ExtendedMessage
  isNextMessageSamePerson: boolean
}

const Message = forwardRef<HTMLDivElement, MessageProps>(
  ({ message, isNextMessageSamePerson }, ref) => {
    const [copied, setCopied] = useState(false)
    const [isHovered, setIsHovered] = useState(false)

    const handleCopy = () => {
      navigator.clipboard.writeText(message.text)
      setCopied(true)
      
      const timer = setTimeout(() => {
        setCopied(false)
      }, 2000)

      return () => clearTimeout(timer)
    }

    if (message.id === 'loading-message') {
      return (
        <div className="flex justify-center items-center py-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ 
              repeat: Infinity, 
              duration: 1.5, 
              ease: "linear" 
            }}
            className="w-10 h-10"
          >
            <Icons.logo className='fill-gray-400 w-full h-full' />
          </motion.div>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn('flex items-end group relative', {
          'justify-end': message.isUserMessage,
        })}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Avatar Section */}
        <div
          className={cn(
            'relative flex h-8 w-8 aspect-square items-center justify-center',
            {
              'order-2 bg-blue-500/80 backdrop-blur-sm rounded-full':
                message.isUserMessage,
              'order-1 bg-gray-700/80 backdrop-blur-sm rounded-full':
                !message.isUserMessage,
              'invisible': isNextMessageSamePerson,
            }
          )}>
          {message.isUserMessage ? (
            <Icons.user className='fill-white text-white h-3/4 w-3/4' />
          ) : (
            <Icons.logo className='fill-white w-90 h-90' />
          )}
        </div>

        {/* Message Content Section */}
        <div
          className={cn(
            'flex flex-col space-y-2 text-base max-w-md mx-2 relative',
            {
              'order-1 items-end': message.isUserMessage,
              'order-2 items-start': !message.isUserMessage,
            }
          )}>
          <div
            className={cn(
              'px-4 py-2 rounded-lg inline-block relative group transition-all duration-300 ease-in-out w-full backdrop-blur-sm',
              {
                'bg-blue-500/80 shadow-lg':
                  message.isUserMessage,
                'bg-gray-100/80 shadow-sm':
                  !message.isUserMessage,
                'rounded-br-none':
                  !isNextMessageSamePerson &&
                  message.isUserMessage,
                'rounded-bl-none':
                  !isNextMessageSamePerson &&
                  !message.isUserMessage,
              }
            )}>
            {/* Message Text with Enhanced Mobile Contrast */}
            {typeof message.text === 'string' ? (
              <ReactMarkdown
                className={cn('prose text-sm sm:text-base pb-4', {
                  'text-white sm:text-white font-medium': message.isUserMessage,
                  'text-gray-900 sm:text-gray-800 font-medium': !message.isUserMessage,
                  'prose-headings:text-current prose-strong:text-current prose-code:text-current':
                    true,
                })}>
                {message.text}
              </ReactMarkdown>
            ) : (
              message.text
            )}

            {/* Copy Button for AI Messages */}
            {!message.isUserMessage && message.text && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-0 right-0 mb-1 mr-1"
                >
                  <button
                    onClick={handleCopy}
                    className={cn(
                      'p-1.5 rounded-lg bg-white/90 hover:bg-white focus:outline-none transition duration-200 ease-in-out',
                      {
                        'text-gray-700 hover:text-gray-900': !copied,
                        'text-green-500': copied,
                      }
                    )}>
                    {copied ? (
                      <FiCheck size={16} className="text-green-500" />
                    ) : (
                      <FiClipboard size={16} />
                    )}
                  </button>
                </motion.div>
              </AnimatePresence>
            )}

            {/* Timestamp with Enhanced Visibility */}
            <div
              className={cn(
                'text-xs select-none absolute bottom-0 left-0 ml-4 mb-1 font-medium',
                {
                  'text-blue-50': message.isUserMessage,
                  'text-gray-600': !message.isUserMessage,
                }
              )}>
              {format(
                new Date(message.createdAt),
                'HH:mm'
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
)

Message.displayName = 'Message'

export default Message