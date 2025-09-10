import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface IProductStoreInfoProps {
    warehouse?: number;
    soldout?: number | null;
    tag: string;
    isService?: boolean;
}

function ProductStoreInfo(props: IProductStoreInfoProps) {
    const t = useTranslations();
    const formatTags = props.tag.toLowerCase().replace(/ /g, '-');

    return (
        <div className="flex justify-between items-center flex-wrap gap-[20px]">
            {!props.isService && (
                <>
                    <div className="flex flex-wrap items-center gap-[15px]">
                        <div className="flex flex-wrap items-center gap-[10px]">
                            <Image
                                src="/images/warehouse.svg"
                                alt="warehouse"
                                className=""
                                width={20}
                                height={24}
                            />
                            <span className="text-[18px] font-[400]">
                                {t('product.details.stock')}:
                            </span>
                        </div>
                        <span className="text-neutral-300 text-[18px] font-[400]">
                            {props.warehouse}
                        </span>
                    </div>
                    <hr className="w-[1px] min-w-[1px] h-[24px] min-h-[24px] bg-neutral-100 border-none" />
                </>
            )}
            <div className="flex flex-wrap items-center gap-[15px]">
                <div className="flex flex-wrap items-center gap-[10px]">
                    <Image
                        src="/images/sold.svg"
                        alt="sold"
                        className=""
                        width={24}
                        height={24}
                    />
                    <span className="text-[18px] font-[400]">
                        {t('product.details.sold')}:
                    </span>
                </div>
                <span className="text-neutral-300 text-[18px] font-[400]">
                    {props.soldout}
                </span>
            </div>
            <hr className="w-[1px] min-w-[1px] h-[24px] min-h-[24px] bg-neutral-100 border-none" />
            <div className="flex flex-wrap items-center gap-[15px]">
                <div className="flex flex-wrap items-center gap-[10px]">
                    <Image
                        src="/images/product.svg"
                        alt="product"
                        className=""
                        width={24}
                        height={24}
                    />
                    <span className="text-[18px] font-[400]">
                        {t('product.details.product')}:
                    </span>
                </div>
                <Link
                    href={`/products?type=${
                        ['increase', 'service', 'blockchain'].some((keyword) =>
                            formatTags.includes(keyword)
                        )
                            ? 'service'
                            : 'product'
                    }&category=${formatTags}`}
                    className="text-primary-400 text-[18px] font-[400]"
                >
                    {props.tag}
                </Link>
            </div>
        </div>
    );
}

export default ProductStoreInfo;
