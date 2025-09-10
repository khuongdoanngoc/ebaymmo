'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import StatusModal from '@/components/StatusModal';

interface StatusModalContextProps {
    showModal: (
        type: 'loading' | 'warning' | 'error' | 'success',
        message?: string,
        onClose?: () => void
    ) => void;
    closeModal: () => void;
}

const StatusModalContext = createContext<StatusModalContextProps | undefined>(
    undefined
);

export function StatusModalProvider({ children }: { children: ReactNode }) {
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        type?: 'loading' | 'warning' | 'error' | 'success';
        message?: string;
        onClose?: () => void;
    }>({ isOpen: false });

    const showModal = (
        type: 'loading' | 'warning' | 'error' | 'success',
        message?: string,
        onClose?: () => void
    ) => {
        setModalState({ isOpen: true, type, message, onClose });
    };

    const closeModal = () => {
        if (modalState.onClose) {
            modalState.onClose();
        }
        setModalState({ isOpen: false });
    };

    return (
        <StatusModalContext.Provider value={{ showModal, closeModal }}>
            {children}
            {modalState.isOpen && (
                <>
                    {/* Overlay - significantly increased z-index */}
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9998]" />

                    {/* Modal Content - significantly increased z-index */}
                    <div className="fixed inset-0 flex items-center justify-center z-[9999]">
                        <div className="bg-white rounded-lg p-6 shadow-xl max-w-md mx-auto">
                            <StatusModal
                                type={modalState.type!}
                                message={modalState.message}
                                isOpen={modalState.isOpen}
                                onClose={closeModal}
                            />
                        </div>
                    </div>
                </>
            )}
        </StatusModalContext.Provider>
    );
}

export function useStatusModal() {
    const context = useContext(StatusModalContext);
    if (!context) {
        throw new Error(
            'useStatusModal must be used within a StatusModalProvider'
        );
    }
    return context;
}
