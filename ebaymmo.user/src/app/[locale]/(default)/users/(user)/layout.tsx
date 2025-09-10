import UserSection from '@/components/BaseUI/Section/UserSection';
import { SessionProvider } from 'next-auth/react';
export default function UserLayout({
    children
}: {
    children: React.ReactNode;
}) {
    return (
        <SessionProvider>
            <UserSection>
                {/* Đây là phần tương đương với <Outlet /> trong React Router */}
                <div className="right-content-wrapper flex-1">{children}</div>
            </UserSection>
        </SessionProvider>
    );
}
