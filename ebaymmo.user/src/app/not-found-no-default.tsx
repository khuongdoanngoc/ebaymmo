import Link from 'next/link';
import Image from 'next/image';
import ICON from '@images/404-icon.svg';
import Background from '@images/404-background.svg';
import DefaultLayout from './(default)/layout';
import Button from '@/components/BaseUI/Button/button';

export default function NotFound() {
    return (
        <div className="w-full h-screen relative overflow-hidden">
            <div className="h-full px-10 w-full flex bg-white items-center justify-center gap-[58px]">
                <Image
                    src={ICON}
                    width={537}
                    priority
                    alt="background"
                    className="z-20"
                />
                <div className="flex flex-col z-20 justify-center gap-5 max-w-[557px]">
                    <h1 className="text-[120px] font-extrabold leading-[168px] text-[#F15959]">
                        404!
                    </h1>
                    <p className="text-[24px] font-extrabold leading-[140%] text-[#1C1C1C]">
                        Page not found
                    </p>
                    <p className="text-[16px] font-medium leading-[160%] text-[#292B2E]">
                        The content may not exist or has been deleted, please go
                        back to the previous page or access a different link
                    </p>
                    <Link href="/">
                        <Button width="fit-content">Back to home</Button>
                    </Link>
                </div>
            </div>
            <Image
                src={Background}
                alt="background"
                className="absolute top-0 z-10 fill-green-800 opacity-80 blur-[125px]"
            />
        </div>
    );
}
