'use client';
import Pagination from '../BaseUI/Pagination';
import ContentManagementItem from './ContentManagementItem';
import usePagination from '@/hooks/usePagination';

interface Post {
    id: string;
    slug: string;
    title: string;
    excerpt: string; // Đúng với dữ liệu API
    feature_image: string;
}

interface Meta {
    pagination: {
        total: number;
    };
}

interface DataResponse {
    data: Post[];
    meta: Meta;
}

export default function ContentManagementList({
    data
}: {
    data?: DataResponse;
}) {
    // Always call hooks at the top level of your component
    const { limit, page, setPage } = usePagination(
        '/user/content-management',
        3,
        1
    );

    // Kiểm tra dữ liệu để tránh lỗi
    if (!data || !data.data || !data.meta || !data.meta.pagination) {
        return (
            <div className="flex flex-col items-start gap-[25px] self-stretch">
                {[1, 2, 3].map((index) => (
                    <div
                        key={index}
                        className="flex w-full animate-pulse flex-col gap-4 rounded-lg border border-gray-200 p-4"
                    >
                        <div className="flex gap-4">
                            <div className="h-20 w-20 rounded-lg bg-gray-200" />
                            <div className="flex-1">
                                <div className="mb-2 h-4 w-3/4 rounded bg-gray-200" />
                                <div className="h-3 w-1/2 rounded bg-gray-200" />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <div className="h-8 w-24 rounded bg-gray-200" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col items-start gap-[25px] self-stretch">
                {data.data.map((post) => (
                    <ContentManagementItem
                        key={post.slug}
                        imageSrc={post.feature_image}
                        title={post.title}
                        description={post.excerpt} // Sử dụng excerpt thay vì description
                        link={`https://blog.ebaymmo.shop/ghost/#/editor/post/${post.id}`}
                        linkPost={`https://ebaymmo.shop/en/shares/${post.slug}`}
                        buttonText="Update"
                        total={data.meta.pagination.total}
                    />
                ))}
            </div>

            <div className="mt-8">
                <Pagination
                    page={page}
                    limit={limit}
                    setPage={setPage}
                    total={data.meta.pagination.total}
                />
            </div>
        </>
    );
}
