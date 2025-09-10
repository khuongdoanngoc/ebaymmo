import { useEffect, useRef } from 'react';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Paragraph from '@editorjs/paragraph';
import Table from '@editorjs/table';
import Checklist from '@editorjs/checklist';
import Image from '@editorjs/image';
import { useUploadAvatar } from '@/hooks/useUploadAvatar';
import { useSession } from 'next-auth/react';

interface EditorProps {
    value?: string;
    onChange?: (content: string) => void;
}

const Editor = ({ value, onChange }: EditorProps) => {
    const { uploadAvatar } = useUploadAvatar();
    const { data: session } = useSession();
    const editorRef = useRef<any>(null);
    const holderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let editor: any = null;

        const initEditor = async () => {
            if (!holderRef.current || !session?.user?.id) return;

            editor = new EditorJS({
                holder: holderRef.current,
                tools: {
                    header: Header,
                    paragraph: Paragraph,
                    list: List,
                    checklist: Checklist,
                    table: Table,
                    image: {
                        class: Image as any,
                        config: {
                            uploader: {
                                async uploadByFile(file: File) {
                                    try {
                                        const url = await uploadAvatar(
                                            file,
                                            session.user.id
                                        );
                                        return {
                                            success: 1,
                                            file: {
                                                url
                                            }
                                        };
                                    } catch (error) {
                                        console.error('Upload failed:', error);
                                        return {
                                            success: 0,
                                            file: {
                                                url: ''
                                            }
                                        };
                                    }
                                }
                            }
                        }
                    }
                },
                data: {
                    time: new Date().getTime(),
                    blocks: value ? JSON.parse(value) : []
                },
                onChange: async () => {
                    try {
                        const outputData = await editor.save();
                        onChange?.(JSON.stringify(outputData.blocks));
                    } catch (error) {
                        console.error('Save failed:', error);
                    }
                }
            });

            await editor.isReady;
            editorRef.current = editor;
        };

        initEditor();

        return () => {
            if (editor && typeof editor.destroy === 'function') {
                editor.destroy();
                editorRef.current = null;
            }
        };
    }, [session?.user?.id]);

    return (
        <div className="border border-[#7B7B7B] rounded-[12px] overflow-hidden">
            <div className="min-h-[200px] p-4 editor-container" ref={holderRef}>
                <style jsx global>{`
                    .editor-container h1 {
                        font-size: 2em;
                        font-weight: bold;
                    }
                    .editor-container h2 {
                        font-size: 1.5em;
                        font-weight: bold;
                    }
                    .editor-container h3 {
                        font-size: 1.17em;
                        font-weight: bold;
                    }
                    .editor-container table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 1em 0;
                        border: 2px solid #ff0f0f;
                    }
                    .editor-container td,
                    .editor-container th {
                        border: 1px solid #333;
                        padding: 12px;
                        background: #fff;
                    }
                    .editor-container th {
                        background: #f5f5f5;
                        font-weight: bold;
                    }
                    .editor-container tr:hover td {
                        background: #f9f9f9;
                    }
                    .editor-container .cdx-checklist__item {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .editor-container ul {
                        list-style-type: disc;
                        padding-left: 20px;
                    }
                    .editor-container ol {
                        list-style-type: decimal;
                        padding-left: 20px;
                    }
                `}</style>
            </div>
        </div>
    );
};

export default Editor;
