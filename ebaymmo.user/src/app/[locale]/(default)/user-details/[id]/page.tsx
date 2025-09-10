'use client';

import { use, useState, useEffect } from 'react';
import SellerProfileDetailStore from '@/components/SellerProfile/SellerProfileDetailStore';
import StoreItem from '@/components/Item/StoreItems';
import PostItem from '@/components/Item/PostItems';
import Link from 'next/link';

import { useSession } from 'next-auth/react';
import StoreItemSkeleton from '@/components/Skeleton/StoreItemSkeleton';
import {
    useGetBlogsQuery,
    useGetStoreViewQuery,
    useGetUserFavoriteBlogsQuery,
    useAddBlogFavoriteMutation,
    useRemoveBlogFavoriteMutation,
    useGetUserBasicQuery,
    useGetStorePointsQuery
} from '@/generated/graphql';
// Định nghĩa kiểu dữ liệu cho StoreItemProps
interface StoreItemProps {
    title: string;
    price: string;
    image: string;
    description: string;
    category: string;
    subCategory: string;
    slug: string;
    storePointsData?: any;
    nextLevelPoints?: number;
}

// Định nghĩa kiểu dữ liệu cho PostItemProps
interface PostItemProps {
    title: string;
    description: string;
    date: string;
    likes: number;
    views: number;
    author: {
        name: string;
        avatar: string;
    };
    image: string;
    isGhostPost?: boolean;
    ghostSlug?: string;
    isFavorite: boolean;
    blogId: string;
    showFavorite?: boolean;
    onFavoriteClick?: () => Promise<void>;
}

// Hook để lấy và quản lý danh sách favorites
function useBlogFavorites() {
    const { data: session } = useSession();
    const [favoriteBlogIds, setFavoriteBlogIds] = useState<string[]>([]);

    const { data, refetch } = useGetUserFavoriteBlogsQuery({
        variables: {
            userId: session?.user?.id || '',
            limit: 100
        },
        skip: !session?.user?.id,
        fetchPolicy: 'network-only'
    });

    useEffect(() => {
        if (data?.blogFavourite) {
            const ids = data.blogFavourite.map((item) => item.blog.blogId);
            setFavoriteBlogIds(ids);
        }
    }, [data]);

    const isFavorited = (blogId: string) => favoriteBlogIds.includes(blogId);

    return { isFavorited, refetch, favoriteBlogIds };
}

