import { useTranslations } from 'next-intl';
interface AuctionStatusProps {
    isAuctionTime: boolean;
}

export const AuctionStatus = ({ isAuctionTime }: AuctionStatusProps) => {
    const t = useTranslations('auction');
    return (
        <>
            {isAuctionTime ? (
                <div className="flex flex-col items-center">
                    <span className="text-green-500 font-semibold">
                        {t('prepareauction')}
                    </span>
                    <span className="text-gray-600 text-sm">
                        {t('endauction')}
                    </span>
                </div>
            ) : (
                <span className="text-gray-600 text-sm">
                    {t('startauction')}
                </span>
            )}
        </>
    );
};
