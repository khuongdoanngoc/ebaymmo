'use client';

import React, { useState, useMemo } from 'react';
import { useCheckFbMutation } from '@/generated/graphql';
import Input from '@/components/BaseUI/Input';
import Button from '@/components/BaseUI/Button/button';
import { useTranslations } from 'next-intl';

const CheckLiveFB = () => {
    const t = useTranslations('checkLiveFB');
    const [uids, setUids] = useState('');
    const [delimiter, setDelimiter] = useState('');
    const [column, setColumn] = useState('0');
    const [liveUids, setLiveUids] = useState<string[]>([]);
    const [deadUids, setDeadUids] = useState<string[]>([]);
    const [checking, setChecking] = useState(false);

    // Hook mutation
    const [checkFBMutation] = useCheckFbMutation();

    // Tính toán danh sách UID với logic sửa lại
    const uidList = useMemo(() => {
        return uids
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line)
            .map((line) => {
                let part = line;
                if (delimiter && line.includes(delimiter)) {
                    const parts = line.split(delimiter);
                    const col = parseInt(column, 10);
                    part =
                        col >= 0 && col < parts.length
                            ? parts[col].trim()
                            : line;
                }
                if (/^\d{5,}$/.test(part)) return part;
                const onlyDigits = part.replace(/\D/g, '');
                if (/^\d{5,}$/.test(onlyDigits)) return onlyDigits;
                return part;
            })
            .filter((uid) => uid);
    }, [uids, delimiter, column]);

    const BATCH_SIZE = 20;
    const MAX_CONCURRENT = 5;

    // Hàm check UID qua GraphQL
    const handleCheck = async () => {
        if (uidList.length > 1000) {
            alert(t('errors.maxUidsExceeded'));
            return;
        }

        setChecking(true);
        setLiveUids([]);
        setDeadUids([]);

        let allLive: string[] = [];
        let allDead: string[] = [];

        // Chia thành các batch nhỏ
        const batches: string[][] = [];
        for (let i = 0; i < uidList.length; i += BATCH_SIZE) {
            batches.push(uidList.slice(i, i + BATCH_SIZE));
        }

        let current = 0;
        async function runNext() {
            if (current >= batches.length) return;
            const batch = batches[current++];
            try {
                const { data } = await checkFBMutation({
                    variables: { uids: batch }
                });
                allLive = allLive.concat(data?.checkFBUids?.liveUids || []);
                allDead = allDead.concat(data?.checkFBUids?.deadUids || []);
            } catch (e) {
                allDead = allDead.concat(batch);
            }
            setLiveUids([...allLive]);
            setDeadUids([...allDead]);
            await runNext();
        }

        // Chạy song song MAX_CONCURRENT batch
        const runners = [];
        for (let i = 0; i < Math.min(MAX_CONCURRENT, batches.length); i++) {
            runners.push(runNext());
        }
        await Promise.all(runners);

        setChecking(false);
    };

    return (
        <div className="max-w-[1500px] mx-auto py-8 px-2">
            <h1 className="text-4xl font-bold text-center text-neutral-700 mb-4">
                {t('title')}
            </h1>
            <div className="flex flex-col gap-4">
                <Input
                    type="textarea"
                    label={t('inputLabels.uidList')}
                    value={uids}
                    onChange={(e) => setUids(e.target.value)}
                    className="w-full max-h-[130px]"
                />
                <Input
                    type="text"
                    label={t('inputLabels.delimiter')}
                    value={delimiter}
                    onChange={(e) => setDelimiter(e.target.value)}
                />
                <Input
                    type="number"
                    label={t('inputLabels.column')}
                    min={0}
                    value={column}
                    onChange={(e) => setColumn(e.target.value)}
                />
                <div className="flex flex-row items-center gap-4 mt-2">
                    <div className="flex gap-2 items-center">
                        <span className="bg-[#007bff] text-white rounded px-6 py-2 text-sm font-thin">
                            {t('stats.total')}: {uidList.length}
                        </span>
                        <span className="bg-[#71f79b] text-[#258b46] rounded px-6 py-2  text-sm font-thin">
                            {t('stats.success')}: {liveUids.length}
                        </span>
                        <span className="bg-[#f89898] text-[#ee5b5b] rounded px-6 py-2  text-sm font-thin">
                            {t('stats.failed')}: {deadUids.length}
                        </span>
                    </div>
                </div>
                <Input
                    type="textarea"
                    label={t('inputLabels.liveUids')}
                    value={liveUids.join('\n')}
                    readOnly
                    className="w-full min-h-[130px] bg-[#e8f5e9]"
                />
                <Input
                    type="textarea"
                    label={t('inputLabels.deadUids')}
                    value={deadUids.join('\n')}
                    readOnly
                    className="w-full min-h-[130px] bg-[#ffebee]"
                />
            </div>
            <Button
                onClick={handleCheck}
                disabled={checking || uidList.length === 0}
                className="btn-check button button-primary bg-primary text-[18px] text-neutral-50 mt-4 px-10"
            >
                {checking ? t('buttons.checking') : t('buttons.check')}
            </Button>
        </div>
    );
};

export default CheckLiveFB;
