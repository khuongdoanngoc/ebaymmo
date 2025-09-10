import Image from 'next/image';
import ImageDefault from '@images/telegram.svg';
import AvatarDefault from '@images/avatar.svg';
import { useRouter } from 'next/navigation';
import TelegramGreen from '@images/telegram-green.svg';
import { useWishlist } from '@/contexts/WishlistContext';
interface RelatedProductProps {
    id: string;
    title: string;
    imageProductUrl: string;
    rating: number | null;
    ratingTotal: number;
    ProductCategory: string;
    price: number | null;
    sellerName: string;
    sellerAvatar: string;
    stockCount: number;
    soldCount: number;
    isService: boolean;
    storeTag: string | null;
    slug: string;
    subTitle: string;
    sellerId: string;
}

function getValidImageUrl(url: string | null | undefined): string {
    if (!url || url === '') return ImageDefault.src;
    try {
        // Kiểm tra xem url có phải là URL tuyệt đối không
        new URL(url);
        return url;
    } catch {
        // Nếu url là đường dẫn tương đối, thêm dấu / ở đầu
        return url.startsWith('/') ? url : `/${url}`;
    }
}

export default function RelatedProductItem({
    id,
    title,
    imageProductUrl,
    ratingTotal,
    ProductCategory,
    price,
    sellerName,
    sellerAvatar,
    stockCount,
    soldCount,
    subTitle,
    slug,
    sellerId,
    rating
}: RelatedProductProps) {
    const { isWishlisted, handleToggleWishlist } = useWishlist();
    const router = useRouter();

    // Hàm xử lý text chung cho title và description
    const getCleanText = (text: string) => {
        try {
            // Nếu là JSON string, parse và xử lý
            const parsed = JSON.parse(text);

            // Nếu là object có thuộc tính text
            if (parsed.text) return parsed.text;

            // Nếu là object có thuộc tính data.text
            if (parsed.data?.text) return parsed.data.text;

            // Nếu là mảng
            if (Array.isArray(parsed)) {
                // Lấy text từ item đầu tiên nếu có
                if (parsed[0]?.text) return parsed[0].text;
                if (parsed[0]?.data?.text) return parsed[0].data.text;

                // Nếu không có text, kết hợp tất cả các trường thành một string
                return parsed
                    .map((item) => Object.values(item).join(' '))
                    .join(' ')
                    .trim();
            }

            // Nếu là object khác, kết hợp tất cả các trường
            if (typeof parsed === 'object') {
                return Object.values(parsed)
                    .map((value) =>
                        typeof value === 'object'
                            ? JSON.stringify(value)
                            : String(value)
                    )
                    .join(' ')
                    .trim();
            }

            return text;
        } catch {
            // Nếu không phải JSON, trả về nguyên text
            return text;
        }
    };

    const cleanTitle = getCleanText(title);

    const navigateToProduct = () => {
        router.push(`/products/${slug || id}`);
    };

    return (
        <div
            className="bg-[#f7f7f7] rounded-lg p-4 relative cursor-pointer hover:shadow-xl transition-shadow duration-300"
            onClick={navigateToProduct}
        >
            {/* Badge và Heart icon */}
            <div className="relative">
                <span className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 text-sm rounded">
                    Not Duplicate
                </span>
                {isWishlisted(id) ? (
                    <button className="absolute top-[20px] right-[20px]">
                        <Image
                            src="/images/heart-checked.svg"
                            alt="favorite"
                            width={30}
                            height={30}
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent parent onClick from firing
                                handleToggleWishlist(id);
                            }}
                        />
                    </button>
                ) : (
                    <button className="absolute top-[20px] right-[20px]">
                        <Image
                            src="/images/heart.2.png"
                            alt="favorite"
                            width={30}
                            height={30}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleToggleWishlist(id);
                            }}
                        />
                    </button>
                )}

                {/* Product Image */}
                <Image
                    src={
                        imageProductUrl
                            ? getValidImageUrl(imageProductUrl)
                            : TelegramGreen.src
                    }
                    alt={title || 'Product image'}
                    width={400}
                    height={200}
                    className="w-full h-[200px] object-cover rounded-lg"
                />
            </div>

            {/* Rating */}
            <div className="mt-3 flex items-center">
                <div className="flex items-center text-yellow-400">
                    <Image
                        src="/images/star.svg"
                        alt="Rating"
                        width={16}
                        height={16}
                    />
                    <span className="ml-1">
                        {rating && rating > 0
                            ? rating?.toFixed(1)
                            : 'No reviews'}
                    </span>
                </div>
                <span className="text-gray-500 ml-1">({ratingTotal || 0})</span>
            </div>

            {/* Title & Description */}
            <h3 className="mt-2 text-lg font-medium line-clamp-1">
                {cleanTitle}
            </h3>
            <span className="text-gray-700 ml-1 h-[40px] block !line-clamp-2 text-[13px]">
                {subTitle}
            </span>

            {/* Product Details */}
            <div className="mt-4 space-y-2">
                <div className="flex items-center">
                    <Image
                        src="/images/warehouse.svg"
                        alt="Warehouse"
                        width={20}
                        height={20}
                    />
                    <span className="ml-2">Warehouse</span>
                    <span className="ml-auto">{stockCount}</span>
                </div>
                <div className="flex items-center">
                    <Image
                        src="/images/sold.svg"
                        alt="Sold"
                        width={20}
                        height={20}
                    />
                    <span className="ml-2">Sold</span>
                    <span className="ml-auto">{soldCount}</span>
                </div>
                <div className="flex items-center">
                    <Image
                        src="/images/product.svg"
                        alt="Product"
                        width={20}
                        height={20}
                    />
                    <span className="ml-2">Product</span>
                    <span className="ml-auto text-green-500">
                        {ProductCategory}
                    </span>
                </div>
            </div>

            {/* Seller Info */}
            <div className="mt-4 flex items-center h-[36px]">
                <Image
                    src={
                        sellerAvatar
                            ? getValidImageUrl(sellerAvatar)
                            : AvatarDefault.src
                    }
                    alt={sellerName || 'Seller'}
                    width={24}
                    height={24}
                    className="rounded-full"
                />
                <a
                    href={`/user-details/${sellerId}`}
                    className="ml-2 text-blue-500"
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent parent onClick from firing
                    }}
                >
                    {sellerName}
                </a>
                <a
                    href="#"
                    className="ml-2"
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent parent onClick from firing
                    }}
                >
                    <Image
                        src="/images/telegreen.svg"
                        alt="Telegram"
                        width={20}
                        height={20}
                    />
                </a>
            </div>

            {/* Buy Button & Price */}
            <div className="mt-4 flex items-center justify-between">
                <button
                    className="bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600"
                    // onClick={(e) => {
                    //     e.stopPropagation();
                    // }}
                >
                    Buy now
                </button>
                <span className="text-red-500 font-bold">
                    {price ? `${price} USDT` : '0 USDT'}
                </span>
            </div>
        </div>
    );
}
