import Modal from '../BaseUI/Modal';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
    useGetComplainOrderQuery,
    useUpdateComplainMutation,
    useUpdateOrderMutation
} from '@/generated/graphql';
import StatusModal from '../StatusModal/StatusModal';
import { useTranslations } from 'next-intl';

interface IViewComplainModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    orderCode?: string | null;
}

function ViewComplainModal({
    isOpen,
    onClose,
    orderId,
    orderCode
}: IViewComplainModalProps) {
    const t = useTranslations('viewComplainModal');

    const [statusModal, setStatusModal] = useState<{
        isOpen: boolean;
        type: 'loading' | 'success' | 'error';
        message?: string;
    }>({
        isOpen: false,
        type: 'loading'
    });

    const { data, loading, error, refetch } = useGetComplainOrderQuery({
        variables: {
            where: {
                orderId: { _eq: orderId }
            }
        },
        skip: !orderId
    });

    const [updateComplain] = useUpdateComplainMutation();
    const [updateOrder] = useUpdateOrderMutation();
    const complain = data?.complainView?.[0];

    useEffect(() => {
        if (error) {
            setStatusModal({
                isOpen: true,
                type: 'error',
                message: t('loadError')
            });
        }
    }, [error, t]);

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    const cancelComplaint = async () => {
        if (!complain?.complainId) return;

        try {
            setStatusModal({
                isOpen: true,
                type: 'loading',
                message: t('cancellingComplaint')
            });

            await updateComplain({
                variables: {
                    where: {
                        complainId: { _eq: complain.complainId }
                    },
                    _set: {
                        status: 'cancelled'
                    }
                }
            });

            await refetch();

            setStatusModal({
                isOpen: true,
                type: 'success',
                message: t('cancelSuccess')
            });

            setTimeout(() => {
                setStatusModal({ isOpen: false, type: 'success' });
            }, 2000);
        } catch (error) {
            setStatusModal({
                isOpen: true,
                type: 'error',
                message: t('cancelError')
            });
        }
    };

    const updateToDispute = async () => {
        if (!complain?.complainId) return;

        try {
            setStatusModal({
                isOpen: true,
                type: 'loading',
                message: t('updatingStatus')
            });

            await updateComplain({
                variables: {
                    where: {
                        complainId: { _eq: complain.complainId }
                    },
                    _set: {
                        status: 'dispute'
                    }
                }
            });

            await updateOrder({
                variables: {
                    where: { orderId: { _eq: complain.orderId } },
                    _set: { orderStatus: 'dispute' }
                }
            });
            await refetch();

            setStatusModal({
                isOpen: true,
                type: 'success',
                message: t('disputeSuccess')
            });

            setTimeout(() => {
                setStatusModal({ isOpen: false, type: 'success' });
            }, 2000);
        } catch (error) {
            setStatusModal({
                isOpen: true,
                type: 'error',
                message: t('updateError')
            });
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'cancelled':
                return t('statusCancelled');
            case 'resolved':
                return t('statusResolved');
            case 'dispute':
                return t('statusDispute');
            case 'pending':
            default:
                return t('statusPending');
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={`${t('title')} #${orderCode}`}
                className="max-w-[880px]"
                noButton
            >
                {loading ? (
                    <div className="flex justify-center items-center p-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green_main" />
                    </div>
                ) : complain ? (
                    <div className="flex flex-col gap-[15px] px-2 py-1">
                        <div className="flex flex-col gap-[12px]">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <h3 className="text-[16px] sm:text-[18px] font-[600]">
                                    {t('complaintInformation')}
                                </h3>
                                <span
                                    className={`w-fit px-3 py-1 rounded-full text-sm ${
                                        complain.status === 'cancelled'
                                            ? 'bg-red-100 text-red-600'
                                            : complain.status === 'resolved'
                                              ? 'bg-green-100 text-green-600'
                                              : complain.status === 'dispute'
                                                ? 'bg-blue-100 text-blue-600'
                                                : 'bg-amber-100 text-amber-600'
                                    }`}
                                >
                                    {getStatusText(
                                        complain.status || 'pending'
                                    )}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <p className="text-[14px] sm:text-[16px] text-gray-500">
                                        {t('complaintDate')}
                                    </p>
                                    <p className="text-[14px] sm:text-[16px] font-[500]">
                                        {formatDate(complain.createdAt)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[14px] sm:text-[16px] text-gray-500">
                                        {t('complaintStatus')}
                                    </p>
                                    <p className="text-[14px] sm:text-[16px] font-[500]">
                                        {getStatusText(
                                            complain.status || 'pending'
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-1">
                                <p className="text-[14px] sm:text-[16px] text-gray-500">
                                    {t('complaintDetails')}
                                </p>
                                <p className="text-[14px] sm:text-[16px] p-3 bg-gray-100 rounded-lg min-h-[60px] sm:min-h-[80px] break-words mt-2">
                                    {complain.content || t('noContent')}
                                </p>
                            </div>

                            {complain.image && (
                                <div className="mt-1">
                                    <p className="text-[14px] sm:text-[16px] text-gray-500 mb-2">
                                        {t('complainImage')}
                                    </p>
                                    <div className="relative w-full max-w-[200px] sm:max-w-[250px] h-[150px] sm:h-[180px] mx-auto">
                                        <Image
                                            src={complain.image}
                                            alt={t('complainImage')}
                                            fill
                                            className="object-contain rounded-lg"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <h3 className="text-[16px] sm:text-[18px] font-[600] mb-2">
                                {t('orderDetails')}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <p className="text-[14px] sm:text-[16px] text-gray-500">
                                        {t('orderCode')}
                                    </p>
                                    <p className="text-[14px] sm:text-[16px] font-[500] break-words">
                                        {complain.orderCode}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[14px] sm:text-[16px] text-gray-500">
                                        {t('storeName')}
                                    </p>
                                    <p className="text-[14px] sm:text-[16px] font-[500] break-words">
                                        {complain.storeName || '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[14px] sm:text-[16px] text-gray-500">
                                        {t('quantity')}
                                    </p>
                                    <p className="text-[14px] sm:text-[16px] font-[500]">
                                        {complain.quantity}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[14px] sm:text-[16px] text-gray-500">
                                        {t('totalAmount')}
                                    </p>
                                    <p className="text-[14px] sm:text-[16px] font-[500]">
                                        {complain.totalAmount}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end gap-3">
                            {complain.status === 'pending' && (
                                <button
                                    onClick={updateToDispute}
                                    className="px-4 py-2 rounded-lg text-white bg-orange-500 hover:bg-orange-600"
                                >
                                    {t('disputeButton')}
                                </button>
                            )}
                            <button
                                onClick={cancelComplaint}
                                disabled={
                                    complain.status === 'cancelled' ||
                                    complain.status === 'resolved'
                                }
                                className={`px-4 py-2 rounded-lg text-white ${
                                    complain.status === 'cancelled' ||
                                    complain.status === 'resolved'
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-red-500 hover:bg-red-600'
                                }`}
                            >
                                {t('cancelButton')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-6 sm:p-8">
                        <p className="text-[14px] sm:text-[16px]">
                            {t('noComplaintFound')}
                        </p>
                    </div>
                )}
            </Modal>

            <div className="relative z-[9999]">
                <StatusModal
                    isOpen={statusModal.isOpen}
                    type={statusModal.type}
                    message={statusModal.message}
                    onClose={() =>
                        setStatusModal({ ...statusModal, isOpen: false })
                    }
                />
            </div>
        </>
    );
}

export default ViewComplainModal;
