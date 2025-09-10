export default function StoreItemSkeleton() {
    return (
        <div className="flex gap-6 mb-8 animate-pulse">
            {/* Image Skeleton */}
            <div className="relative w-[300px] h-[300px] bg-gray-200 rounded-lg" />

            {/* Content Skeleton */}
            <div className="flex-1">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-20 h-8 bg-gray-200 rounded" />
                    <div className="w-16 h-6 bg-gray-200 rounded" />
                </div>

                {/* Title */}
                <div className="w-3/4 h-6 bg-gray-200 rounded mb-4" />
                <div className="w-1/2 h-6 bg-gray-200 rounded mb-4" />

                {/* Info List */}
                <div className="space-y-3 mb-4">
                    <div className="flex items-center">
                        <div className="w-[120px] h-5 bg-gray-200 rounded" />
                        <div className="w-12 h-5 ml-4 bg-gray-200 rounded" />
                    </div>
                    <div className="flex items-center">
                        <div className="w-[120px] h-5 bg-gray-200 rounded" />
                        <div className="w-12 h-5 ml-4 bg-gray-200 rounded" />
                    </div>
                    <div className="flex items-center">
                        <div className="w-[120px] h-5 bg-gray-200 rounded" />
                        <div className="w-20 h-5 ml-4 bg-gray-200 rounded" />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full" />
                        <div className="w-24 h-5 bg-gray-200 rounded" />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-6 bg-gray-200 rounded" />
                        <div className="w-24 h-10 bg-gray-200 rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    );
}
