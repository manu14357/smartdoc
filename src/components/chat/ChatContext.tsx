import React, {
  ReactNode,
  createContext,
  useRef,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { useToast } from '../ui/use-toast';
import { useMutation, InfiniteData } from '@tanstack/react-query';
import { trpc } from '@/app/_trpc/client';
import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query';

type MessageStatus = 'sending' | 'sent' | 'error' | 'seen';

interface Message {
  id: string;
  text: string;
  isUserMessage: boolean;
  createdAt: string;
  status?: MessageStatus;
}

interface MessagePage {
  messages: Message[];
  nextCursor?: string; // Ensured to exclude 'null'
}

// Align InfiniteQueryData with InfiniteData from react-query
type InfiniteQueryData = InfiniteData<{
  messages: Message[];
  nextCursor?: string; // Ensured to exclude 'null'
}>;

type StreamResponse = {
  addMessage: () => void;
  message: string;
  handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  isDrafting: boolean;
  setIsDrafting: (isDrafting: boolean) => void;
  resetMessage: () => void;
  retryMessage: (messageId: string) => void;
  markMessageAsSeen: (messageId: string) => void;
  typingIndicator: boolean;
};

export const ChatContext = createContext<StreamResponse>({
  addMessage: () => {},
  message: '',
  handleInputChange: () => {},
  isLoading: false,
  isDrafting: false,
  setIsDrafting: () => {},
  resetMessage: () => {},
  retryMessage: () => {},
  markMessageAsSeen: () => {},
  typingIndicator: false,
});

interface Props {
  fileId: string;
  children: ReactNode;
}

export const ChatContextProvider = ({ fileId, children }: Props) => {
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDrafting, setIsDrafting] = useState<boolean>(false);
  const [typingIndicator, setTypingIndicator] = useState<boolean>(false);

  const utils = trpc.useContext();
  const { toast } = useToast();
  const backupMessage = useRef<string>('');
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced typing indicator
  useEffect(() => {
    if (message) {
      setTypingIndicator(true);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setTypingIndicator(false);
      }, 1500);
    } else {
      setTypingIndicator(false);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message]);

  const { mutate: sendMessage } = useMutation({
    mutationFn: async ({ message }: { message: string }) => {
      const response = await fetch('/api/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Assuming the API returns a ReadableStream for streaming responses
      return response.body;
    },
    onMutate: async ({ message }) => {
      // Backup the current message in case of error
      backupMessage.current = message;
      setMessage('');
      setIsDrafting(false);

      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await utils.getFileMessages.cancel();

      // Snapshot the previous data
      const previousMessages = utils.getFileMessages.getInfiniteData({
        fileId,
        limit: INFINITE_QUERY_LIMIT,
      });

      // Optimistically update to the new value
      utils.getFileMessages.setInfiniteData(
        { fileId, limit: INFINITE_QUERY_LIMIT },
        (old: InfiniteData<MessagePage> | undefined): InfiniteData<MessagePage> | undefined => {
          if (!old) return undefined;

          const newPages = [...old.pages];
          const latestPage = { ...newPages[0] };

          latestPage.messages = [
            {
              createdAt: new Date().toISOString(),
              id: crypto.randomUUID(), // Ensures 'id' is a string
              text: message,
              isUserMessage: true,
              status: 'sending', // 'sending' is a valid MessageStatus
            },
            ...latestPage.messages,
          ];

          newPages[0] = latestPage;

          // Ensure nextCursor is not null
          newPages.forEach((page) => {
            if (page.nextCursor === null) {
              page.nextCursor = undefined;
            }
          });

          return { ...old, pages: newPages };
        }
      );

      setIsLoading(true);

      // Return the context with the previous messages for potential rollback
      return {
        previousMessages: previousMessages?.pages.flatMap((page) => page.messages) ?? [],
      };
    },
    onSuccess: async (stream) => {
      setIsLoading(false);

      if (!stream) {
        return toast({
          title: 'There was a problem sending this message',
          description: 'Please refresh this page and try again',
          variant: 'destructive',
        });
      }

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accResponse = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        accResponse += chunkValue;

        // Update the AI response message with the accumulated response
        utils.getFileMessages.setInfiniteData(
          { fileId, limit: INFINITE_QUERY_LIMIT },
          (old: InfiniteData<MessagePage> | undefined): InfiniteData<MessagePage> | undefined => {
            if (!old) return old;

            const isAiResponseCreated = old.pages.some((page) =>
              page.messages.some((message) => message.id === 'ai-response')
            );

            const updatedPages = old.pages.map((page) => {
              if (page === old.pages[0]) {
                let updatedMessages: Message[];

                if (!isAiResponseCreated) {
                  // If AI response doesn't exist, create it
                  updatedMessages = [
                    {
                      createdAt: new Date().toISOString(),
                      id: 'ai-response',
                      text: accResponse,
                      isUserMessage: false,
                      status: 'sent' as MessageStatus, // Explicit type assertion
                    },
                    ...page.messages.map((msg) => ({
                      ...msg,
                      status: msg.isUserMessage ? 'sent' : msg.status, // 'sent' is valid
                    })),
                  ];
                } else {
                  // If AI response exists, update its text and status
                  updatedMessages = page.messages.map((message) => {
                    if (message.id === 'ai-response') {
                      return {
                        ...message,
                        text: accResponse,
                        status: 'sent' as MessageStatus, // Explicit type assertion
                      };
                    }
                    return message;
                  });
                }

                return { ...page, messages: updatedMessages };
              }

              return page;
            });

            return { ...old, pages: updatedPages };
          }
        );
      }
    },
    onError: (_error, _variables, context) => {
      // Rollback to the previous messages
      setMessage(backupMessage.current);
      utils.getFileMessages.setInfiniteData(
        { fileId, limit: INFINITE_QUERY_LIMIT },
        (old: InfiniteData<MessagePage> | undefined): InfiniteData<MessagePage> | undefined => {
          if (!old || !context) return old;
          return {
            pages: [
              {
                messages: context.previousMessages,
                nextCursor:
                  old.pages[0]?.nextCursor !== undefined ? old.pages[0].nextCursor : undefined,
              },
              ...old.pages.slice(1),
            ],
            pageParams: old.pageParams,
          };
        }
      );

      toast({
        title: 'Message failed to send',
        description: 'Click to retry',
        variant: 'destructive',
        action: (
          <button
            onClick={() => retryMessage(context?.previousMessages[0]?.id ?? '')}
            className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-500"
          >
            Retry
          </button>
        ),
      });
    },
    onSettled: async () => {
      setIsLoading(false);
      await utils.getFileMessages.invalidate({ fileId, limit: INFINITE_QUERY_LIMIT });
    },
  });

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(e.target.value);
    },
    []
  );

  const resetMessage = useCallback(() => {
    setMessage('');
    setIsDrafting(false);
  }, []);

  const retryMessage = useCallback(
    (messageId: string) => {
      const messages = utils.getFileMessages.getInfiniteData({
        fileId,
        limit: INFINITE_QUERY_LIMIT,
      })?.pages.flatMap((page) => page.messages);
      const messageToRetry = messages?.find((msg) => msg.id === messageId);

      if (messageToRetry) {
        sendMessage({ message: messageToRetry.text });
      }
    },
    [fileId, utils, sendMessage]
  );

  const markMessageAsSeen = useCallback(
    (messageId: string) => {
      utils.getFileMessages.setInfiniteData(
        { fileId, limit: INFINITE_QUERY_LIMIT },
        (old: InfiniteData<MessagePage> | undefined): InfiniteData<MessagePage> | undefined => {
          if (!old) return old;

          const updatedPages = old.pages.map((page) => ({
            ...page,
            messages: page.messages.map((msg) =>
              msg.id === messageId
                ? { ...msg, status: 'seen' as MessageStatus } // Explicit type assertion
                : msg
            ),
          }));

          return { ...old, pages: updatedPages };
        }
      );
    },
    [fileId, utils]
  );

  const addMessage = () => {
    if (message.trim()) {
      sendMessage({ message });
    }
  };

  return (
    <ChatContext.Provider
      value={{
        addMessage,
        message,
        handleInputChange,
        isLoading,
        isDrafting,
        setIsDrafting,
        resetMessage,
        retryMessage,
        markMessageAsSeen,
        typingIndicator,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};