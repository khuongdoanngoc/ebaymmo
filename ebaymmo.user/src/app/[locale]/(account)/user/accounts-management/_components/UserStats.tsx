import { UserStatisticsQuery } from '@/generated/graphql';
import { useTranslations } from 'next-intl';

interface UserStatsProps {
    userStatistics: UserStatisticsQuery['userStatistics'][0] | undefined;
}

export default function UserStats({ userStatistics }: UserStatsProps) {
    const t = useTranslations('user.account-management.stats');

    return (
        <div className="space-y-4 flex flex-col gap-[30px]">
            <div>
                <label className="block text-[18px] font-medium text-gray-700 mt-8">
                    {t('purchased')}
                </label>
                <p className="mt-1 text-[18px] text-gray-600">
                    {userStatistics?.totalOrders || 0} {t('orders')}
                </p>
            </div>
            <div>
                <label className="block text-[18px] font-medium text-gray-700">
                    {t('number-of-stores')}
                </label>
                <p className="mt-1 text-[18px] text-gray-600">
                    {userStatistics?.totalStores || 0} {t('stores')}
                </p>
            </div>
            <div>
                <label className="block text-[18px] font-medium text-gray-700">
                    {t('sold')}
                </label>
                <p className="mt-1 text-[18px] text-gray-600">
                    {userStatistics?.totalSold || 0} {t('products')}
                </p>
            </div>
            <div>
                <label className="block text-[18px] font-medium text-gray-700">
                    {t('number-of-posts')}
                </label>
                <p className="mt-1 text-[18px] text-gray-600">
                    {userStatistics?.totalBlogs || 0} {t('posts')}
                </p>
            </div>
        </div>
    );
}
