import React from 'react';

interface StageConfig {
  name: string;
  completedIcon?: React.ReactNode;
  pendingIcon?: React.ReactNode;
}

interface OrderProgressBarProps {
  isCancelled: boolean;
  processStage: number;
  stageLabels?: string[];
  stages?: StageConfig[];
}

// Icon mặc định cho giai đoạn hoàn thành
const DefaultCompletedIcon = () => (
  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
  </svg>
);

// Icon mặc định cho giai đoạn chờ xử lý
const DefaultPendingIcon = () => (
  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Icon mặc định cho giai đoạn bị hủy
const DefaultCancelledIcon = () => (
  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Các tên giai đoạn mặc định
const defaultStageLabels = ['Processing', 'Confirmed', 'Completed'];

export default function OrderProgressBar({ 
  isCancelled, 
  processStage,
  stageLabels = defaultStageLabels,
  stages
}: OrderProgressBarProps) {
  // Sử dụng các nhãn được cung cấp hoặc mặc định
  const labels = stageLabels || defaultStageLabels;
  
  return (
    <div className="flex items-center justify-between mb-6 max-w-3xl mx-auto">
      {/* Giai đoạn 1 */}
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isCancelled ? 'bg-red-500' : 
          processStage >= 2 ? 'bg-green-500' : 
          'bg-yellow-500'
        }`}>
          {isCancelled ? (
            stages && stages[0]?.completedIcon ? stages[0].completedIcon : <DefaultCancelledIcon />
          ) : processStage >= 2 ? (
            stages && stages[0]?.completedIcon ? stages[0].completedIcon : <DefaultCompletedIcon />
          ) : (
            stages && stages[0]?.pendingIcon ? stages[0].pendingIcon : <DefaultPendingIcon />
          )}
        </div>
        <span className={`text-sm font-medium mt-1 ${
          isCancelled ? 'text-red-500' : 
          processStage >= 2 ? 'text-green-500' : 
          'text-yellow-500'
        }`}>
          {isCancelled ? 'Rejected' : 
           processStage >= 2 ? 'Completed' : 
           labels[0]}
        </span>
      </div>
      
      {/* Đường nối giữa giai đoạn 1 và 2 */}
      <div className={`flex-1 h-[2px] mx-2 ${processStage >= 2 ? 'bg-green-500' : 'bg-gray-300'}`} />
      
      {/* Giai đoạn 2 */}
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${processStage >= 2 ? 'bg-green-500' : 'bg-gray-400'}`}>
          {processStage >= 2 ? (
            stages && stages[1]?.completedIcon ? stages[1].completedIcon : <DefaultCompletedIcon />
          ) : (
            stages && stages[1]?.pendingIcon ? stages[1].pendingIcon : <span className="text-white font-bold">2</span>
          )}
        </div>
        <span className={`text-sm font-medium mt-1 ${processStage >= 2 ? 'text-green-500' : 'text-gray-500'}`}>
          {labels[1]}
        </span>
      </div>
      
      {/* Đường nối giữa giai đoạn 2 và 3 */}
      <div className={`flex-1 h-[2px] mx-2 ${processStage >= 3 ? 'bg-green-500' : 'bg-gray-300'}`} />
      
      {/* Giai đoạn 3 */}
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${processStage >= 3 ? 'bg-green-500' : 'bg-gray-400'}`}>
          {processStage >= 3 ? (
            stages && stages[2]?.completedIcon ? stages[2].completedIcon : <DefaultCompletedIcon />
          ) : (
            stages && stages[2]?.pendingIcon ? stages[2].pendingIcon : <span className="text-white font-bold">3</span>
          )}
        </div>
        <span className={`text-sm font-medium mt-1 ${processStage >= 3 ? 'text-green-500' : 'text-gray-500'}`}>
          {labels[2]}
        </span>
      </div>
    </div>
  );
} 