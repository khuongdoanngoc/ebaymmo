/**
 * A custom hook for handling pagination with URL synchronization
 *
 * @example
 * // Basic usage
 * const { page, limit, setPage, setLimit, offset } = usePagination();
 *
 * // With custom initial values
 * const { page, limit, setPage, setLimit, offset } = usePagination('/products', 20, 1);
 *
 * @param {string} forUrl - Base URL path for pagination (default: '/')
 * @param {number} defaultLimit - Default number of items per page (default: 10)
 * @param {number} defaultPage - Default page number (default: 1)
 *
 * @returns {Object} Pagination controls and state
 * @returns {number} .page - Current page number
 * @returns {number} .limit - Current items per page
 * @returns {function} .setPage - Function to update page number
 * @returns {function} .setLimit - Function to update items per page
 * @returns {number} .offset - Calculated offset for database queries
 *
 *  // Put component Pagination into where you want
 *  <Pagination
 *      total={countOfAllItems}
 *      limit={limit}
 *      page={page}
 *      setPage={setPage}
 *  />
 *
 *  // To use this hook you must add limit and offset into graphql query
 *
 */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const usePagination = (forUrl = '/', defaultLimit = 10, defaultPage = 1) => {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Đọc các tham số từ URL
    const [limit, setLimitState] = useState(() => {
        const limitParam = searchParams.get('limit');
        return limitParam ? parseInt(limitParam) : defaultLimit;
    });

    const [page, setPageState] = useState(() => {
        const pageParam = searchParams.get('page');
        return pageParam ? parseInt(pageParam) : defaultPage;
    });

    // Hàm để cập nhật URL với tham số mới
    const updateURL = useCallback(
        (newPage: number, newLimit: number) => {
            // Tạo đối tượng URLSearchParams mới từ chuỗi query hiện tại
            const params = new URLSearchParams(searchParams.toString());

            // Cập nhật giá trị mới
            params.set('page', newPage.toString());
            params.set('limit', newLimit.toString());

            // Cập nhật URL mà không reload trang
            router.push(`${forUrl}?${params.toString()}`, { scroll: false });
        },
        [router, searchParams, forUrl]
    );

    // Wrapper để cập nhật cả state và URL
    const setPage = useCallback(
        (newPage: number | ((prevPage: number) => number)) => {
            if (typeof newPage === 'function') {
                setPageState((prev) => {
                    const calculated = newPage(prev);
                    updateURL(calculated, limit);
                    return calculated;
                });
            } else {
                setPageState(newPage);
                updateURL(newPage, limit);
            }
        },
        [limit, updateURL]
    );

    const setLimit = useCallback(
        (newLimit: number | ((prevLimit: number) => number)) => {
            if (typeof newLimit === 'function') {
                setLimitState((prev) => {
                    const calculated = newLimit(prev);
                    updateURL(page, calculated);
                    return calculated;
                });
            } else {
                setLimitState(newLimit);
                updateURL(page, newLimit);
            }
        },
        [page, updateURL]
    );

    // Đảm bảo URL được cập nhật lần đầu tiên khi hook được gọi
    useEffect(() => {
        // Kiểm tra xem URL hiện tại có đúng với state không
        const currentPage = searchParams.get('page');
        const currentLimit = searchParams.get('limit');

        // Chỉ cập nhật URL nếu đã có ít nhất một trong hai tham số page hoặc limit
        if (currentPage || currentLimit) {
            if (
                currentPage !== page.toString() ||
                currentLimit !== limit.toString()
            ) {
                updateURL(page, limit);
            }
        }
    }, [page, limit, searchParams, updateURL]);

    return {
        limit,
        page,
        setLimit,
        setPage,
        offset: (page - 1) * limit
    };
};

export default usePagination;
