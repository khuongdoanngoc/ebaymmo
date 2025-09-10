'use client';

import React, { useState } from 'react';
import { Switch } from '@headlessui/react';
import { useTranslations } from 'next-intl';

export default function ApiPurchaseToggle() {
    const t = useTranslations('user.account-management.api-purchase');
    const [apiEnabled, setApiEnabled] = useState(false);

    return (
        <div>
            <label className="block text-[18px] font-medium text-gray-700">
                {t('title')}
            </label>
            <div className="mt-1 flex justify-between items-center">
                <div>
                    <span className="text-green-500">
                        {apiEnabled ? t('enabled') : t('not-enabled')}
                    </span>
                    <span className="text-green-500 ml-1">{t('hint')}</span>
                </div>
                <Switch
                    checked={apiEnabled}
                    onChange={setApiEnabled}
                    className={`${apiEnabled ? 'bg-green-500' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full`}
                >
                    <span
                        className={`${apiEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`}
                    />
                </Switch>
            </div>
        </div>
    );
}
