import { useWishlist } from '@/contexts/WishlistContext';
import Image from 'next/image';
import Link from 'next/link';

interface FavouriteStoreImageProps {
    avatar: string;
    storeName: string;
    type: string;
    isFavorite: boolean;
    storeId: string;
    loading?: boolean;
    slug?: string;
    onFavoriteClick: () => void;
}

export default function FavouriteStoreImage({
    avatar,
    type,
    storeName,
    isFavorite,
    storeId,
    loading,
    slug,
    onFavoriteClick
}: FavouriteStoreImageProps) {
    const { isWishlisted, handleToggleWishlist } = useWishlist();
    return (
        <div className="image-favourite flex flex-col relative w-full  lg:max-w-[290px] md:max-w-full">
            <Link
                className="flex flex-col items-center justify-center w-full"
                href={`/products/${slug}`}
            >
                {' '}
                <div className="flex flex-col items-center justify-center w-full ">
                    <Image
                        src={avatar}
                        alt={storeName}
                        width={293}
                        height={213}
                        className="lg:w-full md:w-[290px] w-[340px]  h-[213px] rounded-[10px] object-cover"
                    />
                </div>
            </Link>

            <span className="absolute inline-flex items-center px-[10px]  py-[7px] rounded-[7px] text-[14px] font-medium text-white bg-sub-gradio cursor-pointer">
                {type}
            </span>
            {isWishlisted(storeId) ? (
                <button className="absolute top-[20px] right-[20px]">
                    <Image
                        src="/images/heart-checked.svg"
                        alt="favorite"
                        width={30}
                        height={30}
                        onClick={() => handleToggleWishlist(storeId)}
                    />
                </button>
            ) : (
                <button className="absolute top-[20px] right-[20px]">
                    <Image
                        src="/images/heart.2.png"
                        alt="favorite"
                        width={30}
                        height={30}
                        onClick={() => handleToggleWishlist(storeId)}
                    />
                </button>
            )}
        </div>
    );
}
