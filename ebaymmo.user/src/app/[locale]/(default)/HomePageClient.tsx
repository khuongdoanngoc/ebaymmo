'use client';
import CategorySection from '@/components/BaseUI/Section/CategorySection';
import FeatureSection from '@/components/BaseUI/Section/FeatureSection';
import BecomeSeller from './_components/BecomeSeller';
import ContactSection from '@/components/BaseUI/Section/ContactSection';

export default function HomePageClient() {
    return (
        <div>
            <>
                <CategorySection className="section-homepage-1 pb-10 px-6 lg:px-0 bg-[radial-gradient(121.19%_62.26%_at_27.16%_53.41%,_#E9FFEB_0%,_#EDF1F6_100%)] pt-[60px] " />
                <BecomeSeller />
                <FeatureSection />
                <ContactSection />
            </>
        </div>
    );
}
