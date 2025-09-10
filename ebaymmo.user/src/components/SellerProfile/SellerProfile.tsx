import { useGetSellerStoreQuery } from '@/generated/graphql';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface ISellerProfileProps {
    sellerId: string;
    averageRating: number;
    totalRate: number;
}

export default function SellerProfile({
    sellerId,
    averageRating,
    totalRate
}: ISellerProfileProps) {
    const { data, loading, error } = useGetSellerStoreQuery({
        variables: {
            where: {
                userId: {
                    _eq: sellerId?.toString()
                }
            }
        }
    });
    const dataSeller = data?.getSellerStoreView;

    const formattedTags = dataSeller?.map((store) => {
        return {
            slugCategory: store.parentCategorySlug || store.categorySlug,
            nameCategory: store.parentCategoryName || store.categoryName,
            slugSubCategory: store.parentCategorySlug ? store.categorySlug : '',
            nameSubCategory: store.parentCategoryName ? store.categoryName : ''
        };
    });

    // Remove duplicate tags
    const uniqueTags = formattedTags?.filter(
        (tag, index, self) =>
            index ===
            self.findIndex(
                (t) =>
                    t.nameCategory === tag.nameCategory &&
                    t.nameSubCategory === tag.nameSubCategory
            )
    );

    const seller = dataSeller?.[0];

    if (loading) return <SellerProfileSkeleton />;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <>
            <div className="section-postdetail-right flex flex-col items-start gap-[20px] w-full md:w-[460px] font-beausans">
                <div className="section-postdetail-seller flex flex-col items-start gap-[33px] p-[15px] md:p-[30px] bg-[#F7F7F7] rounded-[16px]">
                    <h2 className="text-[20px] md:text-[24px] font-bold leading-[140%] text-[#1C1C1C]">
                        Seller Profile
                    </h2>
                    <div className="seller-profile flex flex-col gap-[18px] items-start self-stretch w-full">
                        <div className="seller-top flex flex-col md:flex-row items-start md:items-center gap-[16px] flex-wrap w-full">
                            <Link href={`/user-details/${sellerId}`}>
                                <Image
                                    src={
                                        seller?.images ||
                                        '/images/gmail-2023-6-7-thang_740495.png'
                                    }
                                    alt=""
                                    width="58"
                                    height="58"
                                    className="rounded-[82px]"
                                />
                            </Link>

                            <div className="seller-main flex flex-col items-start">
                                <div className="flex items-center gap-[10px] flex-wrap">
                                    <Link
                                        href={`/user-details/${sellerId}`}
                                        className="text-[20px] font-normal leading-[160%] text-[#47A8DF] "
                                    >
                                        {seller?.username}
                                    </Link>
                                    <div className="status flex items-center gap-[10px] whitespace-normal">
                                        <div>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="8"
                                                height="8"
                                                viewBox="0 0 8 8"
                                                fill="none"
                                            >
                                                <circle
                                                    cx="4.06152"
                                                    cy="3.89062"
                                                    r="3.50293"
                                                    fill={
                                                        seller?.lastLogin
                                                            ? '#6C6C6C'
                                                            : '#33A959'
                                                    }
                                                />
                                            </svg>
                                        </div>

                                        <p
                                            className={
                                                'text-[14px] font-normal leading-[160%] text-[#6C6C6C] text-right'
                                            }
                                        >
                                            {!seller?.lastLogin
                                                ? 'Online'
                                                : `Online ${formatDistanceToNow(
                                                      new Date(seller.lastLogin)
                                                  )} ago`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="seller-bottom flex items-center gap-[16px] font-normal leading-[160%] w-full md:w-auto">
                                <div>
                                    <div className="flex flex-col gap-[10px]">
                                        <div className="flex items-center gap-[7px]">
                                            <div className="flex items-center   ">
                                                <div className="text-[#F8E008] flex items-center">
                                                    <Image
                                                        src="/images/star-24.svg"
                                                        alt=""
                                                        width="16"
                                                        height="16"
                                                    />
                                                    <span className="pr-2">
                                                        {averageRating.toFixed(
                                                            1
                                                        ) || 0}
                                                    </span>
                                                </div>
                                                <p className="text-[#6C6C6C] text-[14px]">
                                                    ({totalRate})
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-[14px] text-[#6C6C6C]">
                                            <p>
                                                Products Sell:&nbsp;
                                                {seller?.totalSoldCount}
                                                &nbsp; products
                                            </p>
                                            <p>
                                                Products Available:&nbsp;
                                                {seller?.totalStockCount}
                                                &nbsp; products
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        className="connect-telegram flex items-start gap-[5px] cursor-pointer"
                                        onClick={() => {
                                            window.location.href = `/chatbox?chatto=${seller?.username}`;
                                        }}
                                    >
                                        <Image
                                            src="/images/telegram-green.svg"
                                            alt=""
                                            width="20"
                                            height="20"
                                        />
                                        <span className="text-[14px] font-[550] leading-[160%] text-[#33A959]">
                                            Connect with {seller?.username}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="section-postdetail-tag rounded-[16px] w-full md:w-[460px] font-beausans p-[15px] md:p-[30px] bg-[#F7F7F7] flex flex-col items-start gap-[33px]">
                    <h2 className="text-[20px] md:text-[24px] font-bold leading-[140%] text-[#1C1C1C]">
                        Tags
                    </h2>

                    <div className="flex items-center flex-wrap gap-[14px] !justify-start md:justify-center text-[14px] md:text-[16px] font-normal leading-[160%] text-[#3F3F3F]">
                        {uniqueTags?.map((item, idx) => (
                            <a
                                key={idx}
                                href={`/products?type=${
                                    ['increase', 'service', 'blockchain'].some(
                                        (keyword) =>
                                            item.nameCategory
                                                ?.toLowerCase()
                                                .includes(keyword)
                                    )
                                        ? 'service'
                                        : 'product'
                                }&category=${item.slugCategory}&subCategory=${item.slugSubCategory}`}
                                className="rounded-[7px] bg-[#E6E6E6] px-[15px] py-[10px]"
                            >
                                {item.nameSubCategory
                                    ? item.nameSubCategory
                                    : item.nameCategory}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

const SellerProfileSkeleton = () => {
    return (
        <div className="section-postdetail-right flex flex-col items-start gap-[20px] w-full md:w-[460px] font-beausans">
            <div className="section-postdetail-seller flex flex-col items-start gap-[33px] p-[15px] md:p-[30px] bg-[#F7F7F7] rounded-[16px]">
                <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="flex flex-col md:flex-row items-start gap-4 w-full">
                    <div className="h-[58px] w-[58px] rounded-full bg-gray-200 animate-pulse" />
                    <div className="space-y-3 flex-1">
                        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
                            <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="section-postdetail-tag rounded-[16px] w-full md:w-[460px] p-[15px] md:p-[30px] bg-[#F7F7F7]">
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-6" />
                <div className="flex flex-wrap gap-3">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-8 w-24 bg-gray-200 rounded animate-pulse"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
