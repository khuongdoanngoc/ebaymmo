import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';

export default function LanguageSwitcher() {
    const router = useRouter();
    const pathname = usePathname();
    const currentLocale = useLocale();
    const [isLanguageOpen, setIsLanguageOpen] = useState(false);
    const languageSwitcherRef = useRef<HTMLDivElement>(null);
    const t = useTranslations();

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                languageSwitcherRef.current &&
                !languageSwitcherRef.current.contains(event.target as Node)
            ) {
                setIsLanguageOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const getCurrentFlag = () => {
        switch (currentLocale) {
            case 'vi':
                return { src: '/images/flag-vn.png', label: 'Vietnamese' };
            case 'ru':
                return { src: '/images/flag-rs.svg', label: 'Russian' };
            case 'zh':
                return { src: '/images/flag-cn.svg', label: 'Chinese' };
            default:
                return { src: '/images/flag-uk.svg', label: 'English' };
        }
    };

    const handleLanguageChange = (locale: string) => {
        setIsLanguageOpen(false);

        // Get the path without the locale
        const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '');

        // Construct new path with new locale
        const newPath = `/${locale}${pathWithoutLocale}`;

        // Navigate to the new path
        router.push(newPath);
    };

    return (
        <div
            className="multi-language relative flex items-center"
            ref={languageSwitcherRef}
        >
            <div
                className="flex items-center gap-1 cursor-pointer"
                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
            >
                <div className="flag-wrapper w-[29px] h-[29px]">
                    <Image
                        src={getCurrentFlag().src}
                        width={29}
                        height={29}
                        alt={getCurrentFlag().label}
                        className="w-full h-full object-contain animate-scaleBounce"
                    />
                </div>
                <div className="arrow-wrapper w-[16px] h-[16px]">
                    <Image
                        width={16}
                        height={16}
                        src="/images/arrow-right.png"
                        alt="arrow-right"
                        className={`w-full h-full object-contain transition-transform duration-200 ${
                            isLanguageOpen ? 'rotate-90' : ''
                        }`}
                    />
                </div>
            </div>

            {isLanguageOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg py-2 min-w-[150px] z-50">
                    {['en', 'vi', 'ru', 'zh']
                        .filter((locale) => locale !== currentLocale) // Loại bỏ ngôn ngữ hiện tại
                        .map((locale) => (
                            <button
                                key={locale}
                                className="w-full px-4 py-2 text-left hover:bg-[#E8FFEF] flex items-center gap-2"
                                onClick={() => handleLanguageChange(locale)}
                            >
                                <Image
                                    width={20}
                                    height={20}
                                    src={`/images/flag-${
                                        locale === 'vi'
                                            ? 'vn'
                                            : locale === 'ru'
                                              ? 'rs'
                                              : locale === 'zh'
                                                ? 'cn'
                                                : 'uk'
                                    }.${locale === 'vi' ? 'png' : 'svg'}`}
                                    alt={locale}
                                    className="w-5 h-5 object-contain"
                                />
                                {t(
                                    locale === 'en'
                                        ? 'english'
                                        : locale === 'vi'
                                          ? 'vietnamese'
                                          : locale === 'ru'
                                            ? 'russian'
                                            : 'chinese'
                                )}
                            </button>
                        ))}
                </div>
            )}
        </div>
    );
}
