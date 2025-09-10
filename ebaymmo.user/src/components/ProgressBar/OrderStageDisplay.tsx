import React from 'react';
import { formatDate } from '@/utils/formatDate';
import { useTranslations } from 'next-intl';

interface OrderStageDisplayProps {
  stage: number;
  isCancelled: boolean;
  orderData?: {
    notes?: string;
    orderCode?: string;
    quantity?: number;
    price?: number;
    item?: string;
    buyer?: string;
    orderDate?: Date;
    status?: string;
    productId?: string;
    productName?: string;
    productImage?: string;
    completeDate?: Date;
  };
}

/**
 * Component hiển thị nội dung tương ứng với từng giai đoạn tiến trình đơn hàng
 */
export default function OrderStageDisplay({ stage, isCancelled, orderData = {} }: OrderStageDisplayProps) {
  // Sử dụng translations
  const t = useTranslations('order-buyer');
  const tFields = useTranslations('order-buyer.fields');
  
  // Giai đoạn đã bị hủy
  if (isCancelled) {
    return (
      <div className="col-span-1 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <svg className="w-20 h-20 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-bold text-xl text-red-600">{t('cancelled.title')}</p>
            <p className="text-gray-600">{t('cancelled.description')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Giai đoạn 1 - Đang xử lý
  if (stage === 1) {
    return (
      <div className="col-span-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Phần thông tin trạng thái */}
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
              <svg className="w-20 h-20 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-bold text-xl text-yellow-600">{t('pending.title')}</p>
              <p className="text-gray-600">{t('pending.subtitle')}</p>
              <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-700">{t('pending.message')}</p>
              </div>
            </div>
            
            {/* Thông tin đơn hàng */}
            <div className="mt-4 w-full">
              <h3 className="text-lg font-bold mb-3 text-gray-800 text-center">{t('orderInfo')}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-gray-200 rounded-md p-3 bg-yellow-50">
                  <span className="text-gray-600 text-sm font-medium block mb-1">{tFields('quantity')}</span>
                  <span className="text-gray-800 font-bold">{orderData.quantity || 1}</span>
                </div>
                <div className="border border-gray-200 rounded-md p-3 bg-yellow-50">
                  <span className="text-gray-600 text-sm font-medium block mb-1">{tFields('price')}</span>
                  <span className="text-gray-800 font-bold">{orderData.price || 500000} USDT</span>
                </div>
                <div className="border border-gray-200 rounded-md p-3 bg-yellow-50">
                  <span className="text-gray-600 text-sm font-medium block mb-1">{tFields('orderDate')}</span>
                  <span className="text-gray-800 font-bold">{orderData.orderDate ? formatDate(orderData.orderDate) : '01/08/2023'}</span>
                </div>
                <div className="border border-gray-200 rounded-md p-3 bg-yellow-50">
                  <span className="text-gray-600 text-sm font-medium block mb-1">{tFields('totalPayment')}</span>
                  <span className="text-yellow-600 font-bold">{orderData.price || 500000} USDT</span>
                </div>
              </div>
            </div>
          </div>

          {/* Phần chi tiết yêu cầu */}
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-2 text-gray-800">{t('requestDetails')}:</h2>
              <div className="border border-gray-200 p-3 rounded-md bg-gray-50">
                <p className="text-gray-700">{orderData.notes || t('defaultNotes')}</p>
              </div>
            </div>

            {/* Deadline Info */}
            <div className="mb-6">
              <div className="flex items-center text-gray-700">
                <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{tFields('completionDeadline')}: </span>
                <span className="text-yellow-600 font-bold ml-1">{orderData.completeDate ? formatDate(orderData.completeDate) : '-'}</span>
              </div>
              <div className="text-sm text-gray-500 ml-7">{t('fromDate', {date: orderData.orderDate ? formatDate(orderData.orderDate) : '-'})}</div>
            </div>
            
            {/* Thông tin thêm về người mua */}
            <div className="border border-yellow-200 p-4 rounded-md bg-yellow-50">
              <h3 className="font-bold text-gray-800 mb-2">{t('buyerInfo')}</h3>
              <div className="flex items-center mb-2">
                <svg className="w-4 h-4 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-gray-700">{tFields('buyer')}: </span>
                <span className="text-green-600 font-medium ml-1">{orderData.buyer || 'customer123'}</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-gray-700">{tFields('orderCode')}: </span>
                <span className="text-gray-800 font-medium ml-1">{orderData.orderCode || 'ORDER123'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Giai đoạn 2 - Đã xác nhận
  if (stage === 2) {
    return (
      <div className="col-span-1 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <svg className="w-20 h-20 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-bold text-xl text-blue-600">{t('accepted.title')}</p>
            <p className="text-gray-600">{t('accepted.subtitle')}</p>
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">{t('accepted.message')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Giai đoạn 3 - Hoàn thành
  if (stage === 3) {
    return (
      <div className="col-span-1 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <svg className="w-20 h-20 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-bold text-xl text-green-600">{t('completed.title')}</p>
            <p className="text-gray-600">{t('completed.subtitle')}</p>
            <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-700">{t('completed.message')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mặc định nếu không rơi vào trường hợp nào
  return null;
} 