export default function OrderTableSkeleton() {
    // Generate 5 skeleton rows
    const skeletonRows = Array(5)
        .fill(0)
        .map((_, index) => (
            <tr
                key={index}
                className="border-t border-gray-200 flex animate-pulse"
            >
                <td className="p-4 text-gray-700 text-left w-[190px] flex-col flex">
                    <div className="h-5 w-28 bg-gray-200 rounded mb-2" />
                    <div className="h-5 w-28 bg-gray-200 rounded mb-2" />
                    <div className="h-5 w-28 bg-gray-200 rounded mb-2" />
                    <div className="h-5 w-28 bg-gray-200 rounded" />
                </td>
                {/* Order Code */}
                <td className="py-[16px] px-[16px] text-gray-700 text-left w-[190px]">
                    <div className="h-5 w-24 bg-gray-200 rounded" />
                </td>
                {/* Order Date */}
                <td className="py-[16px] px-[16px] text-gray-700 text-left w-[190px]">
                    <div className="h-5 w-24 bg-gray-200 rounded" />
                </td>
                {/* Seller */}
                <td className="py-[16px] px-[16px] text-gray-700 text-left w-[190px]">
                    <div className="h-5 w-28 bg-gray-200 rounded" />
                </td>
                {/* Product Name */}
                <td className="py-[16px] px-[16px] text-gray-700 text-left w-[190px]">
                    <div className="h-5 w-32 bg-gray-200 rounded" />
                </td>
                {/* Quantity */}
                <td className="py-[16px] px-[16px] text-gray-700 text-left w-[190px]">
                    <div className="h-5 w-16 bg-gray-200 rounded" />
                </td>
                {/* Price */}
                <td className="py-[16px] px-[16px] text-gray-700 text-left w-[190px]">
                    <div className="h-5 w-20 bg-gray-200 rounded" />
                </td>
                {/* Reduce */}
                <td className="py-[16px] px-[16px] text-gray-700 text-left w-[190px]">
                    <div className="h-5 w-20 bg-gray-200 rounded" />
                </td>
                {/* Status */}
                <td className="py-[16px] px-[16px] text-gray-700 text-left w-[190px]">
                    <div className="h-5 w-24 bg-gray-200 rounded" />
                </td>
                {/* Total Money */}
                <td className="py-[16px] px-[16px] text-gray-700 text-left w-[190px]">
                    <div className="h-5 w-24 bg-gray-200 rounded" />
                </td>
            </tr>
        ));

    return (
        <div className="flex justify-center">
            <div className="w-[940px] overflow-x-auto scrollbar scrollbar-thin scrollbar-thumb-green">
                <table className="w-full table-auto border-collapse bg-white shadow-md rounded-lg">
                    <thead className="bg-[#F7F7F7]">
                        <tr className="flex">
                            <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 w-[190px]">
                                Action
                            </th>
                            <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 w-[190px]">
                                Order Code
                            </th>
                            <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 w-[190px]">
                                Order Date
                            </th>
                            <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 w-[190px]">
                                Seller
                            </th>
                            <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 w-[190px]">
                                Product Name
                            </th>
                            <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 w-[190px]">
                                Quantity
                            </th>
                            <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 w-[190px]">
                                Price
                            </th>
                            <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 w-[190px]">
                                Reduce
                            </th>
                            <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 w-[190px]">
                                Status
                            </th>
                            <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 w-[190px]">
                                Total Money
                            </th>
                        </tr>
                    </thead>
                    <tbody>{skeletonRows}</tbody>
                </table>
            </div>
        </div>
    );
}
