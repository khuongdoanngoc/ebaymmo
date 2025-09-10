export default function OrderSkeleton() {
    return (
        <div className="w-full">
            {/* Header skeleton */}
            <div className="flex justify-between items-center mb-8">
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Search and filter skeleton */}
            <div className="flex w-full mb-8">
                <div className="flex-1 h-12 bg-gray-200 rounded-[86px] animate-pulse" />
                <div className="w-[185px] h-12 ml-[30px] bg-gray-200 rounded-[15px] animate-pulse" />
            </div>

            {/* Table skeleton */}
            <div className="flex justify-center">
                <div className="w-[940px] max-w-full">
                    <div className="bg-[#F7F7F7] rounded-t-lg">
                        <div className="flex">
                            {[...Array(10)].map((_, index) => (
                                <div
                                    key={index}
                                    className="w-[190px] py-[16px] px-[16px]"
                                >
                                    <div className="h-6 bg-gray-200 rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Table rows skeleton */}
                    {[...Array(5)].map((_, rowIndex) => (
                        <div
                            key={rowIndex}
                            className="border-t border-gray-200 flex"
                        >
                            {[...Array(3)].map((_, colIndex) => (
                                <div
                                    key={colIndex}
                                    className="w-[190px] py-[16px] px-[16px]"
                                >
                                    <div className="h-6 bg-gray-200 rounded animate-pulse" />
                                    {colIndex === 0 && (
                                        <div className="mt-2 space-y-2">
                                            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                                            <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Pagination skeleton */}
            <div className="flex justify-center mt-8">
                <div className="flex gap-2">
                    {[...Array(5)].map((_, index) => (
                        <div
                            key={index}
                            className="w-10 h-10 bg-gray-200 rounded animate-pulse"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
