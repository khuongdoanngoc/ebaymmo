import Button from '@/components/BaseUI/Button/button';
import Image from 'next/image';

interface ErrorStateProps {
    message: string;
}

export default function ErrorState({ message }: ErrorStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-10">
            <Image
                src="/images/close.png"
                alt="error"
                width={200}
                height={200}
            />
            <h3 className="text-xl font-medium text-neutral-700 mt-4">
                Oops! Something went wrong
            </h3>
            <p className="text-neutral-500 mt-2">{message}</p>
            <Button
                onClick={() => window.location.reload()}
                colorScheme="red"
                width="fit-content"
                className="mt-4"
            >
                Try Again
            </Button>
        </div>
    );
}
