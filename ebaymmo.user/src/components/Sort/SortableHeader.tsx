import Image from 'next/image';

interface SortConfig {
    key: string;
    direction: 'asc' | 'desc' | null;
}

interface SortableHeaderProps {
    column: {
        key: string;
        title: string;
    };
    sortConfig: SortConfig;
    onSort: (key: string) => void;
    sortable?: boolean | string[];
}

export default function SortableHeader({
    column,
    sortConfig,
    onSort,
    sortable = false
}: SortableHeaderProps) {
    const isSortable =
        typeof sortable === 'boolean'
            ? sortable
            : sortable.includes(column.key);

    return (
        <th
            onClick={() => isSortable && onSort(column.key)}
            className={`text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 w-[180px] md:w-[230px] justify-center flex items-center ${isSortable ? 'cursor-pointer' : ''}`}
        >
            {column.title}
            {isSortable && (
                <div className="flex flex-col ml-2">
                    <Image
                        src="/images/chevron-up.svg"
                        alt="up"
                        width={10}
                        height={10}
                        className={`md:w-[12px] md:h-[12px] ${
                            sortConfig.key === column.key &&
                            sortConfig.direction === 'asc'
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
                            sortConfig.key === column.key &&
                            sortConfig.direction === 'desc'
                                ? 'text-green-500'
                                : 'text-gray-400'
                        }`}
                    />
                </div>
            )}
        </th>
    );
}
