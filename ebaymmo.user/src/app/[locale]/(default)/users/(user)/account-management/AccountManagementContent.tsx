'use client';

import { PencilIcon } from '@heroicons/react/24/outline';
import { Switch } from '@headlessui/react';
import Image from 'next/image';
import { useState } from 'react';
import Input from '@/components/BaseUI/Input';

export default function AccountManagementContent() {
    const [apiEnabled, setApiEnabled] = useState(false);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [isEditing, setIsEditing] = useState({
        fullName: false,
        password: false
    });

    return (
        <div className="p-8 border border-black-700 rounded-[15px]">
            <div className="mx-auto max-w-6xl w-full px-4 md:w-[940px]">
                <div className="flex flex-col gap-6">
                    <div className="bg-white p-6">
                        <div className="mb-6">
                            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6">
                                Account Information
                            </h2>

                            <div className="flex flex-col md:flex-row gap-8 w-full">
                                {/* Left side - Avatar */}
                                <div className="w-full md:w-1/2 flex justify-center md:justify-start">
                                    <div className="w-full flex justify-center md:justify-start">
                                        <Image
                                            src="/images/telegram.svg"
                                            width={200}
                                            height={200}
                                            alt="Avatar"
                                            className="w-[120px] md:w-[200px] h-auto rounded-lg mb-4"
                                        />
                                    </div>
                                </div>

                                {/* Right side - Upload */}
                                <div className="w-full md:w-1/2 flex flex-col items-center gap-[20px]">
                                    <div className="w-full h-[80px] md:h-[120px] border-2 border-dashed border-primary-500 rounded-lg flex flex-col items-center justify-center gap-2">
                                        <Image
                                            src="/images/cloud-upload.svg"
                                            width={32}
                                            height={32}
                                            alt="Upload"
                                            className="w-[24px] md:w-[32px] h-auto"
                                        />
                                        <span className="text-gray-600">
                                            Choose Profile Picture
                                        </span>
                                    </div>
                                    <button className="mt-4 px-6 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors">
                                        Upload
                                    </button>
                                </div>
                            </div>

                            {/* Points level bar */}
                            <div className="mt-8">
                                <div className="text-sm text-gray-600 mb-2">
                                    points lv
                                </div>
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full w-[30%] bg-green-500 rounded-full" />
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-green-500 font-medium">
                                        LVL 0
                                    </span>
                                    <span className="text-gray-600">
                                        10 Points to level up 1
                                    </span>
                                </div>
                            </div>

                            {/* Account with KYC badge */}
                            <div className="mt-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-gray-700 font-medium">
                                        Account
                                    </span>
                                    <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">
                                        KYC Verified
                                    </span>
                                </div>
                                <div className="text-gray-600">
                                    @le_cong_tuan
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 flex flex-col gap-[30px]">
                            <div>
                                <label className="block text-[16px] md:text-[18px] font-medium text-gray-700">
                                    Full Name
                                </label>
                                {isEditing.fullName ? (
                                    <>
                                        <Input
                                            className="mt-1 w-full rounded-lg border-gray-300"
                                            placeholder="Enter your full name"
                                        />
                                        <div className="mt-2 flex justify-end gap-4">
                                            <button
                                                onClick={() =>
                                                    setIsEditing({
                                                        ...isEditing,
                                                        fullName: false
                                                    })
                                                }
                                                className="text-red-500 hover:text-red-600"
                                            >
                                                Cancel
                                            </button>
                                            <button className="px-4 py-1 bg-green-500 text-white rounded-full hover:bg-green-600">
                                                Confirm
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="mt-1 flex justify-between items-center">
                                        <p className="text-[16px] md:text-[18px] text-gray-600">
                                            ••••••••••••
                                        </p>
                                        <button
                                            onClick={() =>
                                                setIsEditing({
                                                    ...isEditing,
                                                    fullName: true
                                                })
                                            }
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <PencilIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-[16px] md:text-[18px] font-medium text-gray-700">
                                    Email
                                </label>
                                <p className="mt-1 text-[16px] md:text-[18px] text-gray-600">
                                    lecongtuan47004@gmail.com
                                </p>
                            </div>

                            <div>
                                <label className="block text-[16px] md:text-[18px] font-medium text-gray-700">
                                    Password
                                </label>
                                {isEditing.password ? (
                                    <>
                                        <Input
                                            type="password"
                                            className="mt-1 w-full rounded-lg border-gray-300"
                                            placeholder="Enter new password"
                                        />
                                        <div className="mt-2 flex justify-end gap-4">
                                            <button
                                                onClick={() =>
                                                    setIsEditing({
                                                        ...isEditing,
                                                        password: false
                                                    })
                                                }
                                                className="text-red-500 hover:text-red-600"
                                            >
                                                Cancel
                                            </button>
                                            <button className="px-4 py-1 bg-green-500 text-white rounded-full hover:bg-green-600">
                                                Confirm
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="mt-1 flex justify-between items-center">
                                        <p className="text-[16px] md:text-[18px] text-gray-600">
                                            ••••••••••••••••••
                                        </p>
                                        <button
                                            onClick={() =>
                                                setIsEditing({
                                                    ...isEditing,
                                                    password: true
                                                })
                                            }
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <PencilIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="border border-[1px] border-border_color mt-[20px] mb-[20px] p-0" />

                            <div>
                                <label className="block text-[16px] md:text-[18px] font-medium text-gray-700">
                                    Registration Date
                                </label>
                                <p className="mt-1 text-[16px] md:text-[18px] text-gray-600">
                                    03/02/2025
                                </p>
                            </div>

                            <div>
                                <label className="block text-[16px] md:text-[18px] font-medium text-gray-700">
                                    Purchased
                                </label>
                                <p className="mt-1 text-[16px] md:text-[18px] text-gray-600">
                                    0 products
                                </p>
                            </div>

                            <div>
                                <label className="block text-[16px] md:text-[18px] font-medium text-gray-700">
                                    Number of Stores
                                </label>
                                <p className="mt-1 text-[16px] md:text-[18px] text-gray-600">
                                    0 stores
                                </p>
                            </div>

                            <div>
                                <label className="block text-[16px] md:text-[18px] font-medium text-gray-700">
                                    Sold
                                </label>
                                <p className="mt-1 text-[16px] md:text-[18px] text-gray-600">
                                    0 products
                                </p>
                            </div>

                            <div>
                                <label className="block text-[16px] md:text-[18px] font-medium text-gray-700">
                                    Number of Posts
                                </label>
                                <p className="mt-1 text-[16px] md:text-[18px] text-gray-600">
                                    0 posts
                                </p>
                            </div>

                            <div className=" border-[1px] border-border_color mt-[20px] mb-[20px] p-0" />

                            <div>
                                <label className="block text-[16px] md:text-[18px] font-medium text-gray-700">
                                    API Purchase
                                </label>
                                <div className="mt-1 flex justify-between items-center">
                                    <div>
                                        <span className="text-green-500">
                                            Not enabled
                                        </span>
                                        <span className="text-green-500 ml-1">
                                            (Enable API purchase to use this
                                            feature)
                                        </span>
                                    </div>
                                    <Switch
                                        checked={apiEnabled}
                                        onChange={setApiEnabled}
                                        className={`${
                                            apiEnabled
                                                ? 'bg-green-500'
                                                : 'bg-gray-200'
                                        } relative inline-flex h-6 w-11 items-center rounded-full`}
                                    >
                                        <span
                                            className={`${
                                                apiEnabled
                                                    ? 'translate-x-6'
                                                    : 'translate-x-1'
                                            } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                                        />
                                    </Switch>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[16px] md:text-[18px] font-medium text-gray-700">
                                    Two-Factor Authentication
                                </label>
                                <div className="mt-1 flex justify-between items-center">
                                    <div>
                                        <span className="text-red-500">
                                            Not enabled
                                        </span>
                                        <span className="text-green-500 ml-1">
                                            (Protect your account with 2FA
                                            authentication)
                                        </span>
                                    </div>
                                    <Switch
                                        checked={twoFactorEnabled}
                                        onChange={setTwoFactorEnabled}
                                        className={`${
                                            twoFactorEnabled
                                                ? 'bg-green-500'
                                                : 'bg-gray-200'
                                        } relative inline-flex h-6 w-11 items-center rounded-full`}
                                    >
                                        <span
                                            className={`${
                                                twoFactorEnabled
                                                    ? 'translate-x-6'
                                                    : 'translate-x-1'
                                            } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                                        />
                                    </Switch>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[16px] md:text-[18px] font-medium text-gray-700">
                                    Connect Telegram
                                </label>
                                <div className="mt-1 flex justify-between items-center">
                                    <div>
                                        <span className="text-red-500">
                                            Not connected
                                        </span>
                                        <span className="text-green-500 ml-1">
                                            (Connect with Telegram now)
                                        </span>
                                    </div>
                                    <button className="text-blue-500 hover:text-blue-600">
                                        <Image
                                            src="/images/telegram.svg"
                                            width={32}
                                            height={32}
                                            alt="Telegram"
                                            className="text-blue-500"
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Login History Section */}
                        <h2 className="text-[16px] md:text-[18px] font-medium text-gray-700 mb-[30px] mt-[30px]">
                            Login History
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <div className="flex flex-col gap-[10px]">
                                    <div className="flex gap-2">
                                        <span className="bg-[#33A959] text-white text-[12px] md:text-[14px] px-2 py-1">
                                            13-02-2025 04:36
                                        </span>
                                        <span className="bg-[#F3A638] text-white text-[12px] md:text-[14px] px-2 py-1">
                                            IP: 42.118.241.48
                                        </span>
                                    </div>
                                    <p className="text-[14px] md:text-[16px] text-gray-700">
                                        Device: 42.118.241.48
                                    </p>
                                </div>
                            </div>

                            <div>
                                <div className="flex flex-col gap-1">
                                    <div className="flex gap-2">
                                        <span className="bg-[#33A959] text-white text-[12px] md:text-[14px] px-2 py-1">
                                            10-02-2025 06:59
                                        </span>
                                        <span className="bg-[#F3A638] text-white text-[12px] md:text-[14px] px-2 py-1">
                                            IP: 118.68.182.102
                                        </span>
                                    </div>
                                    <p className="text-[14px] md:text-[16px] text-gray-700">
                                        Device: 118.68.182.102
                                    </p>
                                </div>
                            </div>

                            <div>
                                <div className="flex flex-col gap-1">
                                    <div className="flex gap-2">
                                        <span className="bg-[#33A959] text-white text-[12px] md:text-[14px] px-2 py-1">
                                            10-02-2025 03:27
                                        </span>
                                        <span className="bg-[#F3A638] text-white text-[12px] md:text-[14px] px-2 py-1">
                                            IP: 118.68.182.102
                                        </span>
                                    </div>
                                    <p className="text-[14px] md:text-[16px] text-gray-700">
                                        Device: 118.68.182.102
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
