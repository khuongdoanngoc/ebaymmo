'use client';

/**
 * useFilter - Custom hook để quản lý và cập nhật các bộ lọc trong URL.
 *
 * @param initialFilters - Đối tượng chứa các bộ lọc khởi tạo với các thuộc tính:
 *   - handler: Chuỗi xác định hành động xử lý bộ lọc.
 *   - sortBy: Chuỗi xác định thuộc tính để sắp xếp.
 *   - sortOrder: Chuỗi xác định thứ tự sắp xếp (tăng dần hoặc giảm dần).
 *   - Các thuộc tính động khác với kiểu string.
 *
 * @returns {Object} - Trả về một đối tượng chứa:
 *   - filters: Trạng thái hiện tại của các bộ lọc.
 *   - setFilters: Hàm để cập nhật trạng thái bộ lọc.
 *   - updateFilter: Hàm để cập nhật một bộ lọc cụ thể với tên và giá trị mới.
 *
 * Cách sử dụng:
 * const { filters, setFilters, updateFilter } = useFilter(initialFilters);
 *
 * - filters: Sử dụng để lấy giá trị hiện tại của các bộ lọc.
 * - setFilters: Sử dụng để cập nhật tất cả các bộ lọc.
 * - updateFilter: Sử dụng để cập nhật một bộ lọc cụ thể, ví dụ:
 *   updateFilter('sortBy', 'name'); // Cập nhật bộ lọc sortBy với giá trị 'name'.
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export interface IFilter {
    [key: string]: any | undefined; // Các thuộc tính động với kiểu string hoặc không xác định
    handler?: string; // Thuộc tính handler
    sortBy?: string; // Thuộc tính sortBy
    sortOrder?: string; // Thuộc tính sortOrder
}

export const useFilter = (initialFilters: IFilter) => {
    const router = useRouter();
    const searchParams = useSearchParams(); // Lấy các tham số truy vấn từ URL

    // Khởi tạo state filters với giá trị ban đầu
    const [filters, setFilters] = useState(() => {
        const initialFilterState: IFilter = {} as IFilter; // Khởi tạo trạng thái bộ lọc
        for (const key in initialFilters) {
            initialFilterState[key as keyof IFilter] =
                searchParams.get(key) || initialFilters[key as keyof IFilter]; // Lấy giá trị từ query
        }
        return initialFilterState; // Trả về trạng thái bộ lọc khởi tạo
    });

    // Hàm cập nhật bộ lọc
    const updateFilter = (name: string, value: any) => {
        setFilters((prevFilters) => ({
            ...prevFilters, // Giữ nguyên các bộ lọc trước đó
            [name]: value // Cập nhật bộ lọc với tên và giá trị mới
        }));
    };

    // Sử dụng useEffect để theo dõi sự thay đổi của filters
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString()); // Tạo đối tượng URLSearchParams từ URL hiện tại

        for (const key in filters) {
            if (
                filters[key as keyof IFilter] &&
                !(
                    Array.isArray(filters[key as keyof IFilter]) &&
                    filters[key as keyof IFilter].length === 0
                )
            ) {
                params.set(key, filters[key as keyof IFilter]!); // Thêm tham số vào URL nếu có giá trị
            } else {
                params.delete(key); // Xóa tham số khỏi URL nếu không có giá trị
            }
        }
        router.push('?' + params.toString(), { scroll: false }); // Cập nhật URL mà không làm mới trang
    }, [filters]); // Chạy effect khi filters thay đổi

    return { filters, setFilters, updateFilter }; // Trả về các giá trị cần thiết từ hook
};
