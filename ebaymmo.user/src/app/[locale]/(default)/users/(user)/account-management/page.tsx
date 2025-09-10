'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { PencilIcon } from '@heroicons/react/24/outline';
import { Switch } from '@headlessui/react';
import Image from 'next/image';
import Input from '@/components/BaseUI/Input';

// Import the component that uses window with ssr:false
const AccountManagementContent = dynamic(
    () => import('./AccountManagementContent'),
    { ssr: false }
);

export default function AccountManagementPage() {
    return (
        <div className="container mx-auto py-6">
            <AccountManagementContent />
        </div>
    );
}
