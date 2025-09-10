import Image from 'next/image';
import { useRouter } from 'next/navigation';
import arrowRight from '@images/arrow-forward.1.svg';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
interface ServiceItemProps {
    isService?: boolean;
    price?: number;
    productId: string;
    productImage?: string;
    productName?: string;
    quantity?: number;
    status?: string;
    startIsFeatured?: boolean;
    description?: string;
    slug?: string;
}

interface ServiceListProps {
    service: ServiceItemProps;
    isLoading: boolean;
}

const ServiceCategoryItem: React.FC<ServiceListProps> = ({
    service,
    isLoading
}) => {
    const router = useRouter();
    const t = useTranslations('categorysection');
    return (
        <>
            <Link
                href={`/products?type=service&category=${service.slug}`}
                key={service.productId}
                className="w-full lg:w-[340px] lg:h-[390px] md:mr-[20px] flex flex-col"
            >
                <div className="relative w-full h-[224px] rounded-[24px] overflow-hidden">
                    {isLoading ? (
                        <div className="animate-pulse bg-gray-300 w-full h-full" />
                    ) : (
                        <Image
                            src={
                                service.productImage ??
                                '/images/softwareservice.png'
                            }
                            alt={service.productName ?? ''}
                            fill
                            className="object-cover"
                        />
                    )}
                </div>
                <div className="mt-3 ml-2 md:ml-0 md:mt-[24px] space-y-[12px]">
                    {isLoading ? (
                        <>
                            <div className="animate-pulse bg-gray-300 h-[24px] w-[200px]" />
                            <div className="animate-pulse bg-gray-300 h-[18px] w-[250px]" />
                            <div className="animate-pulse bg-gray-300 h-[24px] w-[100px] mt-2" />
                        </>
                    ) : (
                        <>
                            <span
                                className=" text-[#1C1C1C] text-[20px] font-bold leading-[140%] 
            line-clamp-2 text-ellipsis overflow-hidden break-words max-w-[320px] "
                            >
                                {service.productName}
                            </span>
                            <p
                                className="text-[#3F3F3F] text-[18px] font-normal leading-[29px] 
            max-w-[320px] line-clamp-2 text-ellipsis overflow-hidden break-words"
                            >
                                {service.description}
                            </p>
                            <button
                                // onClick={() => router.push(service.href ?? '')}
                                className="flex items-center text-[#F15959] hover:text-[#ff6b6b] transition-colors cursor-pointer"
                            >
                                <p className="text-[var(--secondary-500,#F15959)] text-[18px] font-semibold leading-[160%] text-center mr-[10px]">
                                    {t('seemore')}
                                </p>
                                <Image
                                    src={arrowRight}
                                    alt="arrow-right"
                                    width={24}
                                    height={24}
                                />
                            </button>
                        </>
                    )}
                </div>
            </Link>
        </>
    );
};

export default ServiceCategoryItem;
