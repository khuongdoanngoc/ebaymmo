'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

function PrivacyPolicy() {
    const t = useTranslations('privacyPolicy');
    return (
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
            {/* Breadcrumb */}
            <nav aria-label="breadcrumb">
                <ol className="flex gap-2 m-[20px_0]">
                    <li>
                        <Link href="/">
                            <Image
                                src="/images/home-icon.svg"
                                alt="homeIcon"
                                width={24}
                                height={24}
                            />
                        </Link>
                    </li>
                    <li>
                        <div className="flex">
                            <Image
                                src="/images/arrow-right.svg"
                                alt="arrow-right"
                                width={24}
                                height={24}
                                className="m-[0_15px]"
                            />
                            <div className="text-[18px] text-black">
                                <span>{t('title')}</span>
                            </div>
                        </div>
                    </li>
                </ol>
            </nav>

            {/* Page Title */}
            <div className="mb-8 md:mb-12">
                <h1 className="text-3xl md:text-4xl font-bold">{t('title')}</h1>
                <p className="text-gray-600 mt-2">{t('lastUpdated')}</p>
            </div>

            {/* Privacy Policy Content */}
            <div className="space-y-8 text-lg">
                <section>
                    <h2 className="text-2xl font-bold mb-4">
                        {t('introduction.title')}
                    </h2>
                    <p>{t('introduction.content')}</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">
                        {t('informationCollection.title')}
                    </h2>
                    <p>{t('informationCollection.content')}</p>
                    <ul className="list-disc pl-6 mt-2 space-y-2">
                        <li>{t('informationCollection.identityData')}</li>
                        <li>{t('informationCollection.contactData')}</li>
                        <li>{t('informationCollection.financialData')}</li>
                        <li>{t('informationCollection.technicalData')}</li>
                        <li>{t('informationCollection.usageData')}</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">
                        {t('informationUsage.title')}
                    </h2>
                    <p>{t('informationUsage.content')}</p>
                    <ul className="list-disc pl-6 mt-2 space-y-2">
                        {t
                            .raw('informationUsage.points')
                            .map((point: string, index: number) => (
                                <li key={index}>{point}</li>
                            ))}
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">
                        {t('dataSecurity.title')}
                    </h2>
                    <p>{t('dataSecurity.content')}</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">
                        {t('dataRetention.title')}
                    </h2>
                    <p>{t('dataRetention.content')}</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">
                        {t('legalRights.title')}
                    </h2>
                    <p>{t('legalRights.content')}</p>
                    <ul className="list-disc pl-6 mt-2 space-y-2">
                        {t
                            .raw('legalRights.points')
                            .map((point: string, index: number) => (
                                <li key={index}>{point}</li>
                            ))}
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">
                        {t('cookies.title')}
                    </h2>
                    <p>{t('cookies.content')}</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">
                        {t('changes.title')}
                    </h2>
                    <p>{t('changes.content')}</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">
                        {t('contact.title')}
                    </h2>
                    <p>{t('contact.content')}</p>
                    <div className="mt-4">
                        <p>{t('contact.address')}</p>
                        <p>{t('contact.hotline')}</p>
                        <p>{t('contact.email')}</p>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default PrivacyPolicy;
