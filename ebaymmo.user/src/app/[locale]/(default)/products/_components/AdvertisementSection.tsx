import Button from '@/components/BaseUI/Button/button';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
export const AdvertisementSection = () => {
    const router = useRouter();
    const t = useTranslations('banner');

    return (
        <div className="hidden lg:block relative w-full my-[40px] rounded-[20px] overflow-hidden h-[394.235px] flex-shrink-0">
            <div className="relative w-full h-full">
                <Image
                    src="/images/adver.png"
                    alt="background"
                    fill
                    className="object-cover"
                />
            </div>
            <div className="absolute inset-0 flex items-center">
                <div className="text-white ml-[50px]">
                    <h2 className="text-[33px] font-bold leading-[140%] w-[466.53px] text-[#FFF] mb-[45px]">
                        {t('title')}
                    </h2>
                    <Button
                        width="210px"
                        colorScheme="white"
                        className="text-[18px] font-normal leading-[28.8px] px-[25px] py-[10px]"
                        onClick={() => router.push('/sale-registration')}
                    >
                        <span className="text-primary-500">
                            {t('register')}
                        </span>
                    </Button>
                </div>
            </div>
        </div>
    );
};
