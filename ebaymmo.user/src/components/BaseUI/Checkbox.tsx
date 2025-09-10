'use client';
import { Checkbox as CheckboxHeadless } from '@headlessui/react';
import { forwardRef } from 'react';

interface ICheckboxProps {
    content: string;
    onChange?: (checked: boolean) => void;
    checked?: boolean;
}

const Checkbox = forwardRef<HTMLInputElement, ICheckboxProps>((props, ref) => {
    const { content, onChange, checked } = props;

    return (
        <div className="flex gap-1 items-center">
            <CheckboxHeadless
                checked={checked}
                onChange={onChange}
                className="group block size-4 rounded border-2 border-primary-500 bg-white data-[checked]:bg-primary-500 h-[20px] w-[20px]"
            >
                <svg
                    className="stroke-white opacity-0 group-data-[checked]:opacity-100"
                    viewBox="0 0 14 14"
                    fill="none"
                >
                    <path
                        d="M3 8L6 11L11 3.5"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </CheckboxHeadless>
            <label className="pl-[12px] text-black">{content}</label>
            <input
                type="checkbox"
                className="hidden"
                ref={ref}
                onChange={(e) => onChange?.(e.target.checked)}
                checked={checked}
            />
        </div>
    );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;
