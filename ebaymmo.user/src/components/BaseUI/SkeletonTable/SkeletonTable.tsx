export const TableSkeleton = () => {
    return (
        <div className="flex flex-col border py-4 md:py-[40px] px-4 md:px-[46px] rounded-[15px] border-border_color bg-white gap-[20px] md:gap-[35px] animate-pulse">
            {/* Title Skeleton */}
            <div className="h-8 w-36 bg-gray-200 rounded" />

            {/* Tab Skeleton */}
            <div className="flex border-b border-border_color">
                <div className="h-10 w-24 bg-gray-200 rounded mr-4" />
                <div className="h-10 w-24 bg-gray-200 rounded opacity-50" />
            </div>

            {/* Table Skeleton */}
            <div className="overflow-auto max-h-[400px] md:max-h-[600px]">
                <div className="w-full max-w-[940px] overflow-x-auto scrollbar scrollbar-thin scrollbar-thumb-green">
                    <div className="min-w-[940px]">
                        <table className="w-full table-auto border-collapse bg-white">
                            <thead className="bg-[#F7F7F7]">
                                <tr>
                                    <th className="w-[250px] p-4">
                                        <div className="h-6 bg-gray-200 rounded" />
                                    </th>
                                    <th className="w-[300px] p-4">
                                        <div className="h-6 bg-gray-200 rounded" />
                                    </th>
                                    <th className="w-[150px] p-4">
                                        <div className="h-6 bg-gray-200 rounded" />
                                    </th>
                                    <th className="w-[150px] p-4">
                                        <div className="h-6 bg-gray-200 rounded" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1, 2, 3, 4].map((row) => (
                                    <tr
                                        key={row}
                                        className="border-t border-gray-200"
                                    >
                                        <td className="w-[250px] p-4">
                                            <div className="h-5 bg-gray-200 rounded" />
                                        </td>
                                        <td className="w-[300px] p-4">
                                            <div className="h-5 bg-gray-200 rounded" />
                                        </td>
                                        <td className="w-[150px] p-4">
                                            <div className="h-5 bg-gray-200 rounded" />
                                        </td>
                                        <td className="w-[150px] p-4">
                                            <div className="h-5 bg-gray-200 rounded" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Pagination Skeleton */}
            <div className="flex justify-center gap-2">
                {[1, 2, 3].map((item) => (
                    <div key={item} className="h-8 w-8 bg-gray-200 rounded" />
                ))}
            </div>
        </div>
    );
};
