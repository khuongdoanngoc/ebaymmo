interface SaleRegistrationItemProps {
    iconSrc: string; // Đường dẫn icon
    title: string; // Tiêu đề
    description: string; // Nội dung mô tả
}

export default function SaleRegistrationItem({
    iconSrc,
    title,
    description
}: SaleRegistrationItemProps) {
    return (
        <div className="item flex flex-col gap-[10px] items-start">
            <div className="flex gap-[10px] items-center">
                <img src={iconSrc} alt="icon" width="30" height="30" />
                <span className="text-[#1C1C1C] text-[16px] font-[500] text-base leading-[160%]">
                    {title}
                </span>
            </div>
            <div className="flex items-start gap-[10px] font-normal">
                {description}
            </div>
        </div>
    );
}
