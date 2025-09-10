'use client';
import FeatureItem from '../../Feature/FeatureItem';
import { useTranslations } from 'next-intl';

type Feature = {
    featureImage: string;
    featureTitle: string;
    featureDesc: string;
};

export default function FeatureSection() {
    const t = useTranslations('FeatureSection');

    const features: Feature[] = [
        {
            featureImage: '/images/duplicate.svg',
            featureTitle: t('feature1.title'),
            featureDesc: t('feature1.description')
        },
        {
            featureImage: '/images/deposite.svg',
            featureTitle: t('feature2.title'),
            featureDesc: t('feature2.description')
        },
        {
            featureImage: '/images/shakemoney.svg',
            featureTitle: t('feature3.title'),
            featureDesc: t('feature3.description')
        },
        {
            featureImage: '/images/featurecollaboratio.svg',
            featureTitle: t('feature4.title'),
            featureDesc: t('feature4.description')
        }
    ];

    return (
        <section className="px-6 lg:px-0 w-full md:w-auto section-homepage-3">
            <div className="container mx-auto w-full md:w-auto max-w-[1420px] mt-[97.27px]">
                <h2 className="text-title-large uppercase w-full text-[30px] md:text-[35px] lg:text-[40px] font-bold leading-[56px] text-[#3F3F3F] font-beausans lg:w-[580px]">
                    {t('title')}
                </h2>
                <div className="flex flex-col lg:flex-row gap-20 lg:gap-[139px] mt-8 lg:mt-[76px] mb-[60px]">
                    <div className="w-full item-left flex flex-col gap-[30px] lg:w-[580px]">
                        {features.map((feature, index) => (
                            <FeatureItem key={index} {...feature} />
                        ))}
                    </div>
                    <div className="item-right flex flex-col gap-[29px]">
                        <div className="slogan flex flex-col w-full md:w-[720px] py-5 px-7 md:p-[45px_70px] items-start gap-6 md:gap-[35px] rounded-[25px] bg-slogan-homepage">
                            <h2 className="slogan-title text-[24px] md:text-[30px] font-extrabold leading-[140%] text-[#1C1C1C] font-beausans">
                                {t('slogan.title')}
                            </h2>

                            <p className="slogan-description">
                                {t('slogan.description')}
                            </p>
                        </div>
                        <img src="/images/rectangle13.png" alt="" />
                    </div>
                </div>
                <div className="form-container" />
            </div>
        </section>
    );
}
