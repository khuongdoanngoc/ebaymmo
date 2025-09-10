import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { options } from '../_constants';

interface SorterProps {
    selectedOption: string;
    setSelectedOption: React.Dispatch<React.SetStateAction<string>>;
    updateFilter: (name: string, value: any) => void;
}

export default function Sorter({
    selectedOption,
    setSelectedOption,
    updateFilter
}: SorterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="filter relative py-9 lg:pt-[50px] lg:pb-[100px]">
            <div
                className="w-full lg:w-[262px] px-[25px] py-[15px] rounded-[10px] bg-white shadow-[0px_2px_10px_0px_rgba(0,65,10,0.10)] lg:absolute right-0 flex items-center justify-between cursor-pointer"
                ref={dropdownRef}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="text-neutral-500 text-[18px] font-medium leading-[28.8px]">
                    {selectedOption}
                </span>
                <Image
                    src="/images/arrow-down-filter.svg"
                    alt="dropdown"
                    width={20}
                    height={20}
                    className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </div>

            {isOpen && (
                <div className="absolute right-0 top-[108px] w-[262px] bg-white rounded-[8px] border border-neutral-200 py-[10px] shadow-lg z-10">
                    {options.map(
                        (option, index) =>
                            option !== selectedOption && (
                                <div
                                    key={index}
                                    className="mx-[10px] flex items-center gap-[10px] hover:bg-[#E8FFEF] cursor-pointer text-neutral-500 text-[18px] font-medium leading-[28.8px] px-[21px] py-[14px] hover:rounded-[7px]"
                                    onClick={() => {
                                        setSelectedOption(option);
                                        updateFilter(
                                            'filter',
                                            option === 'Sort' ? '' : option
                                        );
                                        setIsOpen(false);
                                    }}
                                >
                                    {option}
                                </div>
                            )
                    )}
                </div>
            )}
        </div>
    );
}
