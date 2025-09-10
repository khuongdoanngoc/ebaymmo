'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

function Terms() {
    const t = useTranslations('terms');
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

            {/* Terms of Service Content */}
            <div className="space-y-8 text-lg">
                <div>
                    <p>
                        {t('faqLink')}{' '}
                        <Link
                            href="/faqs"
                            className="text-blue-600 hover:underline"
                        >
                            {t('faqText')}
                        </Link>
                    </p>
                </div>

                <section>
                    <h2 className="text-2xl font-bold mb-4">
                        {t('prohibitedItems.title')}
                    </h2>
                    <p className="mb-4">{t('prohibitedItems.content')}</p>
                    <ul className="list-disc pl-6 space-y-2">
                        {t
                            .raw('prohibitedItems.items')
                            .map((item: string, index: number) => (
                                <li key={index}>{item}</li>
                            ))}
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">
                        {t('sellingRules.title')}
                    </h2>
                    <ul className="list-disc pl-6 space-y-2">
                        {t
                            .raw('sellingRules.rules')
                            .map((rule: string, index: number) => (
                                <li key={index}>{rule}</li>
                            ))}
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">
                        {t('generalRules.title')}
                    </h2>
                    <ul className="list-disc pl-6 space-y-2">
                        {t
                            .raw('generalRules.rules')
                            .map((rule: string, index: number) => (
                                <li key={index}>{rule}</li>
                            ))}
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">
                        {t('violations.title')}
                    </h2>
                    <p className="mb-4">{t('violations.content')}</p>
                    <ul className="list-disc pl-6 space-y-2">
                        {t
                            .raw('violations.penalties')
                            .map((penalty: string, index: number) => (
                                <li key={index}>{penalty}</li>
                            ))}
                    </ul>

                    <p className="mt-4 mb-2">
                        {t('violations.shopOwnerPenalties.title')}
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        {t
                            .raw('violations.shopOwnerPenalties.penalties')
                            .map((penalty: string, index: number) => (
                                <li key={index}>{penalty}</li>
                            ))}
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">
                        {t('contact.title')}
                    </h2>
                    <p>{t('contact.content')}</p>
                    <div className="mt-4">
                        <p>
                            <strong>{t('contact.address')}</strong>
                        </p>
                        <p>
                            <strong>{t('contact.hotline')}</strong>
                        </p>
                        <p>
                            <strong>{t('contact.email')}</strong>
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Terms;
