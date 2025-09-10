'use client';

import Input from '@/components/BaseUI/Input';
import Modal from '@/components/BaseUI/Modal';
import { useStatusModal } from '@/contexts/StatusModalContext';
import { useUpdateReviewResponseMutation } from '@/generated/graphql';
import Image from 'next/image';
import { useState } from 'react';

// Define the missing StoreData interface
interface StoreData {
    id: string | number;
    ratingId?: string;
    rating?: number;
    ratingDate?: string;
    review?: string;
    store?: string;
    user?: {
        fullName?: string;
        images?: string;
    };
    creationDate?: string;
    response?: string;
    responseDate?: string;
}

interface ResponseProps {
    onClose: () => void;
    responseData: StoreData;
    onSuccess: () => void;
}

export function Response({ onClose, responseData, onSuccess }: ResponseProps) {
    const { showModal, closeModal } = useStatusModal();
    const [responseText, setResponseText] = useState(
        responseData?.response || ''
    );
    const [updateResponse, { loading }] = useUpdateReviewResponseMutation({
        onCompleted: () => {
            showModal('success', 'Response Successfully');
            onSuccess?.();
            onClose();
        },
        onError: (error) => {
            showModal('error', `Error: ${error.message}`);
        }
    });

    const handleSubmit = async () => {
        if (!responseText.trim()) {
            showModal('error', 'Please enter your response');
            return;
        }

        try {
            await updateResponse({
                variables: {
                    ratingId: responseData.ratingId,
                    response: responseText
                }
            });
        } catch (error) {
            console.error('Error submitting response:', error);
        }
    };

    return (
        <div>
            <Modal
                isOpen={true}
                onClose={onClose}
                title="Response"
                buttonTitle={loading ? 'Submitting...' : 'Confirm'}
                onButtonClick={handleSubmit}
            >
                <div className="flex">
                    {[...Array(5)].map((_, i) => (
                        <Image
                            key={i}
                            src="/images/star.svg"
                            width={25}
                            height={25}
                            alt="star"
                            className={
                                i < (responseData?.rating || 0)
                                    ? 'brightness-100'
                                    : 'brightness-[0.5] opacity-50'
                            }
                        />
                    ))}
                    <p className="text-[#7B7B7B] text-[14px] font-normal leading-[228%] ml-3">
                        {responseData?.creationDate}
                    </p>
                </div>
                <p className="w-[477px] text-left mt-4 text-black text-[16px] font-normal leading-[160%]">
                    " {responseData?.review} "
                </p>
                <div className="w-full">
                    <Input
                        type="textarea"
                        className="w-[437px] h-[73px] mt-5 mb-9 "
                        label={
                            responseData.response ? 'Edit Response' : 'Response'
                        }
                        placeholder="Enter your response"
                        labelClassName="text-[14px] font-medium text-[#6C6C6C] leading-[160%]"
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        disabled={loading}
                    />
                </div>
            </Modal>
        </div>
    );
}

export default Response;
