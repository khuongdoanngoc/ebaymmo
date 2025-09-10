import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { formatDistance } from 'date-fns';
import { useRouter } from 'next/navigation';

interface PostItemProps {
    title: string;
    description: string;
    date: string;
    likes?: number;
    views?: number;
    author: {
        name: string;
        avatar: string;
    };
    image: string;
    ghostSlug?: string;
    isFavorite?: boolean;
    blogId?: string;
    showFavorite?: boolean;
    onFavoriteClick?: () => Promise<void>;
}

const PostItem: React.FC<PostItemProps> = ({
    title = 'Share Free Telegram Bot for Downloading Images and Videos',
    description = 'Diverse products, no data sales. Online support available 24/7!',
    date = '2024-11-13T09:08:00',
    likes = 0,
    views = 66,
    author = {
        name: 'MSMARGOT',
        avatar: '/images/user/person.svg'
    },
    image = '/images/test.png',
    ghostSlug,
    isFavorite = false,
    showFavorite = false,
    onFavoriteClick
}) => {
    const router = useRouter();
    const [localFavorite, setLocalFavorite] = useState(isFavorite);

    useEffect(() => {
        setLocalFavorite(isFavorite);
    }, [isFavorite]);

    const handleFavoriteClick = async (e: React.MouseEvent) => {
        e.stopPropagation();

        setLocalFavorite(!localFavorite);

        if (onFavoriteClick) {
            try {
                await onFavoriteClick();
            } catch (error) {
                setLocalFavorite(localFavorite);
                console.error('Error toggling favorite:', error);
            }
        }
    };

    return (
        <div
            className="flex gap-6 mb-8 cursor-pointer"
            onClick={() => ghostSlug && router.push(`/shares/${ghostSlug}`)}
        >
            {/* Post Image */}
            <div className="relative w-[300px] h-[300px] rounded-lg overflow-hidden">
                {showFavorite && (
                    <button
                        className="absolute top-2 right-2 bg-white/10 p-2 rounded-full z-20"
                        onClick={handleFavoriteClick}
                    >
                        <Image
                            src={
                                localFavorite
                                    ? '/images/heart-checked.svg'
                                    : '/images/heart.svg'
                            }
                            alt="Favorite"
                            width={30}
                            height={30}
                        />
                    </button>
                )}
                <div className="relative w-full h-full transition-transform duration-300 hover:scale-110">
                    <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover"
                    />
                </div>
            </div>

            {/* Post Details */}
            <div className="flex-1">
                <div className="flex items-center gap-4 text-gray-500 mb-4 justify-space-between">
                    <div className="flex items-center gap-1">
                        <Image
                            src="/images/clock.svg"
                            alt="Date"
                            width={16}
                            height={16}
                        />
                        <span>
                            {formatDistance(new Date(date), new Date(), {
                                addSuffix: true
                            })}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            <Image
                                src="/images/heart-icon2.svg"
                                alt="Likes"
                                width={16}
                                height={16}
                            />
                            <span>{likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Image
                                src="/images/chat-round-line.svg"
                                alt="Views"
                                width={16}
                                height={16}
                            />
                            <span>{views}</span>
                        </div>
                    </div>
                </div>

                <h3 className="text-xl font-medium mb-4 line-clamp-2 cursor-pointer hover:text-[#33A959] transition-colors">
                    {title}
                </h3>

                <p className="text-gray-600 mb-6">{description}</p>

                <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                    <Image
                        src={author.avatar}
                        alt={author.name}
                        width={32}
                        height={32}
                        className="rounded-full"
                    />
                    <span className="text-[#47A8DF]">{author.name}</span>
                </div>
            </div>
        </div>
    );
};

export default PostItem;
