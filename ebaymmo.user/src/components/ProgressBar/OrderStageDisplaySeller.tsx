import React from 'react';
import { formatDate } from '@/utils/formatDate';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaClipboardList, FaClipboardCheck } from 'react-icons/fa';
import { useTranslations } from 'next-intl';

interface OrderStageDisplaySellerProps {
  stage: number;
  isCancelled: boolean;
  orderData?: {
    orderCode?: string;
    quantity?: number;
    price?: number;
    item?: string;
    buyer?: string;
    orderDate?: string;
    orderStatus ?: string;
    notes?: string;
    completeDateService?: string;
    description?: string;
  };
}

export default function OrderStageDisplaySeller({ 
  stage, 
  isCancelled, 
  orderData = {} 
}: OrderStageDisplaySellerProps) {
  // Sử dụng translations
  const t = useTranslations('order-stages');
  const tFields = useTranslations('order-stages.fields');
  
  // Kiểm tra trạng thái từ chối
  if (isCancelled || orderData.orderStatus === 'cancelled' || orderData.orderStatus === 'refunded') {
    return (
      <div className="grid grid-cols-2 gap-8">
        <div className="bg-red-50 p-6 rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <FaTimesCircle className="text-red-500 text-2xl" />
            <h3 className="text-lg font-semibold text-red-700">{t('cancelled.title')}</h3>
          </div>
          <div className="space-y-3">
            <p className="text-gray-600">
              <span className="font-medium">{tFields('orderCode')}:</span> {orderData.orderCode}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">{tFields('buyer')}:</span> {orderData.buyer}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">{tFields('service')}:</span> {orderData.item}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">{tFields('quantity')}:</span> {orderData.quantity}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">{tFields('price')}:</span> {orderData.price} USDT
            </p>
            <p className="text-gray-600">
              <span className="font-medium">{tFields('orderDate')}:</span> {orderData.orderDate || '-'}
            </p>
          </div>
        </div>
        <div className="bg-red-50 p-6 rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <FaTimesCircle className="text-red-500 text-2xl" />
            <h3 className="text-lg font-semibold text-red-700">{t('cancelled.title')}</h3>
          </div>
          <p className="text-gray-600 mb-4">
            {t('cancelled.description')}
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>{t('cancelled.actions.viewReason')}</li>
            <li>{t('cancelled.actions.contact')}</li>
            <li>{t('cancelled.actions.viewStats')}</li>
          </ul>
        </div>
      </div>
    );
  }

  // Xác định stage dựa trên trạng thái
  const currentStage = React.useMemo(() => {
    switch (orderData.orderStatus) {
      case 'pending':
        return 1;
      case 'accepted':
        return 2;
      case 'completed':
        return 3;
      case 'successed':
        return 3;
      default:
        return stage;
    }
  }, [orderData.orderStatus, stage]);

  switch (currentStage) {
    case 1:
      return (
        <div className="grid grid-cols-2 gap-8">
          <div className="bg-yellow-50 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <FaClipboardList className="text-yellow-500 text-2xl" />
              <h3 className="text-lg font-semibold text-yellow-700">{t('pending.title')}</h3>
            </div>
            <div className="space-y-3">
              <p className="text-gray-600">
                <span className="font-medium">{tFields('orderCode')}:</span> {orderData.orderCode}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">{tFields('buyer')}:</span> {orderData.buyer}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">{tFields('service')}:</span> {orderData.item}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">{tFields('quantity')}:</span> {orderData.quantity}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">{tFields('price')}:</span> {orderData.price} USDT
              </p>
              <p className="text-gray-600">
                <span className="font-medium">{tFields('orderDate')}:</span> {orderData.orderDate || '-'}
              </p>
            </div>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <FaSpinner className="text-blue-500 text-2xl animate-spin" />
              <h3 className="text-lg font-semibold text-blue-700">{t('pending.title')}</h3>
            </div>
            <p className="text-gray-600 mb-4">
              {t('pending.description')}
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>{t('pending.actions.check')}</li>
              <li>{t('pending.actions.confirm')}</li>
              <li>{t('pending.actions.decideAccept')}</li>
            </ul>
          </div>
        </div>
      );

    case 2:
      return (
        <div className="grid grid-cols-2 gap-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <FaClipboardCheck className="text-blue-500 text-2xl" />
              <h3 className="text-lg font-semibold text-blue-700">{t('accepted.title')}</h3>
            </div>
            <div className="space-y-3">
              <p className="text-gray-600">
                <span className="font-medium">{tFields('orderCode')}:</span> {orderData.orderCode}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">{tFields('buyer')}:</span> {orderData.buyer}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">{tFields('service')}:</span> {orderData.item}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">{tFields('quantity')}:</span> {orderData.quantity}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">{tFields('price')}:</span> {orderData.price} USDT
              </p>
              <p className="text-gray-600">
                <span className="font-medium">{tFields('startDate')}:</span> {orderData.orderDate || '-'}
              </p>
              {orderData.description && (
                <p className="text-gray-600">
                  <span className="font-medium">{tFields('description')}:</span> {orderData.description}
                </p>
              )}
            </div>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <FaSpinner className="text-blue-500 text-2xl animate-spin" />
              <h3 className="text-lg font-semibold text-blue-700">{t('accepted.title')}</h3>
            </div>
            <p className="text-gray-600 mb-4">
              {t('accepted.description')}
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>{t('accepted.actions.continue')}</li>
              <li>{t('accepted.actions.quality')}</li>
              <li>{t('accepted.actions.confirm')}</li>
            </ul>
          </div>
        </div>
      );

    case 3:
      return (
        <div className="grid grid-cols-2 gap-8">
          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <FaCheckCircle className="text-green-500 text-2xl" />
              <h3 className="text-lg font-semibold text-green-700">{t('completed.title')}</h3>
            </div>
            <div className="space-y-3">
              <p className="text-gray-600">
                <span className="font-medium">{tFields('orderCode')}:</span> {orderData.orderCode}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">{tFields('buyer')}:</span> {orderData.buyer}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">{tFields('service')}:</span> {orderData.item}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">{tFields('quantity')}:</span> {orderData.quantity}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">{tFields('price')}:</span> {orderData.price} USDT
              </p>
              <p className="text-gray-600">
                <span className="font-medium">{tFields('orderDate')}:</span> {orderData.orderDate || '-'}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">{tFields('completionDate')}:</span> {orderData.completeDateService || '-'}
              </p>
            </div>
          </div>
          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <FaCheckCircle className="text-green-500 text-2xl" />
              <h3 className="text-lg font-semibold text-green-700">{t('completed.title')}</h3>
            </div>
            <p className="text-gray-600 mb-4">
              {t('completed.description')}
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>{t('completed.actions.viewReviews')}</li>
              <li>{t('completed.actions.contact')}</li>
              <li>{t('completed.actions.viewStats')}</li>
            </ul>
          </div>
        </div>
      );

    default:
      return null;
  }
} 