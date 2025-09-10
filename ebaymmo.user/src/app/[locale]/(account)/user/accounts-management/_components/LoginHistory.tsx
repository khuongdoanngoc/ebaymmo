'use client';

import { useTranslations } from 'next-intl';

export default function LoginHistory() {
    const t = useTranslations('user.account-management.login-history');
    const history = [
        {
            date: '13-02-2025 04:36',
            ip: '42.118.241.48',
            device: '42.118.241.48'
        },
        {
            date: '10-02-2025 06:59',
            ip: '118.68.182.102',
            device: '118.68.182.102'
        },
        {
            date: '10-02-2025 03:27',
            ip: '118.68.182.102',
            device: '118.68.182.102'
        }
    ];

    return (
        <div>
            <h2 className="text-[18px] font-medium text-gray-700 mb-[30px] mt-[30px]">
                {t('title')}
            </h2>
            <div className="space-y-4">
                {history.map((entry, index) => (
                    <div key={index}>
                        <div className="flex flex-col gap-[10px]">
                            <div className="flex gap-2">
                                <span className="bg-[#33A959] text-white text-[14px] px-2 py-1">
                                    {entry.date}
                                </span>
                                <span className="bg-[#F3A638] text-white text-[14px] px-2 py-1">
                                    {t('ip')}: {entry.ip}
                                </span>
                            </div>
                            <p className="text-[16px] text-gray-700">
                                {t('device')}: {entry.device}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
