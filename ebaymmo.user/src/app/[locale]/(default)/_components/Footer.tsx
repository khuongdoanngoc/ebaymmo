'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function Footer() {
    const t = useTranslations('footer');
    return (
        <div className="relative">
            <div className="flex flex-col md:flex-row md:justify-between xl:justify-around my-10 md:mb-[80px] md:mt-[80px] px-6 lg:px-36 max-w-[1800px] mx-auto">
                <div>
                    <Image
                        src="/images/logo.svg"
                        alt="Logo"
                        width={240}
                        height={100}
                        className="mb-[30px]"
                    />
                    <h1 className="text-lg md:text-3xl font-bold ">
                        EBAYMMO CO.LTD
                    </h1>
                    <div className=" flex gap-[25px] mt-[15px]">
                        <a
                            href="https://www.facebook.com/taphoammo"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Image
                                src="/images/facebook.svg"
                                alt="facebookIcon"
                                width={40}
                                height={40}
                            />
                        </a>
                        <a
                            href="https://www.youtube.com/channel/UCvd9HeIqxmO3omtS7PJSapQ"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Image
                                src="/images/youtube.svg"
                                alt="youtubeIcon"
                                width={40}
                                height={40}
                            />
                        </a>
                        <Image
                            src="/images/tiktok.svg"
                            alt="tiktokIcon"
                            width={40}
                            height={40}
                            className="pr-2 pl-2"
                        />
                        <Image
                            src="/images/twitter.svg"
                            alt="twitterIcon"
                            width={48}
                            height={40}
                            className="pr-2 pl-2"
                        />
                    </div>
                </div>
                <div className="flex flex-col lg:flex-row mt-5 lg:mt-0 gap-5 lg:gap-0 justify-around w-full md:w-1/2">
                    <div>
                        <h1 className="font-bold text-xl mb-4">
                            {t('contactInformation')}
                        </h1>
                        <div className="max-w-xs text-lg">
                            <h4 className="pt-3 pb-3 font-semibold">
                                {t('address')}
                            </h4>
                            <p>
                                Nham Son - Yen Lu Industrial Park, Nham Bien
                                Town, Yen Dung District, Bac Giang, Vietnam
                            </p>
                            <h4 className="pt-3 pb-3 font-semibold">
                                {t('hotline')}
                            </h4>
                            <p>0396 112 998</p>
                            <h4 className="pt-3 pb-3 font-semibold">
                                {t('taxCode')}
                            </h4>
                            <p>2400938556</p>
                        </div>
                    </div>
                    <div className="max-w-xs text-lg">
                        <h1 className="font-bold text-xl mb-4">
                            {t('support')}
                        </h1>
                        <div>
                            <Link href="/privacy-policy">
                                <p className="pt-2 pb-2">{t('policy')}</p>
                            </Link>
                            <Link href="/terms">
                                <p className="pt-2 pb-2">{t('terms of use')}</p>
                            </Link>
                            <Link href="/faqs">
                                <p className="pt-2 pb-2">{t('FAQs')}</p>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            <div className="absolute bottom-[10%] right-[10%] ">
                <Image
                    src="/images/illus-footer.svg"
                    alt="EbayMMO"
                    width={1440}
                    height={240}
                    className="opacity-[0.1]"
                />
            </div>
            <div className=" flex items-center justify-center bg-main-gradio text-white h-[50px] font-bold">
                © EbayMMO all right reserved
            </div>
        </div>
    );
}
