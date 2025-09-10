'use client';

import React, { useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area
} from 'recharts';
import { DatePicker, Dropdown } from 'antd';
import locale from 'antd/es/date-picker/locale/vi_VN';
import 'dayjs/locale/vi';
import Image from 'next/image';
import ArrowDown from '@images/arrow-down.png';
import dayjs from 'dayjs';
import { DownloadOutlined } from '@ant-design/icons';
import { useDashboardStatsQuery } from '@/generated/graphql';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

interface StatCardProps {
    title: string;
    value: string;
    change: string;
    isIncrease?: boolean;
}

const StatCard = ({
    title,
    value,
    change,
    isIncrease = true
}: StatCardProps) => {
    const t = useTranslations('seller.dashboard');
    return (
        <div className="flex flex-col gap-[20px] p-[25px] bg-white">
            <span className="text-[#3F3F3F] text-[18px] font-medium">
                {title}
            </span>
            <div className="flex items-center gap-[8px] justify-between">
                <span className="text-[32px] font-bold text-[#3F3F3F]">
                    {value}
                </span>
                <div
                    className={`px-[8px] py-[4px] rounded-[20px] flex items-center gap-[4px] ${isIncrease ? 'bg-[#b6fdcc]' : 'bg-[#ffbdbd]'}`}
                >
                    <span
                        className={`text-[14px] font-medium ${isIncrease ? 'text-[#40C96D]' : 'text-[#FF4141]'}`}
                    >
                        {change}%
                    </span>
                    <span
                        className={`${isIncrease ? 'text-[#40C96D]' : 'text-[#FF4141]'}`}
                    >
                        {isIncrease ? '↑' : '↓'}
                    </span>
                </div>
            </div>
            <span className="text-[14px] font-medium text-[#9C9C9C] leading-[22.4px] ">
                {isIncrease ? t('increate') : t('decreate')} {value}{' '}
                {t('so-with-the-previous-month')}
            </span>
        </div>
    );
};

// Skeleton component for StatCard
const StatCardSkeleton = () => (
    <div className="flex flex-col gap-[20px] p-[25px] bg-white">
        <div className="h-[18px] w-[120px] bg-gray-200 rounded animate-pulse" />
        <div className="flex items-center gap-[8px] justify-between">
            <div className="h-[32px] w-[80px] bg-gray-200 rounded animate-pulse" />
            <div className="h-[26px] w-[60px] bg-gray-200 rounded-[20px] animate-pulse" />
        </div>
        <div className="h-[22px] w-full bg-gray-200 rounded animate-pulse" />
    </div>
);

// Skeleton component for chart
const ChartSkeleton = () => (
    <div className="h-[500px] w-full mt-[25px] mb-[30px] bg-gray-100 rounded-md flex items-center justify-center">
        <div className="w-full h-full rounded-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-100 animate-pulse" />

            {/* Horizontal grid lines */}
            {[...Array(6)].map((_, i) => (
                <div
                    key={`h-line-${i}`}
                    className="absolute w-full h-[1px] bg-gray-200"
                    style={{ top: `${(i + 1) * 14}%` }}
                />
            ))}

            {/* Vertical grid lines */}
            {[...Array(10)].map((_, i) => (
                <div
                    key={`v-line-${i}`}
                    className="absolute h-full w-[1px] bg-gray-200"
                    style={{ left: `${(i + 1) * 9}%` }}
                />
            ))}

            {/* Chart line placeholder */}
            <div className="absolute w-[95%] h-[2px] bg-gray-300 top-[50%] left-[2.5%]">
                <div className="absolute w-full h-[60px] bottom-0 bg-gradient-to-t from-gray-200 to-transparent opacity-30" />
            </div>
        </div>
    </div>
);

