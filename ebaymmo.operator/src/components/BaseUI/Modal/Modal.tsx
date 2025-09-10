interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    className?: string;
    width?: string;
    height?: string;
}

export default function Modal({
    isOpen,
    onClose,
    children,
    title = 'Add Shop',
    className = '',
    width = 'w-[1000px]'
}: ModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[50]"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className={`${width} my-3`}>
                <div
                    className={`relative bg-gradient-to-b from-[#B2FFCB] from-0% via-white via-10% to-white rounded-[35px] max-w-[90%] mx-auto ${className}`}
                >
                    <button
                        onClick={onClose}
                        className="absolute right-[5px] top-[-5px] sm:right-[-50px] sm:top-[0]"
                    >
                        <img
                            src="/images/seller/close.svg"
                            alt="Close"
                            className="w-[30px] h-[30px] sm:w-[40px] sm:h-[40px] object-cover"
                        />
                    </button>
                    <div>
                        <h2 className="text-[18px] sm:text-[20px] md:text-[24px] font-bold text-center py-[10px]">
                            {title}
                        </h2>
                        <div className="pl-[30px] sm:pl-[45px] md:pl-[60px] pr-[15px] sm:pr-[20px] h-[auto]">
                            <div className="overflow-y-auto pr-3 sm:pr-4 md:pr-6 text-[14px] sm:text-[16px] md:text-[18px]">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
