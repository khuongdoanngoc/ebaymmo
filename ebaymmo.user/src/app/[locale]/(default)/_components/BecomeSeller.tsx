import Button from '@/components/BaseUI/Button/button';
import Image from 'next/image';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
const BecomeSeller = () => {
    const t = useTranslations('BecomeSeller');
    const router = useRouter();

    return (
        <section className="bg-primary-500">
            <div className="container mx-auto w-full md:w-auto max-w-[1420px] mt-[97.27px]">
                <div className="px-6 lg:px-0 py-10 lg:py-0 grid grid-cols-1 md:grid-cols-2 items-center gap-8">
                    {/* Left Column - Content */}
                    <div className="text-white order-1 md:order-1">
                        <h2 className="text-[40px] font-beausans font-bold">
                            {t('title')}
                        </h2>
                        <p className="text-lg font-beausans font-normal mt-[15px]">
                            {t('description')}
                        </p>
                        <div className="mt-[35px]">
                            <Button
                                width="auto"
                                colorScheme="white"
                                className="px-[30px] py-[10px] justify-start whitespace-nowrap"
                                onClick={() =>
                                    router.push('/sale-registration')
                                }
                            >
                                <span className="bg-text-gradient font-beausans bg-clip-text text-transparent">
                                    {t('registerButton')}
                                </span>
                            </Button>
                        </div>
                    </div>

                    {/* Right Column - Image */}
                    <div className="order-2 md:order-2">
                        <Image
                            src="/images/become-seller-banner.svg"
                            alt="become-seller"
                            width={500}
                            height={450}
                            className="w-full h-auto"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BecomeSeller;
