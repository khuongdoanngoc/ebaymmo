type FeatureProps = {
    featureImage: string;
    featureTitle: string;
    featureDesc: string;
};

export default function FeatureItem({
    featureImage,
    featureTitle,
    featureDesc
}: FeatureProps) {
    return (
        <div className="content-card flex flex-col gap-[20px] items-start pb-[20px] border-b-[1px] border-[#9c9c9c]">
            <div className="feature-title w-full md:w-auto flex items-center md:items-start md:flex-col gap-[15px]">
                <img
                    src={featureImage}
                    alt={featureTitle}
                    width="60px"
                    height="60px"
                />
                <h2 className="w-full md:w-auto text-[30px] font-bold leading-[42px] text-[#3F3F3F] font-beausans">
                    {featureTitle}
                </h2>
            </div>
            <div className="feature-description text-[#3f3f3f] text-[18px] leading-[160%] font-normal font-beausans">
                {featureDesc}
            </div>
        </div>
    );
}