const SellerDashboard = () => {
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const { data: session } = useSession();
    const t = useTranslations('seller.dashboard');

    const currentDate = dayjs();
    const sellerId = session?.user?.id;

    const monthStart = selectedDate.startOf('month').toISOString();
    const monthEnd = selectedDate.endOf('month').add(1, 'day').toISOString();
    const prevMonthStart = selectedDate
        .subtract(1, 'month')
        .startOf('month')
        .toISOString();

    const { data, loading, error } = useDashboardStatsQuery({
        variables: { sellerId, monthStart, monthEnd, prevMonthStart }
    });

    // Render skeleton while loading
    if (loading) {
        return (
            <div className="">
                <div className="px-6 py-6 lg:px-[45px] lg:py-[40px] rounded-[15px] border border-[#E1E1E1] bg-white">
                    {/* Dashboard title skeleton */}
                    <div className="h-[33px] w-[150px] bg-gray-200 rounded animate-pulse" />

                    {/* First row of stat cards skeleton */}
                    <div className="inline-flex w-full">
                        <div className="flex md:flex-row flex-col border border-gray-200 rounded-[12px] overflow-hidden mt-[35px]">
                            <div className="md:w-[316px] w-full">
                                <StatCardSkeleton />
                            </div>
                            <div className="md:w-[316px] w-full md:border-l md:border-t-0 border-t border-gray-200">
                                <StatCardSkeleton />
                            </div>
                        </div>
                    </div>

                    {/* Chart section skeleton */}
                    <div className="mt-[30px]">
                        <div className="flex justify-between items-center mb-4">
                            <div className="h-[28px] w-[120px] bg-gray-200 rounded animate-pulse" />
                            <div className="h-[36px] w-[100px] bg-gray-200 rounded-[8px] animate-pulse" />
                        </div>
                        <ChartSkeleton />
                    </div>

                    {/* Date picker section skeleton */}
                    <div className="flex flex-col gap-[25px]">
                        <div className="h-[28px] w-[200px] bg-gray-200 rounded animate-pulse" />
                        <div className="relative mb-[25px]">
                            <div className="h-[36px] w-[120px] bg-gray-200 rounded-[8px] animate-pulse" />
                        </div>
                    </div>

                    {/* Second row of stat cards skeleton */}
                    <div className="inline-flex w-full">
                        <div className="flex md:flex-row flex-col border border-gray-200 rounded-[12px] overflow-hidden">
                            <div className="md:w-[316px] w-full">
                                <StatCardSkeleton />
                            </div>
                            <div className="md:w-[316px] w-full md:border-l md:border-t-0 border-t border-gray-200">
                                <StatCardSkeleton />
                            </div>
                            <div className="md:w-[316px] w-full md:border-l md:border-t-0 border-t border-gray-200">
                                <StatCardSkeleton />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) return <div>Error: {error.message}</div>;

    const orderCount = data?.orderNumber?.aggregate?.count || 0;
    const prevOrderCount = data?.prevOrderNumber?.aggregate?.count || 0;
    const orderChange = prevOrderCount
        ? (((orderCount - prevOrderCount) / prevOrderCount) * 100).toFixed(2)
        : '100';

    const sales = data?.sales?.aggregate?.sum?.totalAmount || 0;
    const prevSales = data?.prevSales?.aggregate?.sum?.totalAmount || 0;
    const salesChange = prevSales
        ? (((sales - prevSales) / prevSales) * 100).toFixed(2)
        : '100';

    const tempHold = data?.temporaryHold?.aggregate?.sum?.totalAmount || 0;
    const prevTempHold =
        data?.prevTemporaryHold?.aggregate?.sum?.totalAmount || 0;
    const tempHoldChange = prevTempHold
        ? (((tempHold - prevTempHold) / prevTempHold) * 100).toFixed(2)
        : '100';

    // Tạo chartData cho 30 ngày gần nhất
    const chartData = Array.from({ length: 30 }, (_, index) => {
        const date = currentDate.subtract(29 - index, 'day'); // Từ 25/02 đến 26/03
        const dayData = (data?.chartData || []).filter((order) =>
            dayjs(order.orderDate).isSame(date, 'day')
        );
        const totalAmount = dayData.reduce(
            (sum, order) => sum + (order.totalAmount || 0),
            0
        );
        return { name: date.format('DD/MM'), value: totalAmount };
    });

    const downloadChart = (fileType: string) => {
        const svgElement = document.querySelector('.recharts-wrapper svg');
        if (!svgElement) return;

        const titleGroup = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'g'
        );
        const titleText = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'text'
        );
        titleText.setAttribute('x', '50%');
        titleText.setAttribute('y', '30');
        titleText.setAttribute('text-anchor', 'middle');
        titleText.setAttribute('font-size', '16');
        titleText.setAttribute('font-weight', 'bold');
        titleText.setAttribute('fill', '#3F3F3F');
        titleText.textContent = `Biểu đồ doanh thu 30 ngày gần nhất (${currentDate.format('DD/MM/YYYY')})`;
        titleGroup.appendChild(titleText);
        svgElement.insertBefore(titleGroup, svgElement.firstChild);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const img = new window.Image(
            svgElement.clientWidth,
            svgElement.clientHeight
        );

        const svgBlob = new Blob([svgData], {
            type: 'image/svg+xml;charset=utf-8'
        });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            canvas.width = svgElement.clientWidth;
            canvas.height = svgElement.clientHeight + 40;
            if (ctx) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            }
            if (fileType === 'svg') {
                const a = document.createElement('a');
                a.href = url;
                a.download = `chart-30-days-${currentDate.format('DD-MM-YYYY')}.svg`;
                a.click();
            } else {
                canvas.toBlob((blob) => {
                    if (!blob) return;
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `chart-30-days-${currentDate.format('DD-MM-YYYY')}.${fileType}`;
                    a.click();
                    URL.revokeObjectURL(url);
                }, `image/${fileType}`);
            }
        };

        img.src = url;
        svgElement.removeChild(titleGroup);
    };

    const menuItems = [
        { key: '1', label: 'PNG', onClick: () => downloadChart('png') },
        { key: '2', label: 'JPG', onClick: () => downloadChart('jpg') },
        { key: '3', label: 'SVG', onClick: () => downloadChart('svg') }
    ];

    return (
        <div className="">
            <div className="px-6 py-6 lg:px-[45px] lg:py-[40px] rounded-[15px] border border-[#E1E1E1] bg-white">
                <span className="block text-[24px] font-bold text-[#3F3F3F] leading-[33.6px] font-bt-beau-sans">
                    {t('title')}
                </span>

                <div className="inline-flex w-full">
                    <div className="flex md:flex-row flex-col border border-[#40C96D] rounded-[12px] overflow-hidden mt-[35px]">
                        <div className="md:w-[316px] w-full">
                            <StatCard
                                title={t('order-number')}
                                value={String(orderCount)}
                                change={orderChange}
                                isIncrease={orderCount >= prevOrderCount}
                            />
                        </div>
                        <div className="md:w-[316px] w-full md:border-l md:border-t-0 border-t border-[#40C96D]">
                            <StatCard
                                title={t('sales')}
                                value={String(sales)}
                                change={salesChange}
                                isIncrease={sales >= prevSales}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-[30px]">
                    <div className="flex justify-between items-center mb-4">
                        <span className="md:text-[18px] text-[12px] font-bold text-[#3F3F3F] leading-[28.8px] ">
                            {t('30-day-near')}
                        </span>
                        <Dropdown
                            menu={{ items: menuItems }}
                            placement="bottomRight"
                        >
                            <button className="flex items-center gap-2 md:px-3 md:py-2 px-2 py-1 border border-[#E6E6E6] rounded-[8px] hover:bg-gray-50 md:text-[18px] text-[12px]">
                                <DownloadOutlined />
                                <span>{t('download')}</span>
                            </button>
                        </Dropdown>
                    </div>
                    <div className="h-[500px] w-full mt-[25px] mb-[30px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <defs>
                                    <linearGradient
                                        id="colorGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0.97"
                                        y2="0.97"
                                        gradientTransform="rotate(157)"
                                    >
                                        <stop
                                            offset="20.5%"
                                            stopColor="rgba(64, 201, 109, 0.20)"
                                        />
                                        <stop
                                            offset="90.56%"
                                            stopColor="rgba(178, 255, 203, 0.20)"
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#E6E6E6"
                                />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: '#6C6C6C' }}
                                    interval={4}
                                />{' '}
                                {/* Hiển thị nhãn cách 5 ngày */}
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6C6C6C' }}
                                    dx={10}
                                    domain={[0, 'auto']}
                                    allowDataOverflow={false}
                                    includeHidden={true}
                                />
                                <Tooltip
                                    formatter={(value) => [
                                        `${value} USDT`,
                                        'Total Amount'
                                    ]}
                                    labelFormatter={(label) => `Ngày ${label}`}
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #E6E6E6',
                                        borderRadius: '8px',
                                        padding: '8px 12px'
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#33A959"
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#33A959"
                                    strokeWidth={2}
                                    fill="url(#colorGradient)"
                                    fillOpacity={1}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="flex flex-col gap-[25px]">
                    <span className="block text-[18px] font-bold text-[#3F3F3F] leading-[28.8px]">
                        {t('business-month')} {selectedDate.format('MM/YYYY')}
                    </span>
                    <div className="relative mb-[25px]">
                        <button
                            className="flex items-center gap-[8px] px-[12px] py-[8px] border border-[#E6E6E6] rounded-[8px] bg-white"
                            onClick={() => setIsPickerOpen(!isPickerOpen)}
                        >
                            <Image
                                src={'/images/seller/calendar.png'}
                                alt="calendar"
                                width={20}
                                height={20}
                                className="fill-black"
                            />
                            <span className="text-[14px] text-[#3F3F3F]">
                                {selectedDate.format('MM/YYYY')}
                            </span>
                            <Image
                                src={ArrowDown}
                                alt="arrow-down"
                                width={20}
                                height={20}
                            />
                        </button>
                        <DatePicker.MonthPicker
                            locale={locale}
                            open={isPickerOpen}
                            value={selectedDate}
                            onOpenChange={(open) => setIsPickerOpen(open)}
                            onChange={(date) => {
                                if (date) {
                                    setSelectedDate(date);
                                    setIsPickerOpen(false);
                                }
                            }}
                            getPopupContainer={(trigger) =>
                                trigger.parentElement || document.body
                            }
                            popupStyle={{
                                position: 'absolute',
                                top: '1390px',
                                left: '35%',
                                marginTop: '8px',
                                borderRadius: '8px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                            }}
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>

                <div className="inline-flex  w-full">
                    <div className="flex md:flex-row flex-col border border-[#40C96D] rounded-[12px] overflow-hidden">
                        <div className="md:w-[316px] w-full">
                            <StatCard
                                title={t('order-number')}
                                value={String(orderCount)}
                                change={orderChange}
                                isIncrease={orderCount >= prevOrderCount}
                            />
                        </div>
                        <div className="md:w-[316px] w-full md:border-l md:border-t-0 border-t border-[#40C96D]">
                            <StatCard
                                title={t('sales')}
                                value={String(sales)}
                                change={salesChange}
                                isIncrease={sales >= prevSales}
                            />
                        </div>
                        <div className="md:w-[316px] w-full md:border-l md:border-t-0 border-t border-[#40C96D]">
                            <StatCard
                                title={t('temborary-hold')}
                                value={String(tempHold)}
                                change={tempHoldChange}
                                isIncrease={tempHold >= prevTempHold}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerDashboard;
