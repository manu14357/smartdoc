import React, {
    useEffect,
    useState,
    useRef,
    useCallback,
    useMemo,
  } from 'react';
  import { Button, ButtonProps } from './ui/button';
  import axios from 'axios';
  import { useForm, SubmitHandler } from 'react-hook-form';
  import { z } from 'zod';
  import { zodResolver } from '@hookform/resolvers/zod';
  import { motion, AnimatePresence } from 'framer-motion';
  import { FaStar } from 'react-icons/fa';
  import { toast } from 'react-toastify';
  import { IoIosClose } from 'react-icons/io';
  
  // Define the custom HSL color for consistent theming
  const customHSLColor = 'hsl(271.5,81.3%,55.9%)';
  type ButtonVariant = "link" | "outline" | "default" | "destructive" | "secondary" | "ghost";

  // Props for the FeedbackModal component
  interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (feedback: string) => void; // Added onSubmit prop
  }
  interface RippleButtonProps extends ButtonProps {
    variant?: ButtonVariant;
    className?: string;
  }
  // Form input types
  interface FeedbackFormInputs {
    content: string;
    rating: number;
  }
  
  // Schema for form validation using Zod
  const feedbackSchema = z.object({
    content: z.string().min(10, 'Feedback must be at least 10 characters long'),
    rating: z
      .number()
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating cannot exceed 5'),
  });
  
  // Custom Confetti Component
  const Confetti: React.FC = () => {
    const particles = Array.from({ length: 50 });
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
  
    return (
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((_, index) => (
          <motion.div
            key={index}
            className="absolute w-2 h-2 rounded-full"
            style={{
              backgroundColor: colors[Math.floor(Math.random() * colors.length)],
              top: '50%',
              left: '50%',
            }}
            initial={{ scale: 0 }}
            animate={{
              scale: [0, 1, 1, 0],
              y: [0, Math.random() * -200 - 100],
              x: [0, (Math.random() - 0.5) * 400],
              rotate: [0, Math.random() * 360],
            }}
            transition={{
              duration: 2,
              ease: "easeOut",
              delay: index * 0.02,
            }}
          />
        ))}
      </div>
    );
  };
  
  // Success Checkmark Component
  const SuccessCheckmark: React.FC = () => {
    return (
      <div className="flex items-center justify-center">
        <motion.svg
          className="w-16 h-16"
          viewBox="0 0 50 50"
          initial="hidden"
          animate="visible"
        >
          <motion.circle
            cx="25"
            cy="25"
            r="20"
            stroke="#4CAF50"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5 }}
          />
          <motion.path
            d="M15 25 L22 32 L35 19"
            stroke="#4CAF50"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          />
        </motion.svg>
      </div>
    );
  };
  
  // Firecracker animation component
  const Firecracker: React.FC = () => {
    const particles = Array.from({ length: 20 });
  
    return (
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((_, index) => (
          <motion.div
            key={index}
            className="absolute bottom-0 w-2 h-2 bg-red-500 rounded-full"
            initial={{
              opacity: 1,
              y: 0,
              x: 0,
            }}
            animate={{
              opacity: 0,
              y: -300,
              x: [0, Math.random() * 100 - 50],
            }}
            transition={{
              duration: 2,
              ease: 'easeOut',
              delay: Math.random() * 0.5,
            }}
          />
        ))}
      </div>
    );
  };
  
  // Floating Text Component
  const FloatingText: React.FC<{ text: string; delay?: number }> = ({ text, delay = 0 }) => {
    return (
      <motion.span
        className="absolute text-purple-600 text-opacity-50 pointer-events-none text-4xl font-bold"
        initial={{ opacity: 0, y: 0, x: "-50%" }}
        animate={{
          opacity: [0, 1, 0],
          y: -100,
          x: ["-50%", `${(Math.random() - 0.5) * 100}%`],
          rotate: [0, (Math.random() - 0.5) * 45]
        }}
        transition={{
          duration: 2,
          delay,
          ease: "easeOut"
        }}
      >
        {text}
      </motion.span>
    );
  };
  

  
  const RippleButton: React.FC<RippleButtonProps> = ({ 
    onClick, 
    disabled, 
    children, 
    className,
    variant = "default", // Provide a default variant if necessary
    ...props 
  }) => {
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
    const buttonRef = useRef<HTMLButtonElement>(null);
  
    const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!buttonRef.current) return;
      
      const button = buttonRef.current;
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const ripple = {
        x,
        y,
        id: Date.now(),
      };
  
      setRipples((prev) => [...prev, ripple]);
      onClick?.(event);
    };
  
    useEffect(() => {
      const timeouts = ripples.map((ripple) =>
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
        }, 1000)
      );
  
      return () => timeouts.forEach((timeout) => clearTimeout(timeout));
    }, [ripples]);
  
    return (
      <Button
        ref={buttonRef}
        variant={variant} // Now correctly typed
        className={`relative overflow-hidden ${className}`}
        onClick={createRipple}
        disabled={disabled}
        {...props}
      >
        {children}
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute bg-white bg-opacity-30 rounded-full"
            initial={{
              width: 0,
              height: 0,
              x: ripple.x,
              y: ripple.y,
              opacity: 0.5,
            }}
            animate={{
              width: 500,
              height: 500,
              x: ripple.x - 250,
              y: ripple.y - 250,
              opacity: 0,
            }}
            transition={{
              duration: 1,
              ease: "easeOut",
            }}
          />
        ))}
      </Button>
    );
  };
  
  // Success Celebration Component
  const SuccessCelebration: React.FC = () => {
    const messages = ["Amazing!", "Thank You!", "Wonderful!", "Fantastic!"];
    
    return (
      <motion.div 
        className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-95"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="relative flex flex-col items-center">
          <motion.div
            className="text-4xl font-bold text-center text-purple-600 mb-4"
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              transition: {
                type: "spring",
                stiffness: 200,
                damping: 10
              }
            }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
          >
            Thank You! 
            <motion.div 
              className="text-xl text-gray-600 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Your feedback helps us improve
            </motion.div>
          </motion.div>
          
          {messages.map((text, index) => (
            <FloatingText key={index} text={text} delay={index * 0.2} />
          ))}
          
          <SuccessCheckmark />
        </div>
      </motion.div>
    );
  };
  
  // Custom hook for handling feedback submission
  const useSubmitFeedback = (onSuccess: () => void) => {
    return useCallback(
      async (data: FeedbackFormInputs) => {
        try {
          await axios.post('/api/trpc/submitFeedback', data);
          toast.success('Feedback submitted successfully!');
          onSuccess();
        } catch (error) {
          console.error('Failed to submit feedback:', error);
          toast.error('Failed to submit feedback. Please try again.');
        }
      },
      [onSuccess]
    );
  };
  
  const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
    const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting },
      reset,
      setValue,
      watch,
    } = useForm<FeedbackFormInputs>({
      resolver: zodResolver(feedbackSchema),
    });
  
    const [hoverRating, setHoverRating] = useState<number>(0);
    const currentRating = watch('rating', 0);
    const modalRef = useRef<HTMLDivElement>(null);
    const [showThankYou, setShowThankYou] = useState<boolean>(false);
    const [showFirecracker, setShowFirecracker] = useState<boolean>(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [showCheckmark, setShowCheckmark] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [modalVisible, setModalVisible] = useState(true);

    const submitFeedback = useSubmitFeedback(() => {
      setShowThankYou(true);
      setShowFirecracker(true);
      setShowConfetti(true);
      setShowCheckmark(true);
      
      setTimeout(() => {
      setShowThankYou(false);
      setShowFirecracker(false);
      setShowConfetti(false);
      setShowCheckmark(false);
      setIsAnimating(false);
      setModalVisible(false); // Trigger fade out animation
      reset();
        
      setTimeout(() => {
        onClose();
      }, 500);
    }, 4000);
  });
  
    const onSubmit: SubmitHandler<FeedbackFormInputs> = async (data) => {
      setIsAnimating(true);
      await submitFeedback(data);
    };
  
    useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };
  
      const trapFocus = (event: FocusEvent) => {
        if (
          isOpen &&
          modalRef.current &&
          !modalRef.current.contains(event.target as Node)
        ) {
          event.preventDefault();
          modalRef.current.focus();
        }
      };
  
      if (isOpen) {
        document.addEventListener('keydown', handleEscape);
        document.addEventListener('focusin', trapFocus);
        modalRef.current?.focus();
      }
  
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('focusin', trapFocus);
      };
    }, [isOpen, onClose]);
  
    const Stars = useMemo(() => {
      return [1, 2, 3, 4, 5].map((num) => (
        <motion.label
          key={num}
          className="cursor-pointer"
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        >
          <FaStar
            size={30}
            color={
              (hoverRating || currentRating) >= num
                ? customHSLColor
                : '#CCCCCC'
            }
            onMouseEnter={() => setHoverRating(num)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setValue('rating', num)}
            aria-label={`${num} Star`}
            role="button"
          />
        </motion.label>
      ));
    }, [hoverRating, currentRating, setValue]);
  
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 bg-gray-700 bg-opacity-50 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal="true"
          role="dialog"
          aria-labelledby="feedback-modal-title"
          >
           <motion.div
            className="modal-container bg-white p-6 rounded-lg shadow-xl w-full max-w-lg mx-auto relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.5, y: -100 }}
            animate={{ 
              opacity: modalVisible ? 1 : 0,
              scale: modalVisible ? 1 : 0.8,
              y: modalVisible ? 0 : 100,
              transition: {
                type: "spring",
                stiffness: 200,
                damping: 20
              }
            }}
              exit={{ opacity: 0, scale: 0.5, y: 100 }}
              ref={modalRef}
              tabIndex={-1}
            >
              {showFirecracker && <Firecracker />}
              {showConfetti && <Confetti />}
              {showCheckmark && <SuccessCelebration />}
  
              <motion.button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                whileHover={{ rotate: 90, scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
                aria-label="Close Feedback Modal"
              >
                <IoIosClose size={24} />
              </motion.button>
  
              <motion.div
                className="text-center space-y-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transition: {type: "spring",
                    stiffness: 200,
                    damping: 15
                  }
                }}
              >
                <motion.h2
                  id="feedback-modal-title"
                  className="text-2xl font-bold text-center"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  We Value Your Feedback
                </motion.h2>
  
                <motion.div
                  className="text-purple-600 text-lg font-semibold"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    transition: {
                      type: "spring",
                      stiffness: 200,
                      damping: 12
                    }
                  }}
                >
                  <span className="inline-block mr-2">✨</span>
                  Thank you for taking the time to share your thoughts!
                  <span className="inline-block ml-2">✨</span>
                </motion.div>
              </motion.div>
  
              <AnimatePresence>
                {!showThankYou && (
                  <motion.form
                    onSubmit={handleSubmit(onSubmit)}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6 mt-6"
                  >
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      <label
                        htmlFor="content"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Your Feedback
                      </label>
                      <textarea
                        id="content"
                        {...register('content')}
                        className={`w-full p-3 border ${
                          errors.content ? 'border-red-500' : 'border-gray-300'
                        } rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors`}
                        rows={5}
                        placeholder="Enter your feedback here..."
                        aria-invalid={errors.content ? 'true' : 'false'}
                      />
                      {errors.content && (
                        <motion.p
                          className="text-red-500 text-sm"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          role="alert"
                        >
                          {errors.content.message}
                        </motion.p>
                      )}
                    </motion.div>
  
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      <label
                        htmlFor="rating"
                        className="block text-sm font-medium text-gray-700"
                      >
                        How would you rate your experience?
                      </label>
                      <div className="flex items-center justify-center space-x-2">
                        {Stars}
                      </div>
                      {errors.rating && (
                        <motion.p
                          className="text-red-500 text-sm text-center"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          role="alert"
                        >
                          {errors.rating.message}
                        </motion.p>
                      )}
                    </motion.div>
  
                    <motion.div
                      className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.6 }}
                    >
                      <Button
                        variant="outline"
                        type="button"
                        onClick={onClose}
                        disabled={isAnimating}
                        className="w-full sm:w-auto px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </Button>
  
                      <RippleButton
                        type="submit"
                        disabled={isAnimating}
                        className="w-full sm:w-auto px-6 py-2 text-white font-medium"
                        style={{ backgroundColor: customHSLColor }}
                      >
                        {isAnimating ? (
                          <div className="flex items-center justify-center">
                            <motion.div
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear"
                              }}
                            />
                            <span className="ml-2">Submitting...</span>
                          </div>
                        ) : (
                          <motion.span
                            initial={{ opacity: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Submit Feedback
                          </motion.span>
                        )}
                      </RippleButton>
                    </motion.div>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };
  
  export default FeedbackModal