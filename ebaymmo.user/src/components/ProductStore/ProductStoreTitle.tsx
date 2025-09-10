import Image from 'next/image';
interface IProductStoreTitleProps {
    title: string;
    subTitle?: string | null;
    rating: number;
    totalRate: number;
}
function ProductStoreTitle(props: IProductStoreTitleProps) {
    return (
        <div>
            <div>
                <h1 className="text-[30px] text-neutral-400 font-[700]">
                    {props.title}
                </h1>
                <p className="mt-[10px] text-[20px] text-neutral-400 font-[400] ">
                    {props.subTitle}
                </p>
            </div>
            <div className="mt-[20px] flex flex-wrap gap-[6px] items-center">
                <div className="flex flex-wrap gap-[6px] items-center">
                    <div>
                        <Image
                            src="/images/star.svg"
                            alt="star"
                            className=""
                            width={24}
                            height={24}
                        />
                    </div>
                    <span className="text-[18px] font-[500] text-starYellow">
                        {props.rating.toFixed(1) || 0}
                    </span>
                </div>
                <span className="text-neutral-300 text-[18px] font-[400]">
                    ({props.totalRate})
                </span>
            </div>
        </div>
    );
}

export default ProductStoreTitle;
