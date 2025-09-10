import React from 'react';

interface StatusBadgeProps {
    status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const statuStyle = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'bg-[#6EEC97] text-[#248C46]';
            case 'successed':
                return 'bg-[#6EEC97] text-[#248C46]';
            case 'approved':
                return 'bg-[#6EEC97] text-[#248C46]';
            case 'refunded':
                return 'bg-[#E8F7FF] text-[#0095FF]';
            case 'canceled':
                return 'bg-[#FAA0A0] text-[#D33E3E]';
            case 'cancelled':
                return 'bg-[#FAA0A0] text-[#D33E3E]';
            case 'rejected':
                return 'bg-[#FAA0A0] text-[#D33E3E]';
            case 'pending':
                return 'bg-[#E2DA035E] text-[#EBC608]';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <div
            className={`w-[90px] max-w-[115px] h-[30px] flex items-center justify-center rounded-[5px] text-[14px] font-[400] ${statuStyle(status)}`}
        >
            {status}
        </div>
    );
};

export default StatusBadge;
