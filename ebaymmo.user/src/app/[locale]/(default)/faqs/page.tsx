'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AddIcon from '@images/add.jpg';
import MinusIcon from '@images/minus.svg';
import HomeIcon from '@images/home.svg';
import ArrowRightIcon from '@images/arrow-right.svg';
import { useTranslations } from 'next-intl';

type CategoryType = 'buyer' | 'seller' | 'reseller';

interface FAQ {
    question: string;
    answer: string;
}

function FAQsPage() {
    const t = useTranslations();
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [activeCategory, setActiveCategory] = useState<CategoryType>('buyer');

    const getFAQsByCategory = (category: CategoryType): FAQ[] => {
        const faqs: FAQ[] = [];
        try {
            if (category === 'buyer') {
                faqs.push(
                    {
                        question: t('faqs.buyer.howToBuy.question'),
                        answer: t('faqs.buyer.howToBuy.answer')
                    },
                    {
                        question: t('faqs.buyer.nonDuplicateEmail.question'),
                        answer: t('faqs.buyer.nonDuplicateEmail.answer')
                    },
                    {
                        question: t('faqs.buyer.howToAddMoney.question'),
                        answer: t('faqs.buyer.howToAddMoney.answer')
                    },
                    {
                        question: t('faqs.buyer.wrongTransfer.question'),
                        answer: t('faqs.buyer.wrongTransfer.answer')
                    },
                    {
                        question: t('faqs.buyer.intermediary.question'),
                        answer: t('faqs.buyer.intermediary.answer')
                    }
                );
            } else if (category === 'seller') {
                faqs.push(
                    {
                        question: t('faqs.seller.registerToSell.question'),
                        answer: t('faqs.seller.registerToSell.answer')
                    },
                    {
                        question: t('faqs.seller.createStore.question'),
                        answer: t('faqs.seller.createStore.answer')
                    },
                    {
                        question: t('faqs.seller.optimizeStore.question'),
                        answer: t('faqs.seller.optimizeStore.answer')
                    },
                    {
                        question: t('faqs.seller.topPage.question'),
                        answer: t('faqs.seller.topPage.answer')
                    },
                    {
                        question: t('faqs.seller.salesRevenue.question'),
                        answer: t('faqs.seller.salesRevenue.answer')
                    },
                    {
                        question: t('faqs.seller.prohibitedItems.question'),
                        answer: t('faqs.seller.prohibitedItems.answer')
                    },
                    {
                        question: t('faqs.seller.discount.question'),
                        answer: t('faqs.seller.discount.answer')
                    },
                    {
                        question: t('faqs.seller.withdrawMoney.question'),
                        answer: t('faqs.seller.withdrawMoney.answer')
                    },
                    {
                        question: t('faqs.seller.buildTrust.question'),
                        answer: t('faqs.seller.buildTrust.answer')
                    },
                    {
                        question: t('faqs.seller.productExchange.question'),
                        answer: t('faqs.seller.productExchange.answer')
                    }
                );
            } else if (category === 'reseller') {
                faqs.push(
                    {
                        question: t('faqs.reseller.becomeReseller.question'),
                        answer: t('faqs.reseller.becomeReseller.answer')
                    },
                    {
                        question: t('faqs.reseller.startSelling.question'),
                        answer: t('faqs.reseller.startSelling.answer')
                    },
                    {
                        question: t('faqs.reseller.withdrawRevenue.question'),
                        answer: t('faqs.reseller.withdrawRevenue.answer')
                    },
                    {
                        question: t('faqs.reseller.additionalRewards.question'),
                        answer: t('faqs.reseller.additionalRewards.answer')
                    }
                );
            }
        } catch (error) {
            console.error('Translation error:', error);
        }
        return faqs;
    };

    return (
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-[160px] pt-[20px] sm:pt-[50px]">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 py-2 sm:py-4 gap-[8px] sm:gap-[15px] overflow-x-auto">
                <Link href="/" className="text-gray-500 flex-shrink-0">
                    <Image
                        src={HomeIcon}
                        alt="Home icon"
                        width={20}
                        height={20}
                        className="sm:w-[24px] sm:h-[24px]"
                    />
                </Link>
                <Image
                    src={ArrowRightIcon}
                    alt="Arrow right icon"
                    width={20}
                    height={20}
                    className="sm:w-[24px] sm:h-[24px]"
                />
                <span className="text-neutral-500 font-beausans text-[14px] sm:text-[18px] font-medium leading-[160%] whitespace-nowrap">
                    {t('HeaderMenuDropdown.FAQs')}
                </span>
            </nav>

            {/* Header */}
            <div className="inline-flex flex-col items-start gap-[5px] sm:gap-[10px] w-full sm:w-[340px] mt-[20px] sm:mt-[40px]">
                <span className="text-[28px] sm:text-[40px] font-bold leading-[140%] text-neutral-400 ">
                    {t('faqs.title')}
                </span>
                <p className="text-[16px] sm:text-[18px] font-normal leading-[160%] text-neutral-400 ">
                    {t('faqs.subtitle')}
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 mt-[20px] sm:mt-[40px]">
                {/* Sidebar Categories */}
                <div className="w-full lg:w-[293px] h-fit">
                    <div className="flex flex-col gap-[10px] sm:gap-[20px]">
                        {['buyer', 'seller', 'reseller'].map((category) => (
                            <div
                                key={category}
                                className={`w-full h-[50px] lg:h-[72px] 
                                    px-[20px] lg:px-[40px] py-[10px] lg:py-[20px] 
                                    cursor-text flex items-center justify-center lg:justify-start relative 
                                    ${
                                        activeCategory === category
                                            ? 'text-[#3F3F3F] after:content-[""] after:absolute after:top-0 after:right-0 after:w-full after:h-full after:bg-[linear-gradient(297deg,rgba(255,255,255,0.00)_18.43%,rgba(110,236,151,0.90)_78.69%)] after:rounded-[10px_10px_10px_0]'
                                            : 'text-[#3F3F3F]'
                                    }`}
                                onClick={() =>
                                    setActiveCategory(category as CategoryType)
                                }
                            >
                                <span className="text-[16px] lg:text-[20px] font-medium leading-[160%] text-neutral-400 relative z-10">
                                    {t(`faqs.categories.${category}`)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQ List */}
                <div className="flex-1 mt-4 lg:mt-0">
                    {getFAQsByCategory(activeCategory).map((faq, index) => (
                        <div key={index} className="mb-3 sm:mb-4">
                            <button
                                onClick={() =>
                                    setActiveIndex(
                                        activeIndex === index ? null : index
                                    )
                                }
                                className={`w-full flex justify-between items-center bg-white rounded-lg px-4 sm:px-6 py-3 sm:py-4 ${
                                    activeIndex === index
                                        ? 'border-[#33A959]'
                                        : 'border-gray-200'
                                }`}
                            >
                                <span
                                    className={`text-[16px] sm:text-[18px] font-semibold leading-[24px] sm:leading-[28px] font-beausans text-left ${
                                        activeIndex === index
                                            ? 'text-[#33A959]'
                                            : 'text-neutral-400'
                                    }`}
                                >
                                    {faq.question}
                                </span>

                                {activeIndex === index ? (
                                    <Image
                                        src={MinusIcon}
                                        alt="Minus icon"
                                        width={16}
                                        height={16}
                                        className="sm:w-[20px] sm:h-[20px] text-[#33A959]"
                                    />
                                ) : (
                                    <Image
                                        src={AddIcon}
                                        alt="Add icon"
                                        width={16}
                                        height={16}
                                        className="sm:w-[20px] sm:h-[20px]"
                                    />
                                )}
                            </button>
                            <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                    activeIndex === index
                                        ? 'max-h-[500px]'
                                        : 'max-h-0'
                                }`}
                            >
                                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-white border-t-0 border-[#33A959] rounded-b-lg">
                                    <span className="text-[14px] sm:text-[16px] font-normal leading-[20px] sm:leading-[24px] text-gray-500 font-beausans">
                                        {faq.answer}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default FAQsPage;
