import React from 'react';

interface ProgressStage {
  name: string;
  status: 'completed' | 'current' | 'pending' | 'cancelled';
  completedIcon?: React.ReactNode;
  pendingIcon?: React.ReactNode;
  cancelledIcon?: React.ReactNode;
}

interface ProgressBarWithIconsProps {
  stages: ProgressStage[];
  customColors?: {
    completed?: string;
    current?: string;
    pending?: string;
    cancelled?: string;
    completedText?: string;
    currentText?: string;
    pendingText?: string;
    cancelledText?: string;
    completedLine?: string;
    pendingLine?: string;
  };
}

// Icon mặc định cho từng trạng thái
const DefaultIcons = {
  completed: (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  ),
  current: (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  pending: <span className="text-white font-bold" />,
  cancelled: (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
};

// Màu mặc định cho từng trạng thái
const defaultColors = {
  completed: 'bg-green-500',
  current: 'bg-blue-500',
  pending: 'bg-gray-400',
  cancelled: 'bg-red-500',
  completedText: 'text-green-500',
  currentText: 'text-blue-500',
  pendingText: 'text-gray-500',
  cancelledText: 'text-red-500',
  completedLine: 'bg-green-500',
  pendingLine: 'bg-gray-300'
};

export default function ProgressBarWithIcons({ 
  stages, 
  customColors = {}
}: ProgressBarWithIconsProps) {
  // Kết hợp màu mặc định với màu tùy chỉnh
  const colors = { ...defaultColors, ...customColors };
  
  const getIconForStage = (stage: ProgressStage) => {
    if (stage.status === 'cancelled' && stage.cancelledIcon) return stage.cancelledIcon;
    if (stage.status === 'completed' && stage.completedIcon) return stage.completedIcon;
    if ((stage.status === 'current' || stage.status === 'pending') && stage.pendingIcon) return stage.pendingIcon;
    
    return DefaultIcons[stage.status];
  };
  
  return (
    <div className="flex items-center justify-between mb-6 max-w-4xl mx-auto">
      {stages.map((stage, index) => (
        <React.Fragment key={index}>
          {/* Điểm giai đoạn */}
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colors[stage.status]}`}>
              {getIconForStage(stage)}
            </div>
            <span className={`text-sm font-medium mt-1 ${colors[`${stage.status}Text`]}`}>
              {stage.name}
            </span>
          </div>
          
          {/* Đường nối giữa các giai đoạn (không hiển thị sau giai đoạn cuối cùng) */}
          {index < stages.length - 1 && (
            <div className={`flex-1 h-[2px] mx-2 ${
              // Nếu giai đoạn hiện tại đã hoàn thành, thì đường nối cũng là hoàn thành
              (stage.status === 'completed' || stage.status === 'current') ? 
                colors.completedLine : 
                colors.pendingLine
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
} 