'use client';

import StatusBadge from '@/components/StatusProps/StatusBadge';
import Image from 'next/image';
import React, { useState } from 'react';

// Định nghĩa kiểu cho các cột
interface TableColumn {
    header: string;
    accessor: string;
    sortable?: boolean;
    cell?: (row: any) => React.ReactNode;
    customCell?: boolean;
    style?: React.CSSProperties;
}
interface TableRow {
    [key: string]: string | number | React.ReactNode; // Dữ liệu trong hàng có thể là chuỗi hoặc số
}
interface TableProps {
    columns: TableColumn[]; // Mảng các cột với tiêu đề và accessor
    data: TableRow[]; // Mảng dữ liệu các hàng
    config?: {
        fixedWidth?: boolean;
        columnWidth?: {
            [key: string]: string;
        };
    };
}

const Table: React.FC<TableProps> = ({ columns, data }) => {
    // State quản lý các hàng mở rộng
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [sortConfig, setSortConfig] = useState<{
        key: string;
        direction: 'asc' | 'desc' | null;
    }>({ key: '', direction: null });

    const handleSort = (accessor: string) => {
        let direction: 'asc' | 'desc' | null = 'asc';

        if (sortConfig.key === accessor) {
            if (sortConfig.direction === 'asc') direction = 'desc';
            else if (sortConfig.direction === 'desc') direction = null;
        }

        setSortConfig({ key: accessor, direction });
    };
    // Hàm xử lý toggle cho từng ô trong bảng
    const handleToggle = (index: number) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(index)) {
            newExpandedRows.delete(index);
        } else {
            newExpandedRows.add(index);
        }
        setExpandedRows(newExpandedRows);
    };
    return (
        <div className="flex justify-center w-full">
            <div className="w-full overflow-x-auto scrollbar scrollbar-thin scrollbar-thumb-green">
                <div>
                    <table className="w-full table-auto border-collapse bg-white shadow-md rounded-lg">
                        <thead className="bg-[#F7F7F7]">
                            <tr>
                                {columns.map((col) => (
                                    <th
                                        key={col.accessor}
                                        className={`
                      text-[16px] md:text-[18px] font-[700] p-2 md:p-4 text-center text-gray-700
                      ${col.sortable ? 'cursor-pointer hover:bg-gray-200' : ''}
                      ${
                          col.accessor === 'orderId'
                              ? 'w-[80px] md:w-[100px]'
                              : ''
                      }
                      ${
                          col.accessor === 'purchaseDate'
                              ? 'w-[120px] md:w-[150px]'
                              : ''
                      }
                      ${
                          col.accessor === 'store'
                              ? 'w-[100px] md:w-[120px]'
                              : ''
                      }
                      ${
                          col.accessor === 'quantity'
                              ? 'w-[80px] md:w-[100px]'
                              : ''
                      }
                      ${
                          col.accessor === 'unitPrice'
                              ? 'w-[100px] md:w-[120px]'
                              : ''
                      }
                      ${
                          col.accessor === 'totalAmount'
                              ? 'w-[120px] md:w-[140px]'
                              : ''
                      }
                      ${
                          col.accessor === 'discount'
                              ? 'w-[100px] md:w-[120px]'
                              : ''
                      }
                      ${
                          col.accessor === 'commission'
                              ? 'w-[110px] md:w-[130px]'
                              : ''
                      }
                      ${
                          col.accessor === 'commissionAccount'
                              ? 'w-[150px] md:w-[180px]'
                              : ''
                      }
                      ${
                          col.accessor === 'statusStyle'
                              ? 'w-[100px] md:w-[120px]'
                              : ''
                      }
                      whitespace-nowrap
                    `}
                                        style={col.style}
                                        onClick={() =>
                                            col.sortable &&
                                            handleSort(col.accessor)
                                        }
                                    >
                                        <div className="flex items-center justify-center gap-1 md:gap-2">
                                            {col.header}
                                            {col.sortable && (
                                                <div className="flex flex-col">
                                                    <Image
                                                        src="/images/chevron-up.svg"
                                                        alt="up"
                                                        width={10}
                                                        height={10}
                                                        className={`md:w-[12px] md:h-[12px] ${
                                                            sortConfig.key ===
                                                                col.accessor &&
                                                            sortConfig.direction ===
                                                                'asc'
                                                                ? 'text-green-500'
                                                                : 'text-gray-400'
                                                        }`}
                                                    />
                                                    <Image
                                                        src="/images/chevron-down.svg"
                                                        alt="down"
                                                        width={10}
                                                        height={10}
                                                        className={`md:w-[12px] md:h-[12px] ${
                                                            sortConfig.key ===
                                                                col.accessor &&
                                                            sortConfig.direction ===
                                                                'desc'
                                                                ? 'text-green-500'
                                                                : 'text-gray-400'
                                                        }`}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, index) => (
                                <tr
                                    key={index}
                                    className="border-t border-gray-200"
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={col.accessor}
                                            className={`
                                            p-2 md:p-4 text-[14px] md:text-[16px] lg:text-[18px] font-[400] text-gray-700 text-center
                                            ${col.accessor === 'orderId' ? 'w-[80px] md:w-[100px]' : ''}
                                            ${col.accessor === 'purchaseDate' ? 'w-[120px] md:w-[150px]' : ''}
                                            ${col.accessor === 'store' ? 'w-[100px] md:w-[120px]' : ''}
                                            ${col.accessor === 'quantity' ? 'w-[80px] md:w-[100px]' : ''}
                                            ${col.accessor === 'unitPrice' ? 'w-[100px] md:w-[120px]' : ''}
                                            ${col.accessor === 'totalAmount' ? 'w-[120px] md:w-[140px]' : ''}
                                            ${col.accessor === 'discount' ? 'w-[100px] md:w-[120px]' : ''}
                                            ${col.accessor === 'commission' ? 'w-[110px] md:w-[130px]' : ''}
                                            ${col.accessor === 'commissionAccount' ? 'w-[150px] md:w-[180px]' : ''}
                                            ${col.accessor === 'statusStyle' ? 'w-[100px] md:w-[120px]' : ''}
                                        `}
                                            style={col.style}
                                        >
                                            {col.customCell ? (
                                                col.cell && col.cell(row)
                                            ) : col.accessor ===
                                              'statusStyle' ? (
                                                <StatusBadge
                                                    status={
                                                        row[
                                                            col.accessor
                                                        ] as string
                                                    }
                                                />
                                            ) : col.cell ? (
                                                <div className="relative">
                                                    <div
                                                        className={`line-clamp-2 ${
                                                            expandedRows.has(
                                                                index
                                                            )
                                                                ? 'line-clamp-none'
                                                                : ''
                                                        }`}
                                                        style={{
                                                            maxHeight:
                                                                expandedRows.has(
                                                                    index
                                                                )
                                                                    ? 'none'
                                                                    : '50px'
                                                        }}
                                                    >
                                                        {col.cell(row)}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <div
                                                        className={`line-clamp-2 ${
                                                            expandedRows.has(
                                                                index
                                                            )
                                                                ? 'line-clamp-none'
                                                                : ''
                                                        }`}
                                                        style={{
                                                            maxHeight:
                                                                expandedRows.has(
                                                                    index
                                                                )
                                                                    ? 'none'
                                                                    : '50px'
                                                        }}
                                                    >
                                                        <div className="flex justify-center items-center">
                                                            {row[col.accessor]}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
export default Table;
