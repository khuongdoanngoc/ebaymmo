import { useState } from 'react';

interface RichTextEditorProps {
    value?: string;
    onChange?: (value: string) => void;
}

const RichTextEditor = ({ value, onChange }: RichTextEditorProps) => {
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);

    const handleFormat = (command: string) => {
        document.execCommand(command, false);
        switch (command) {
            case 'bold':
                setIsBold(!isBold);
                break;
            case 'italic':
                setIsItalic(!isItalic);
                break;
            case 'underline':
                setIsUnderline(!isUnderline);
                break;
        }
    };

    return (
        <div className="border rounded-lg">
            <div className="border-b p-2 flex gap-2">
                <button
                    className={`p-2 rounded hover:bg-gray-100 ${isBold ? 'bg-gray-200' : ''}`}
                    onClick={() => handleFormat('bold')}
                >
                    B
                </button>
                <button
                    className={`p-2 rounded hover:bg-gray-100 ${isItalic ? 'bg-gray-200' : ''}`}
                    onClick={() => handleFormat('italic')}
                >
                    I
                </button>
                <button
                    className={`p-2 rounded hover:bg-gray-100 ${isUnderline ? 'bg-gray-200' : ''}`}
                    onClick={() => handleFormat('underline')}
                >
                    U
                </button>
                <span className="w-px bg-gray-300 mx-2" />
                <button
                    className="p-2 rounded hover:bg-gray-100"
                    onClick={() => handleFormat('insertUnorderedList')}
                >
                    <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                    >
                        <path
                            d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            </div>
            <div
                className=" min-h-[200px] outline-none"
                contentEditable
                onInput={(e) => onChange?.(e.currentTarget.innerHTML)}
                dangerouslySetInnerHTML={{ __html: value || '' }}
            />
        </div>
    );
};

export default RichTextEditor;
