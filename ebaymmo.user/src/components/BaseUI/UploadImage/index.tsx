import { useState } from 'react';
import Image from 'next/image';

interface UploadImageProps {
    onChange?: (file: File) => void;
}

export function UploadImage({ onChange }: UploadImageProps) {
    const [preview, setPreview] = useState<string | null>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
            onChange?.(file);
        }
    };

    return (
        <div className="w-full min-h-[120px] border-2 border-dashed border-gray-300 rounded-lg p-4">
            <input
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*"
                id="store-image"
            />
            <label
                htmlFor="store-image"
                className="flex flex-col items-center cursor-pointer"
            >
                {preview ? (
                    <Image
                        src={preview}
                        alt="Preview"
                        width={200}
                        height={200}
                        className="object-cover"
                    />
                ) : (
                    <>
                        <Image
                            src="/images/cloud-upload.svg"
                            alt="Upload"
                            width={32}
                            height={32}
                        />
                        <span className="mt-2 text-gray-600">
                            Click to upload image
                        </span>
                    </>
                )}
            </label>
        </div>
    );
}
