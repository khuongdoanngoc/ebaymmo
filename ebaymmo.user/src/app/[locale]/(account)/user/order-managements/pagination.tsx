import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange
}: PaginationProps) {
    const renderPageNumbers = () => {
        if (totalPages <= 3) {
            // Nếu tổng số trang <= 3, hiển thị tất cả
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        if (currentPage === 1) {
            return [1, 2, 3];
        }
        if (currentPage === totalPages) {
            return [totalPages - 2, totalPages - 1, totalPages];
        }
        return [currentPage - 1, currentPage, currentPage + 1];
    };

    const { data: session } = useSession();
    const router = useRouter();
    if (!session) {
        router.push('/login');
    }

    return (
        <div className="flex justify-center mt-4 gap-2">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${
                    currentPage === 1
                        ? 'bg-gray-200 cursor-not-allowed'
                        : 'bg-green_main text-white hover:bg-green-600'
                }`}
            >
                Previous
            </button>

            {renderPageNumbers().map((pageNum) => (
                <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`px-3 py-1 rounded ${
                        currentPage === pageNum
                            ? 'bg-green_main text-white'
                            : 'bg-white border border-green_main text-green_main hover:bg-green-50'
                    }`}
                >
                    {pageNum}
                </button>
            ))}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded ${
                    currentPage === totalPages
                        ? 'bg-gray-200 cursor-not-allowed'
                        : 'bg-green_main text-white hover:bg-green-600'
                }`}
            >
                Next
            </button>
        </div>
    );
}
