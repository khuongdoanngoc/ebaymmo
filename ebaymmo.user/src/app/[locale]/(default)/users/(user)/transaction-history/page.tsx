'use client';

import dynamic from 'next/dynamic';

// Import the component that uses window with ssr:false
const TransactionHistoryContent = dynamic(
    () => import('./TransactionHistoryContent'),
    { ssr: false }
);

export default function TransactionHistoryPage() {
    return (
        <div className="container mx-auto py-6">
            <TransactionHistoryContent />
        </div>
    );
}
