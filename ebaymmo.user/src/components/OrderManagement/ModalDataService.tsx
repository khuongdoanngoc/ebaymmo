import { formatDate } from '@/utils/formatDate';
import React, { useState } from 'react';
import OrderProgressBar from '../ProgressBar/OrderProgressBar';
import OrderStageDisplay from '../ProgressBar/OrderStageDisplay';
import { useTranslations } from 'next-intl';

interface ModalDataServiceProps {
  orderData?: {
    orderCode?: string;
    quantity?: number;
    price?: number;
    item?: string;
    buyer?: string;
    orderDate?: Date;
    status?: string;
    notes?: string;
    productId?: string;
    productName?: string;
    productImage?: string;
    completeDate?: Date;
    seller?: {
      username?: string;
    };
  };
  onClose?: () => void;
  testMode?: boolean;
}

export default function ModalDataService({ 
  orderData = {}, 
  onClose, 
  testMode = false 
}: ModalDataServiceProps) {
  // Sử dụng translations
  const t = useTranslations('order-service');
  const tBuyer = useTranslations('order-buyer');
  
  // State để test các trạng thái khác nhau
  const [testStatus, setTestStatus] = useState<string>(orderData.status || 'pending');
  
  // Xác định trạng thái tiến trình dựa trên status cho user
  const getProcessStage = () => {
    // Nếu đang ở chế độ test, sử dụng testStatus thay vì orderData.status
    const status = testMode ? testStatus.toLowerCase() : orderData.status?.toLowerCase();
    
    if (status === 'cancelled' || status === 'refunded') return 1;
    if (status === 'pending') return 1;
    if (status === 'accepted') return 2;
    if (status === 'completed' || status === 'successed') return 3;
    return 1; // Mặc định là giai đoạn 1
  };

  const processStage = getProcessStage();
  const isCancelled = testMode 
    ? testStatus.toLowerCase() === 'cancelled' || testStatus.toLowerCase() === 'refunded'
    : orderData.status?.toLowerCase() === 'cancelled' || orderData.status?.toLowerCase() === 'refunded';
    
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl mx-auto">
      {/* Header with product code */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-row items-center justify-center gap-2 ">
          <span className="text-gray-700 font-bold text-[15px]">{orderData.orderCode || 'ORDER123'}</span>
          <span className="text-green-600 font-bold text-[15px] ml-1">{t('service')}</span>
          <span className="text-gray-700 font-bold text-[15px] ml-1">{orderData.item || t('default.service')}</span>
          <span className="bg-green-600 text-white text-sm px-2 py-0.5 rounded ml-1">{orderData.item || t('default.category')}</span>
        </div>
      </div>

      {/* Test Controls - Hiển thị panel điều khiển khi ở chế độ test */}
      {testMode && (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-bold mb-2">{t('testMode.title')}</h3>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => setTestStatus('cancelled')}
              className={`px-4 py-2 rounded-md ${testStatus === 'cancelled' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
            >
              {t('status.cancelled')}
            </button>
            <button 
              onClick={() => setTestStatus('pending')}
              className={`px-4 py-2 rounded-md ${testStatus === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-200'}`}
            >
              {t('status.pending')}
            </button>
            <button 
              onClick={() => setTestStatus('accepted')}
              className={`px-4 py-2 rounded-md ${testStatus === 'accepted' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
            >
              {t('status.accepted')}
            </button>
            <button 
              onClick={() => setTestStatus('completed')}
              className={`px-4 py-2 rounded-md ${testStatus === 'completed' ? 'bg-purple-500 text-white' : 'bg-gray-200'}`}
            >
              {t('status.completed')}
            </button>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {t('testMode.currentStatus')}: <span className="font-bold">{testStatus}</span> ({t('testMode.stage')}: {processStage})
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <OrderProgressBar 
        isCancelled={isCancelled} 
        processStage={processStage} 
        stageLabels={[t('stages.ordered'), t('stages.completed'), t('stages.success')]}
      />

      {/* OrderStageDisplay hiển thị nội dung tương ứng với từng giai đoạn */}
      <div className="mt-6">
        <OrderStageDisplay 
          stage={processStage} 
          isCancelled={isCancelled} 
          orderData={orderData}
        />
      </div>

      {/* Footer buttons - Thêm actions khác nhau tùy theo giai đoạn cho user */}
      <div className="mt-8 flex justify-end gap-3">
        
        {/* Hiển thị buttons tương ứng với từng giai đoạn cho user */}
        {processStage === 1 && !isCancelled && (
          <button className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
            {tBuyer('buttons.cancelOrder')}
          </button>
        )}
        
        {processStage === 2 && (
          <button 
          className="px-4 py-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-colors"
          onClick={() => {
            window.location.href = `/chatbox?chatto=${orderData.seller?.username}`;
          }}>
            {tBuyer('buttons.contactSeller')}
          </button>
        )}
        
        {/* {processStage === 3 && (
          <>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors">
              {tBuyer('buttons.complaint')}
            </button>
            <button className="px-4 py-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors">
              {tBuyer('buttons.review')}
            </button>
          </>
        )} */}
      </div>
    </div>
  );
}