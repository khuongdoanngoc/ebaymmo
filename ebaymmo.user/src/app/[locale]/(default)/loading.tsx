export default function SharesLoading() {
    return (
        <div className="container mx-auto px-3 py-8 max-w-[1564px]">
            <div className="flex flex-col gap-8">
                {/* Breadcrumb skeleton */}
                <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />

                {/* Search bar skeleton */}
                <div className="w-full h-12 bg-gray-200 rounded animate-pulse" />

                {/* Filter tags skeleton */}
                <div className="flex gap-2 overflow-x-auto">
                    {[1, 2, 3, 4, 5].map((item) => (
                        <div
                            key={item}
                            className="h-8 w-20 bg-gray-200 rounded animate-pulse flex-shrink-0"
                        />
                    ))}
                </div>

                {/* Posts grid skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                        <div
                            key={item}
                            className="flex flex-col gap-4 animate-pulse"
                        >
                            <div className="h-[200px] bg-gray-200 rounded-lg" />
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                                <div className="h-4 bg-gray-200 rounded w-1/2" />
                                <div className="flex gap-2">
                                    <div className="h-4 bg-gray-200 rounded w-8" />
                                    <div className="h-4 bg-gray-200 rounded w-8" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
