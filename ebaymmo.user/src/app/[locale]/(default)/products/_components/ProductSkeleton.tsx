export default function ProductSkeleton() {
    return (
        <div className="card flex flex-col bg-gray-100 rounded-[20px] animate-pulse">
            <div className="px-[20px] pt-[20px]">
                <div className="relative aspect-[299/217] bg-gray-300 rounded-[10px] w-full h-full" />
            </div>
            <div className="px-[20px] pt-[25px] pb-[20px]">
                <div className="des flex flex-col gap-[10px]">
                    <div className="rate flex items-center">
                        <div className="bg-gray-300 rounded-full w-[15px] h-[15px]" />
                        <span className="text-[14px] font-medium leading-[24px] text-gray-400" />
                    </div>
                    <div className="min-h-[87px]">
                        <span className="title text-[18px] font-medium leading-[28.8px] text-gray-400 line-clamp-2 block min-h-[57.6px]" />
                        <span className="sub-title text-[14px] font-medium leading-[22.4px] text-gray-400 line-clamp-2 block min-h-[44.8px]" />
                        <span className="sub-title text-[14px] font-medium leading-[22.4px] text-gray-400 line-clamp-2 block min-h-[44.8px]" />
                        <span className="sub-title text-[14px] font-medium leading-[22.4px] text-gray-400 line-clamp-2 block min-h-[44.8px]" />
                    </div>
                </div>
            </div>
        </div>
    );
}
