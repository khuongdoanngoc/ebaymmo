'use client';

import Image from 'next/image';
import Link from 'next/link';

interface BreadcrumbProps {
    forUrl: string;
    type?: string;
    category?: {
        categoryName: string;
        categorySlug: string;
    };
    store?: string;
}

export default function Breadcrumb({
    forUrl,
    type,
    category,
    store
}: BreadcrumbProps) {
    return (
        <nav aria-label="breadcrumb ">
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
                            {type?.includes('Search') ? (
                                <span>{type}</span>
                            ) : (
                                <Link
                                    href={`/${forUrl}${type === 'Shares' ? '' : `?type=${type?.toLocaleLowerCase()}`}`}
                                >
                                    {type}
                                </Link>
                            )}
                        </div>
                    </div>
                </li>
                {category && category.categorySlug !== '' && (
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
                                {store ? (
                                    <Link
                                        href={`/products?type=${type?.toLocaleLowerCase()}&category=${category.categorySlug}`}
                                    >
                                        {category.categoryName}
                                    </Link>
                                ) : (
                                    category.categoryName
                                )}
                            </div>
                        </div>
                    </li>
                )}
                {store && (
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
                                {store}
                            </div>
                        </div>
                    </li>
                )}
            </ol>
        </nav>
    );
}

{
    /* <li key={index}>
                            <div className="flex">
                                <Image
                                    src="/images/arrow-right.svg"
                                    alt="homeIcon"
                                    width={24}
                                    height={24}
                                    className="m-[0_15px]"
                                />
                                <div className="text-[18px] text-black">
                                    {isLast ? (
                                        <span>{formattedSegment}</span>
                                    ) : (
                                        <Link href={path}>
                                            {formattedSegment}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </li> */
}
