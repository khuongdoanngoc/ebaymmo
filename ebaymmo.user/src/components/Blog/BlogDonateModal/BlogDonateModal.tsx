'use client';

import Input from '@/components/BaseUI/Input';
import Modal from '@/components/BaseUI/Modal';
import React, { useState } from 'react';
import { useDonateToBlogMutation } from '@/generated/graphql';
import { useSession } from 'next-auth/react';
import { useStatusModal } from '@/contexts/StatusModalContext';

interface BlogDonateModalProps {
    onClose: () => void;
    blogId: string;
}

const BlogDonateModal = ({ onClose, blogId }: BlogDonateModalProps) => {
    const [amount, setAmount] = useState('');
    const [comment, setComment] = useState('');
    const [amountError, setAmountError] = useState('');
    const [loading, setLoading] = useState(false);
    const { data: session, status } = useSession();
    const { showModal } = useStatusModal();

    const [donateToBlog] = useDonateToBlogMutation();

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;

        const sanitizedValue = inputValue.replace(/[^0-9.]/g, '');

        let formattedValue = sanitizedValue;
        if (
            sanitizedValue.length > 1 &&
            sanitizedValue.startsWith('0') &&
            !sanitizedValue.startsWith('0.')
        ) {
            formattedValue = sanitizedValue.replace(/^0+/, '');
        }

        // Cập nhật state với giá trị đã được làm sạch
        setAmount(formattedValue);

        // Kiểm tra các điều kiện giá trị
        const numValue = parseFloat(formattedValue);
        if (isNaN(numValue)) {
            setAmountError('Please enter a valid number');
        } else if (numValue === 0) {
            setAmountError('Amount must be greater than 0');
        } else {
            setAmountError('');
        }
    };

    const handleDonate = async () => {
        // Kiểm tra đăng nhập trước
        if (status !== 'authenticated') {
            showModal('error', 'Please sign in to donate');
            return;
        }

        if (!amount || amountError || !session?.user?.id) {
            return;
        }

        try {
            setLoading(true);

            // Gọi mutation để donate
            const result = await donateToBlog({
                variables: {
                    blogId: blogId,
                    donationAmount: parseFloat(amount),
                    comment: comment
                }
            });

            if (result.data?.donateToBlogAction?.success) {
                // Hiển thị thông báo thành công - sửa theo đúng định dạng của hàm
                showModal(
                    'success',
                    'Thank you for your donation to the author!'
                );

                // Đóng modal sau khi thành công
                onClose();
            } else {
                showModal(
                    'error',
                    result.data?.donateToBlogAction?.message ||
                        'Failed to process donation'
                );
            }
        } catch (error) {
            console.error('Donation error:', error);
            showModal(
                'error',
                'An error occurred while processing your donation'
            );
        } finally {
            setLoading(false);
        }
    };

    const donateButton = (
        <button
            onClick={handleDonate}
            disabled={
                !!amountError ||
                !amount ||
                loading ||
                status !== 'authenticated'
            }
            className={`w-full py-3 rounded-lg text-white font-medium ${
                !!amountError ||
                !amount ||
                loading ||
                status !== 'authenticated'
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
            }`}
        >
            {loading
                ? 'Processing...'
                : status !== 'authenticated'
                  ? 'Sign in to donate'
                  : 'Donate'}
        </button>
    );

    return (
        <div>
            <Modal
                width="700px"
                isOpen={true}
                onClose={onClose}
                title="Support the Author"
                noButton={true}
            >
                {status !== 'authenticated' && (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded">
                        <p>Please sign in to donate to this blog.</p>
                    </div>
                )}

                <div className="relative">
                    <Input
                        type="text"
                        className="h-[60px] mt-5 mb-2 w-full"
                        label="Amount"
                        placeholder="Minimum 5,000 USDT"
                        labelClassName="text-[14px] font-medium text-[#6C6C6C] leading-[160%]"
                        value={amount}
                        onChange={handleAmountChange}
                        error={!!amountError}
                        disabled={loading || status !== 'authenticated'}
                    />
                    {amountError && (
                        <p className="text-red-500 text-sm mb-5">
                            {amountError}
                        </p>
                    )}
                </div>

                <Input
                    type="textarea"
                    className="h-[280px] mt-5 mb-9 w-full"
                    label="Comment"
                    placeholder="Enter specific content requests"
                    labelClassName="text-[14px] font-medium text-[#6C6C6C] leading-[160%]"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={loading || status !== 'authenticated'}
                />

                {/* Thêm nút tùy chỉnh */}
                {donateButton}
            </Modal>
        </div>
    );
};

export default BlogDonateModal;
