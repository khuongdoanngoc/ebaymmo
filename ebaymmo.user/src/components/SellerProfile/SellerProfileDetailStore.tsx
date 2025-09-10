import React from 'react';
import Image from 'next/image';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useTranslations } from 'next-intl';
import 'dayjs/locale/en';
import { formatDate } from '@/utils/formatDate';
import { useRouter } from 'next/navigation';

dayjs.extend(relativeTime);
dayjs.locale('en');

interface SellerProfileDetailStoreProps {
    username?: string;
    lastOnline?: string;
    registrationDate?: string;
    purchased?: number | null;
    stores?: number;
    sold?: number | null;
    posts?: number;
    avatar?: string | null;
    storePointsData?: { points: number; nextLevelPoints: number };
    level?: number;
}

const SellerProfileDetailStore: React.FC<SellerProfileDetailStoreProps> = ({
    level = 1,
    username = 'Unknown User',
    lastOnline = 'N/A',
    registrationDate = 'Not seller',
    purchased = 0,
    stores = 0,
    sold = 0,
    posts = 0,
    avatar = null,
    storePointsData
}) => {
    const router = useRouter();
    const t = useTranslations();
    const displayAvatar = avatar || '/images/default-avatar.png';

    const formatLastOnline = (lastLoginTime: string) => {
        if (lastLoginTime === 'N/A') return t('store.details.online');
        const lastLogin = dayjs(lastLoginTime);
        return t('store.details.lastSeen', { time: dayjs().to(lastLogin) });
    };

    const progress = storePointsData
        ? (storePointsData.points / storePointsData.nextLevelPoints) * 100
        : 0;
    const calculatedLevel = level || 1;

    return (
        <div className="p-5">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="w-[120px] h-[120px] rounded-full bg-black overflow-hidden">
                        <Image
                            src={displayAvatar}
                            alt="User Avatar"
                            width={120}
                            height={120}
                            className="object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-[#FF4B55] text-white text-center py-2 text-[12px] rounded-[10px]">
                            {t('store.details.level', {
                                level: calculatedLevel
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress bar */}
            <div className="w-full mb-4">
                <div className="h-[10px] bg-[#E6E6E6] rounded-[10px] overflow-hidden">
                    <div
                        className="h-full bg-[#00A650] rounded-[10px] transition-[width] duration-1000 ease-out"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>
            </div>

            <div className="rounded-[10px] bg-white shadow-sm p-4">
                <div className="flex items-center gap-2 text-[16px] text-gray-700 mb-4 justify-around">
                    <span className="font-medium text-[#1C1C1C]">
                        {username}
                    </span>
                    <span>•</span>
                    <span
                        className={`text-gray-500 ${formatLastOnline(lastOnline) === t('store.details.online') ? 'text-green-500' : ''}`}
                    >
                        {formatLastOnline(lastOnline)}
                    </span>
                </div>
                <div
                    className="flex gap-2"
                    onClick={() => router.push(`/chatbox?chatto=${username}`)}
                >
                    <button className="flex-1 bg-[#00A650] text-white py-2 rounded-[86px] flex items-center justify-center gap-2 hover:bg-[#008c44] transition-colors">
                        {t('store.details.contact')}
                        <Image
                            src="/images/telegram-white.svg"
                            alt="send"
                            width={20}
                            height={20}
                        />
                    </button>
                    <button className="p-2 hover:opacity-80 transition-opacity">
                        <Image
                            src="/images/seller/flag-2.svg"
                            alt="flag"
                            width={30}
                            height={30}
                        />
                    </button>
                </div>
            </div>

            <div className="mt-6 space-y-4 border-t pt-4">
                {[
                    {
                        icon: '/images/seller/calendar.png',
                        label: t('store.details.registrationDate'),
                        value:
                            formatDate(
                                new Date(registrationDate),
                                'DD/MM/YYYY'
                            ) || 'Not available'
                    },
                    {
                        icon: '/images/sold.svg',
                        label: 'Purchased',
                        value: t('store.details.purchased', {
                            count: purchased || 0
                        })
                    },
                    {
                        icon: '/images/seller/store1.svg',
                        label: t('store.details.stores'),
                        value: stores
                    },
                    {
                        icon: '/images/seller/cart-check.png',
                        label: 'Sold',
                        value: t('store.details.sold', { count: sold || 0 })
                    },
                    {
                        icon: '/images/seller/posts.png',
                        label: 'Posts',
                        value: t('store.details.posts', { count: posts })
                    }
                ].map((item, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between text-[14px]"
                    >
                        <div className="flex items-center gap-2 text-[#6C6C6C]">
                            <Image
                                src={item.icon}
                                alt={item.label}
                                width={24}
                                height={24}
                            />
                            <span>{item.label}</span>
                        </div>
                        <span className="text-[#3F3F3F]">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SellerProfileDetailStore;
