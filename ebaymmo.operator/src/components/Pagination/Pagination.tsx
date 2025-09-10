import { useEffect } from 'react';
import prevImage from '../../assets/images/prev.png';

interface IProps {
    page?: number; // trang hiện tại
    limit?: number; // số lượng item trên mỗi trang
    setPage?: React.Dispatch<React.SetStateAction<number>>; // hàm cập nhật trang
    total?: number; //  tổng số item
}

export default function Pagination({
    page = 1, // Trang hiện tại, mặc định là 1
    limit = 10, // Số lượng item trên mỗi trang, mặc định là 10
    setPage = () => {}, // Hàm để cập nhật trang
    total // Tổng số item
}: IProps) {
    // Tính tổng số trang bằng cách chia tổng số item cho số lượng item trên mỗi trang và làm tròn lên
    const totalPages = Math.ceil((total || 0) / limit);
    // console.log('totalPages', totalPages);
    // Hàm tạo mảng các số trang sẽ hiển thị
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];

        // Nếu tổng số trang <= 7, hiển thị tất cả các số trang
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Nếu trang hiện tại ở gần đầu (≤ 3)
            // Hiển thị: 1 2 3 ... n-2 n-1 n
            if (page <= 3) {
                for (let i = 1; i <= 3; i++) pages.push(i);
                pages.push('...');
                for (let i = totalPages - 2; i <= totalPages; i++)
                    pages.push(i);
            }
            // Nếu trang hiện tại ở gần cuối
            // Hiển thị: 1 ... n-2 n-1 n
            else if (page >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 2; i <= totalPages; i++)
                    pages.push(i);
            }
            // Nếu trang hiện tại ở giữa
            // Hiển thị: 1 ... x-1 x x+1 ... n
            else {
                pages.push(1);
                pages.push('...');
                for (let i = page - 1; i <= page + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page]);

    return (
        <div className="flex items-center justify-center gap-[10px] mt-[40px]">
            {/* Nút Previous */}
            <button
                className="w-[40px] h-[40px] flex items-center justify-center border border-gray-300 rounded-[8px] hover:border-gray-800 hover:text-gray-800 transition-colors"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1 || totalPages === 0}
            >
                <img src={prevImage} alt="previous" width={20} height={20} />
            </button>

            {/* Render các số trang */}
            {getPageNumbers().map((pageNum, index) => (
                <button
                    key={index}
                    className={`w-[40px] h-[40px] flex items-center justify-center rounded-[8px] text-[16px] font-medium
                        ${
                            pageNum === page
                                ? 'bg-gray-800 text-white border border-gray-800'
                                : 'border border-gray-300 text-gray-500 hover:border-gray-800 hover:text-gray-800 transition-colors'
                        }`}
                    onClick={() =>
                        pageNum !== '...' && setPage(Number(pageNum))
                    }
                    disabled={pageNum === '...' || totalPages === 0}
                >
                    {pageNum}
                </button>
            ))}

            {/* Nút Next */}
            <button
                className="w-[40px] h-[40px] flex items-center justify-center border border-gray-300 rounded-[8px] hover:border-gray-800 hover:text-gray-800 transition-colors"
                onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={page === totalPages || totalPages === 0}
            >
                <img
                    src={prevImage}
                    alt="next"
                    className="rotate-180"
                    width={20}
                    height={20}
                />
            </button>
        </div>
    );
}
