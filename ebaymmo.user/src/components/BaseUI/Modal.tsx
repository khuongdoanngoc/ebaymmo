import Image from 'next/image';
import Button from './Button/button';
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    buttonTitle?: string;
    title: string;
    width?: string;
    onSubmit?: (e?: any) => void;
    noButton?: boolean;
    className?: string;
    onButtonClick?: () => void;
    buttonDisabled?: boolean;
}

function Modal(props: IModalProps) {
    const {
        isOpen,
        children,
        buttonTitle,
        title,
        onClose,
        width,
        noButton,
        className,
        onButtonClick,
        buttonDisabled
    } = props;

    const modalRef = useRef<HTMLDivElement>(null);

    // Handle ESC key press to close modal
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        // Disable body scroll when modal is open
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            // Re-enable body scroll when modal is closed
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-modal-bg z-[9999] flex items-center justify-center p-3 sm:p-4"
                    onClick={onClose}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        ref={modalRef}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        className={`modal-content relative bg-white shadow-[0px_10px_40px_rgba(0,0,0,0.15)] !bg-modal-content-bg overflow-x-hidden rounded-[16px] sm:rounded-[24px] p-[16px] sm:p-[24px] md:p-[32px] ${
                            className || ''
                        }`}
                        style={{
                            width: width || '95%',
                            maxHeight: '90vh',
                            overflowY: 'auto'
                        }}
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{
                            type: 'spring',
                            damping: 25,
                            stiffness: 300
                        }}
                        aria-modal="true"
                        role="dialog"
                        aria-labelledby="modal-title"
                    >
                        {/* Consistent close button position across all devices */}
                        <button
                            onClick={onClose}
                            className="absolute right-[2px] top-[2px] sm:right-[0px] sm:top-[-0px] cursor-pointer z-10 
                            transition-all duration-200 ease-in-out
                            hover:scale-110 hover:rotate-90
                            focus:outline-none focus:ring-2 focus:ring-primary 
                            bg-white/80 backdrop-blur-sm rounded-full p-2
                            shadow-lg hover:shadow-xl
                            active:scale-95"
                            aria-label="Close dialog"
                        >
                            <img
                                className="w-[20px] h-[20px] sm:w-[24px] sm:h-[24px] md:w-[32px] md:h-[32px] object-cover brightness-0"
                                src="/images/seller/close.svg"
                                alt="Close"
                            />
                        </button>
                        <div className="text-center">
                            <h3
                                id="modal-title"
                                className="text-xl sm:text-2xl mb-[15px] sm:mb-[20px] md:mb-[30px] font-bold text-center break-words"
                            >
                                {title}
                            </h3>
                            {children}
                        </div>
                        {!noButton && (
                            <div className="flex justify-center mt-4 sm:mt-6">
                                <Button
                                    onClick={
                                        onButtonClick ||
                                        props.onSubmit ||
                                        props.onClose
                                    }
                                    width={'100%'}
                                    disabled={buttonDisabled}
                                    className={
                                        buttonDisabled
                                            ? 'opacity-50 cursor-not-allowed'
                                            : ''
                                    }
                                >
                                    {buttonTitle}
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default Modal;
