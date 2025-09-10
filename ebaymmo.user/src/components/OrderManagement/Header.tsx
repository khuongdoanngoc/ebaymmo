import Input from '@/components/BaseUI/Input';
import { useTranslations } from 'next-intl';

interface HeaderProps {
    searchTerm: string;
    filterType: string;
    onSearch: (value: string) => void;
    onFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default function Header({
    searchTerm,
    filterType,
    onSearch,
    onFilterChange
}: HeaderProps) {
    const t = useTranslations('order-management.header');

    return (
        <div>
            <div className="flex justify-between items-center">
                <h1 className="sm:text-[24px] text-[16px] font-[700] font-beausans">
                    {t('title')}
                </h1>
            </div>
            <div className="flex w-full">
                <Input
                    display="inherit"
                    type="search"
                    className="rounded-[86px] w-inherit"
                    placeHolder={t('searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => onSearch(e.target.value)}
                    autoFocus
                />
                <select
                    value={filterType}
                    onChange={onFilterChange}
                    className="mt-[16px] w-[185px] ml-[30px] bg-white border-[2px] border-border_color rounded-[15px] focus:border-green_main p-[12px]"
                >
                    <option value="">{t('filter.all')}</option>
                    <option value="order-code">{t('filter.orderCode')}</option>
                    <option value="seller">{t('filter.seller')}</option>
                </select>
            </div>
        </div>
    );
}
