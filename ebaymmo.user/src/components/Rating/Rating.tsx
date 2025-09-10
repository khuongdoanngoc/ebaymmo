import { formatDate } from '@/utils/formatDate';
import Image from 'next/image';

interface RatingProps {
    rating_id: string; // UUID, Primary Key, Unique
    full_name: string | null;
    avatar: string | null;
    rating: number | null; // Integer, Nullable
    review?: string | null; // Text, Nullable
    images?: string[] | null;
    update_at?: string | null; // Timestamp without time zone, Nullable
    ratingDate?: string | null;
    response?: string | null;
    storeName?: string | null;
    storeAvatar?: string | null;
}

export default function Rating(ratingData: RatingProps) {
    return (
        <div className="flex flex-col w-full gap-5 mb-8">
            <div className="flex gap-5">
                <Image
                    src={ratingData.avatar || '/images/avatar.svg'}
                    alt="avatar"
                    width={78}
                    height={78}
                    className="w-[78x] h-[78px] object-cover rounded-[50%]"
                />
                <div className="flex flex-col justify-center gap-2">
                    <h3 className="text-neutral-500 text-medium font-bold">
                        {ratingData.full_name}
                    </h3>
                    <p className="text-neutral-300 text-sm">
                        {ratingData.ratingDate}
                    </p>
                </div>
            </div>
            <div className="flex gap-2">
                {[...Array(ratingData.rating)].map((_, index) => (
                    <Image
                        key={index}
                        src="/images/star.svg"
                        alt="Star"
                        width={25}
                        height={25}
                        className=""
                    />
                ))}
            </div>
            <p className="font-bold">"{ratingData.review}"</p>
            <div className="flex gap-4">
                {ratingData?.images &&
                    ratingData.images?.length > 0 &&
                    ratingData.images.map((img: string, index: number) => (
                        <Image
                            key={index}
                            src={img}
                            alt="Review Image"
                            width={100}
                            height={100}
                            className="object-cover rounded-[7px] w-[100px] h-[100px]"
                        />
                    ))}
            </div>
            {/* Phần hiển thị response */}
            {ratingData.response && (
                <div className="ml-8 border-l-2 border-neutral-200 pl-4">
                    <div className="flex items-center gap-3 mb-2">
                        <Image
                            src={ratingData.storeAvatar || '/images/human.svg'}
                            alt="Store response"
                            width={40}
                            height={40}
                            className="object-cover rounded-[50%]"
                        />
                        <div>
                            <h4 className="text-neutral-500 font-bold">
                                {ratingData.storeName}
                            </h4>
                            <p className="text-neutral-300 text-xs mt-2">
                                {ratingData.update_at || ratingData.ratingDate}
                            </p>
                        </div>
                    </div>
                    <p className="text-neutral-400 font-bold mt-4">
                        "{ratingData.response}"
                    </p>
                </div>
            )}
        </div>
    );
}