export default function UserDetailsPage({
    params
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const [activeTab, setActiveTab] = useState<'store' | 'post'>('store');
    const [page, setPage] = useState(1);
    const itemsPerPage = 5;
    const { data: session } = useSession();

    // Sử dụng hook favorite
    const { isFavorited, refetch, favoriteBlogIds } = useBlogFavorites();
    const [addFavorite] = useAddBlogFavoriteMutation();
    const [removeFavorite] = useRemoveBlogFavoriteMutation();

    // State để theo dõi các bài đã favorite (để cập nhật UI ngay lập tức)
    const [localFavorites, setLocalFavorites] = useState<
        Record<string, boolean>
    >({});

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);
    const { data: userBasicData } = useGetUserBasicQuery({
        variables: {
            where: { userId: { _eq: id } }
        }
    });

    const { data: storeViewData } = useGetStoreViewQuery({
        variables: {
            where: { sellerId: { _eq: id } }
        }
    });

    const { data: blogsData } = useGetBlogsQuery({
        variables: {
            where: {
                userId: { _eq: id },
                isDeleted: { _isNull: true }
            },
            limit: 100,
            offset: 0
        }
    });

    const isCurrentUser = session?.user?.id === id;

    const { data: storePointsData } = useGetStorePointsQuery({
        variables: {
            where: {
                store: {
                    sellerId: { _eq: id }
                }
            }
        }
    });
    const userInfo = userBasicData?.getSellerStoreView?.[0];
    const totalSold = userBasicData?.getSellerStoreView?.reduce(
        (acc, item) => acc + item.totalSoldCount,
        0
    );
    const totalStock = userBasicData?.getSellerStoreView?.reduce(
        (acc, item) => acc + item.totalStockCount,
        0
    );
    const stores = storeViewData?.listingStores;
    const blogs = blogsData?.blogs;

    useEffect(() => {
        const fetchData = async () => {
            if (!session?.user?.accessToken) return;

            try {
                if (userBasicData && storeViewData && blogsData) {
                    setLoading(false);
                }
            } catch (err) {
                setError(err);
                setLoading(false);
            }
        };

        fetchData();
    }, [
        id,
        session?.user?.accessToken,
        userBasicData,
        storeViewData,
        blogsData
    ]);

    if (loading)
        return (
            <div className="container mx-auto px-4 pt-[50px] pb-[100px]">
                <div className="flex flex-col gap-4">
                    {[1, 2, 3].map((i) => (
                        <StoreItemSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    if (error) return <div>Error: {error.message}</div>;

    const user = userInfo?.username;
    if (!user) return <div>User not found</div>;

    // Dữ liệu thực tế từ stores
    const storeItems: StoreItemProps[] =
        stores && stores.length > 0
            ? stores.map((store: any) => ({
                  title: store.storeName || 'Unnamed Store',
                  price: store.lowestPrice || 0, // Nếu API có storePrice thì dùng: store.storePrice ? `${store.storePrice}$` : 'N/A'
                  image: store.avatar || '/images/default-store.png',
                  description: store.description || 'No description available',
                  category: store.parentCategorySlug
                      ? store.parentCategorySlug
                      : store.categorySlug,
                  subCategory: store.parentCategorySlug
                      ? store.categorySlug
                      : '',
                  slug: store.slug,
                  warehouse: store.stock,
                  sold: store.sold
              }))
            : [];

    const truncateText = (text: string, maxLength: number = 150) => {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    };

    // handleToggleFavorite function
    const handleToggleFavorite = async (blogId: string) => {
        if (!session?.user?.id) return;

        try {
            const isCurrentlyFavorited = isFavorited(blogId);

            // Optimistic update - cập nhật UI ngay lập tức
            // Thêm/xóa blogId vào/khỏi mảng favoriteIds tạm thời
            setLocalFavorites((prev) => ({
                ...prev,
                [blogId]: !isCurrentlyFavorited
            }));

            if (isCurrentlyFavorited) {
                // Remove from favorites
                await removeFavorite({
                    variables: {
                        blogId: blogId,
                        userId: session.user.id
                    }
                });
            } else {
                // Add to favorites
                await addFavorite({
                    variables: {
                        blogId: blogId,
                        userId: session.user.id
                    }
                });
            }
            // Refresh dữ liệu favorite từ server
            await refetch();
        } catch (error) {
            console.error('Error toggling favorite:', error);
            // Hoàn tác thay đổi UI nếu có lỗi
            setLocalFavorites((prev) => ({
                ...prev,
                [blogId]: !prev[blogId]
            }));
        }
    };

    // Cập nhật postItems để thêm trạng thái isFavorite và xử lý sự kiện
    const postItems: PostItemProps[] = [
        ...(blogs && blogs.length > 0
            ? blogs.map((blog: any) => {
                  const blogId = blog.blogId || '';
                  const isFavorite =
                      isFavorited(blogId) || !!localFavorites[blogId];

                  return {
                      title: blog.title || 'Untitled Post',
                      description: truncateText(
                          blog.description || 'No description available',
                          150
                      ),
                      date: blog.postingDay || new Date().toISOString(),
                      likes: blog.likes || 0,
                      views: blog.views || 0,
                      author: {
                          name: userInfo?.fullName || 'Unknown User',
                          avatar: userInfo?.images || '/images/user/person.svg'
                      },
                      image: blog.images || '/images/test.png',
                      ghostSlug: blog.slug,
                      isGhostPost: !!blog.slug,
                      isFavorite: isFavorite,
                      blogId: blogId,
                      showFavorite: true
                  };
              })
            : [])
    ];

    // Tính toán totalPages và displayedItems dựa trên activeTab
    const totalItems =
        activeTab === 'store' ? storeItems.length : postItems.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const displayedItems = (
        activeTab === 'store' ? storeItems : postItems
    ).slice((page - 1) * itemsPerPage, page * itemsPerPage);
    return (
        <div className="px-4 pt-[50px] pb-[100px] flex items-center justify-center md:w-[100%] lg:max-w-[1800px]">
            <div className="flex gap-[50px] md:flex-row flex-col w-full md:w-[100%] lg:max-w-[80%]">
                {/* Left side - Profile */}
                <SellerProfileDetailStore
                    username={userInfo?.username || ''}
                    lastOnline={userInfo.lastLogin}
                    registrationDate={
                        userInfo.sellerSince
                            ? userInfo.sellerSince
                            : 'Not seller'
                    }
                    level={1}
                    avatar={userInfo?.images}
                    stores={stores?.length || 0}
                    posts={blogs?.length || 0}
                    purchased={totalStock || 0}
                    sold={totalSold || 0}
                    storePointsData={{
                        points:
                            storePointsData?.storePointsAggregate?.aggregate
                                ?.sum?.previousAccumulatedPoints || 0,
                        nextLevelPoints:
                            storePointsData?.storePointsAggregate?.aggregate
                                ?.sum?.accumulatedPoints || 100 // Giá trị mặc định hoặc từ API
                    }}
                />

                {/* Right side - Content */}
                <div className="flex-1 w-[87vw] md:w-[600px]">
                    {/* Title */}
                    <div className="bg-[linear-gradient(294deg,rgba(255,255,255,0.00)_6.8%,rgba(110,236,151,0.90)_86.22%)] rounded-lg p-6 mb-8 ">
                        <h1 className="md:text-3xl font-medium text-[#1C1C1C] text-[20px]">
                            Accounts of {userInfo.username || 'Unknown'}
                        </h1>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-6 mb-8 border-b border-gray-200">
                        <button
                            className={`pb-4 md:text-2xl text-[16px] font-semibold relative cursor-pointer ${
                                activeTab === 'store'
                                    ? 'text-[#33A959]'
                                    : 'text-gray-500 hover:text-[#33A959]/70'
                            }`}
                            onClick={() => {
                                setActiveTab('store');
                                setPage(1);
                            }}
                        >
                            Store
                            {activeTab === 'store' && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#33A959]" />
                            )}
                        </button>
                        <button
                            className={`pb-4 md:text-2xl text-[16px] font-semibold relative cursor-pointer ${
                                activeTab === 'post'
                                    ? 'text-[#33A959]'
                                    : 'text-gray-500 hover:text-[#33A959]/70'
                            }`}
                            onClick={() => {
                                setActiveTab('post');
                                setPage(1);
                            }}
                        >
                            Post
                            {activeTab === 'post' && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#33A959]" />
                            )}
                        </button>
                    </div>

                    {/* Content Grid */}
                    <div className="flex flex-col gap-4 w-full">
                        {displayedItems.length > 0 ? (
                            displayedItems.map((item, index) =>
                                activeTab === 'store' ? (
                                    <div
                                        key={index}
                                        className="product-content-card rounded-[20px]"
                                    >
                                        <StoreItem
                                            {...(item as StoreItemProps)}
                                        />
                                    </div>
                                ) : (
                                    <div
                                        key={index}
                                        className="product-content-card rounded-[20px]"
                                    >
                                        {(item as PostItemProps).isGhostPost ? (
                                            <div className="relative">
                                                <Link
                                                    href={`/shares/${(item as PostItemProps).ghostSlug}`}
                                                    className="block"
                                                >
                                                    <PostItem
                                                        {...(item as PostItemProps)}
                                                        showFavorite={false}
                                                    />
                                                </Link>
                                                {/* Nút favorite nằm bên ngoài Link */}
                                                <button
                                                    className="absolute top-2 right-2 bg-white/10 p-2 rounded-full z-20"
                                                    onClick={async (e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        await handleToggleFavorite(
                                                            (
                                                                item as PostItemProps
                                                            ).blogId
                                                        );
                                                    }}
                                                >
                                                    <img
                                                        src={
                                                            (
                                                                item as PostItemProps
                                                            ).isFavorite
                                                                ? '/images/heart-checked.svg'
                                                                : '/images/heart.svg'
                                                        }
                                                        alt="Favorite"
                                                        width={30}
                                                        height={30}
                                                    />
                                                </button>
                                            </div>
                                        ) : (
                                            <PostItem
                                                {...(item as PostItemProps)}
                                                showFavorite={true}
                                                onFavoriteClick={async () => {
                                                    await handleToggleFavorite(
                                                        (item as PostItemProps)
                                                            .blogId
                                                    );
                                                }}
                                            />
                                        )}
                                    </div>
                                )
                            )
                        ) : (
                            <div className="text-center text-gray-500 text-base md:text-xl">
                                {activeTab === 'store'
                                    ? 'No stores found'
                                    : 'No posts found'}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8">
                            <button
                                className="flex items-center justify-center w-[130px] gap-2 px-6 py-3 bg-main-gradio text-white rounded-full disabled:opacity-50"
                                onClick={() =>
                                    setPage((p) => Math.max(1, p - 1))
                                }
                                disabled={page === 1}
                            >
                                Previous
                            </button>
                            <span className="text-[#1C1C1C] font-medium">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                className="flex items-center justify-center w-[130px] gap-2 px-6 py-3 bg-main-gradio text-white rounded-full disabled:opacity-50"
                                onClick={() =>
                                    setPage((p) => Math.min(totalPages, p + 1))
                                }
                                disabled={page === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
