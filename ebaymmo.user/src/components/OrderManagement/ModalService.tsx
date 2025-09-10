import React, { useState, useEffect } from 'react';
import OrderProgressBar from '../ProgressBar/OrderProgressBar';
import OrderStageDisplaySeller from '../ProgressBar/OrderStageDisplaySeller';
import { useUpdateOrderMutation } from '@/generated/graphql';
import { toast } from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { formatDate } from '@/utils/formatDate';

interface ModalServiceProps {
  orderData?: {
    orderId?: string;
    orderCode?: string;
    quantity?: number;
    price?: number;
    item?: string;
    buyer?: string;
    orderDate?: Date;
    orderStatus?: string;
    notes?: string;
    productId?: string;
    productName?: string;
    productImage?: string;
    completeDate?: Date;
  };
  onClose?: () => void;
  testMode?: boolean;
  onStatusUpdate?: (newStatus: string) => void;
}

export default function ModalService({ 
  orderData = {}, 
  onClose, 
  testMode = false,
  onStatusUpdate
}: ModalServiceProps) {
  // Lấy translations
  const t = useTranslations('order-service');
  
  // State để test các trạng thái khác nhau
  const [testStatus, setTestStatus] = useState<string>(orderData.orderStatus || 'pending');
  const [currentStatus, setCurrentStatus] = useState<string>(orderData.orderStatus || 'pending');
  
  // Cập nhật currentStatus khi orderData thay đổi
  useEffect(() => {
    if (orderData.orderStatus) {
      setCurrentStatus(orderData.orderStatus);
    }
  }, [orderData.orderStatus]);
  
  // Mutation để cập nhật trạng thái đơn hàng
  const [updateOrder, { loading }] = useUpdateOrderMutation({
    onCompleted: (data) => {
      const newStatus = data?.updateOrders?.returning?.[0]?.orderStatus;
      if (newStatus) {
        // Cập nhật state local
        setCurrentStatus(newStatus);
        
        // Thông báo thành công
        toast.success(t('status.updateSuccess'));
        
        // Gọi callback nếu có
        if (onStatusUpdate) {
          onStatusUpdate(newStatus);
        }
      } else {
        toast.error(t('status.updateFailed'));
      }
    },
    onError: (error) => {
      toast.error(t('status.updateError'));
      console.error('Error updating order:', error);
    }
  });

  // Xác định trạng thái tiến trình dựa trên status cho seller
  const getProcessStage = () => {
    // Nếu đang ở chế độ test, sử dụng testStatus thay vì currentStatus
    const status = testMode ? testStatus.toLowerCase() : currentStatus.toLowerCase();
    
    if (status === 'cancelled') return 1;
    if (status === 'pending') return 1;
    if (status === 'accepted') return 2;
    if (status === 'completed' || status === 'successed') return 3;
    return 1; // Mặc định là giai đoạn 1
  };

  const processStage = getProcessStage();
  
  const isCancelled = testMode 
    ? testStatus.toLowerCase() === 'cancelled'
    : currentStatus.toLowerCase() === 'cancelled';
  
  // Hàm xử lý cập nhật trạng thái
  const handleUpdateStatus = async (newStatus: string) => {
    if (!orderData.orderId) {
      toast.error(t('status.noOrderId'));
      return;
    }

    
    try {
      // Cập nhật UI trước để người dùng thấy phản hồi ngay lập tức
      if (!testMode) {
        setCurrentStatus(newStatus);
      }
      
      await updateOrder({
        variables: {
          where: {
            orderId: { _eq: orderData.orderId }
          },
          _set: {
            orderStatus: newStatus
          }
        }
      });
    } catch (error) {
      // Nếu có lỗi, khôi phục trạng thái cũ
      if (!testMode) {
        setCurrentStatus(orderData.orderStatus || 'pending');
      }
      console.error('Error in handleUpdateStatus:', error);
    }
  };
    
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl mx-auto">
      {/* Header with product code */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-row items-center justify-center gap-2 ">
          <span className="text-gray-700 font-bold text-[15px]">{orderData.orderCode || t('default.orderCode')}</span>
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
              className={`px-4 py-2 rounded-md ${testStatus === 'accepted' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              {t('status.accepted')}
            </button>
            <button 
              onClick={() => setTestStatus('completed')}
              className={`px-4 py-2 rounded-md ${testStatus === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
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

      {/* OrderStageDisplaySeller hiển thị nội dung tương ứng với từng giai đoạn cho seller */}
      <div className="mt-6">
        <OrderStageDisplaySeller 
          stage={processStage} 
          isCancelled={isCancelled} 
          orderData={{
            ...orderData,
            orderDate: orderData.orderDate ? formatDate(orderData.orderDate) : undefined,
            completeDateService: orderData.completeDate ? formatDate(orderData.completeDate) : undefined,
            orderStatus: testMode ? testStatus : currentStatus
          }}
        />
      </div>

      {/* Footer buttons - Thêm actions khác nhau tùy theo giai đoạn cho seller */}
      <div className="mt-8 flex justify-end gap-3">
        
        {/* Hiển thị buttons tương ứng với từng giai đoạn cho seller */}
        {processStage === 1 && !isCancelled  && orderData.orderStatus === 'pending' && (
          <>
            <button 
              className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors disabled:opacity-50"
              onClick={() => handleUpdateStatus('accepted')}
              disabled={loading}
            >
              {loading ? t('buttons.processing') : t('buttons.accept')}
            </button>
            <button 
              className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
              onClick={() => handleUpdateStatus('cancelled')}
              disabled={loading}
            >
              {loading ? t('buttons.processing') : t('buttons.reject')}
            </button>
          </>
        )}
        
        {processStage === 2 && (
          <>
            <button 
            className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors disabled:opacity-50"
            onClick={() => handleUpdateStatus('completed')}
            disabled={loading}
          >
            {loading ? t('buttons.processing') : t('buttons.confirmCompletion')}
          </button>
          <button 
          className="px-4 py-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-colors"
          onClick={() => {
            window.location.href = `/chatbox?chatto=${orderData.buyer}`;
          }}>
            {t('buttons.contactBuyer')}
          </button>
          </>
        )}

        {processStage === 3 && (
          <button className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors">
            {t('buttons.viewReviews')}
          </button>
        )}
      </div>
    </div>
  );
} 