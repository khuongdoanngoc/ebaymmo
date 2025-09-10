interface InputWrapperProps {
    label: string;
    children: React.ReactNode;
}

const InputWrapper = ({ label, children }: InputWrapperProps) => {
    return (
        <div className="relative mt-2">
            <label className="absolute top-[-13px] left-3 bg-white px-2 text-[#3F3F3F] font-medium leading-6 z-10">
                {label}
            </label>
            <div className="w-full">{children}</div>
        </div>
    );
};

export default InputWrapper;
