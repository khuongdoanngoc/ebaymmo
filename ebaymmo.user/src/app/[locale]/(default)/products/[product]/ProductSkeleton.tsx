export default function ProductSkeleton() {
    return (
        <section className="relative">
            <div className="mt-[70px]">
                <div className="w-full max-w-[1420px] m-auto px-4 md:px-6 lg:px-8">
                    {/* Breadcrumb skeleton */}
                    <div className="h-6 w-64 bg-gray-200 rounded animate-pulse" />

                    <div className="mt-[54px] flex flex-col lg:flex-row gap-[30px] justify-between relative">
                        {/* Image skeleton */}
                        <div className="w-full lg:max-w-[600px] relative">
                            <div className="sticky top-0">
                                <div className="rounded-[30px] aspect-[60/43] w-full bg-gray-200 animate-pulse" />
                            </div>
                        </div>

                        {/* Info skeleton */}
                        <div className="w-full lg:max-w-[700px] flex flex-col gap-[35px]">
                            {/* Title skeleton */}
                            <div className="space-y-4">
                                <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse" />
                                <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse" />
                                <div className="h-6 w-1/4 bg-gray-200 rounded animate-pulse" />
                            </div>

                            <hr className="w-full min-h-[1px] h-[1px] bg-neutral-100 border-none" />

                            {/* Products skeleton */}
                            <div className="space-y-4">
                                {[1, 2, 3].map((item) => (
                                    <div
                                        key={item}
                                        className="h-20 bg-gray-200 rounded animate-pulse"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Seller Profile skeleton */}
                    <div className="mt-[100px]">
                        <div className="space-y-6">
                            {/* Tabs skeleton */}
                            <div className="flex gap-4 border-b border-neutral-100">
                                {[1, 2, 3].map((item) => (
                                    <div
                                        key={item}
                                        className="h-10 w-24 bg-gray-200 rounded animate-pulse"
                                    />
                                ))}
                            </div>

                            {/* Seller info skeleton */}
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-gray-200 animate-pulse" />
                                <div className="space-y-2">
                                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                                </div>
                            </div>

                            {/* Description skeleton */}
                            <div className="space-y-2">
                                {[1, 2, 3].map((item) => (
                                    <div
                                        key={item}
                                        className="h-4 w-full bg-gray-200 rounded animate-pulse"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
