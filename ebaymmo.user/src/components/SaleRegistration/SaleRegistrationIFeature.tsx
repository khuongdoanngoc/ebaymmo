import SaleRegistrationFeatureItem from './SaleRegistraionFeatureItem';
import { useTranslations, useLocale } from 'next-intl';

export default function SaleRegistrationFeature() {
    const t = useTranslations('saleRegistration');
    const features = [
        {
            iconSrc: '/images/lock.svg',
            title: t('features.secure.title'),
            description: t('features.secure.description')
        },
        {
            iconSrc: '/images/connect.svg',
            title: t('features.cooperate.title'),
            description: t('features.cooperate.description')
        },
        {
            iconSrc: '/images/fly.svg',
            title: t('features.support.title'),
            description: t('features.support.description')
        },
        {
            iconSrc: '/images/telegreen.svg',
            title: t('features.notifications.title'),
            description: t('features.notifications.description')
        },
        {
            iconSrc: '/images/2fa.svg',
            title: t('features.twoFactor.title'),
            description: t('features.twoFactor.description')
        }
    ];

    // Safely render with fallbacks
    return (
        <>
            {features.map((feature, index) => (
                <SaleRegistrationFeatureItem
                    key={index}
                    iconSrc={feature.iconSrc}
                    title={feature.title || '(Missing translation)'}
                    description={feature.description || '(Missing translation)'}
                />
            ))}
        </>
    );
}
