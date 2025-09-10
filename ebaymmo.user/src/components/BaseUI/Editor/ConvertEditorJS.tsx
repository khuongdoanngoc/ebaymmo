'use client';
import { useEffect, useState } from 'react';

interface EditorJSComponentProps {
    data: string | any[];
}

const ReadOnlyEditor = ({ data }: EditorJSComponentProps) => {
    const [html, setHtml] = useState<string>('');

    const generateHTML = (blocks: any[]) => {
        return blocks
            .map((block) => {
                switch (block.type) {
                    case 'header':
                        return `<h${block.data.level} class="text-2xl font-bold mb-4">${block.data.text}</h${block.data.level}>`;

                    case 'paragraph':
                        return `<p class="mb-4">${block.data.text}</p>`;

                    case 'list':
                        const listItems = block.data.items
                            .map(
                                (item: string) =>
                                    `<li class="ml-4">${item}</li>`
                            )
                            .join('');
                        return block.data.style === 'ordered'
                            ? `<ol class="list-decimal mb-4">${listItems}</ol>`
                            : `<ul class="list-disc mb-4">${listItems}</ul>`;

                    case 'checklist':
                        const checklistItems = block.data.items
                            .map(
                                (item: any) => `
                            <div class="flex items-center gap-2 mb-2">
                                <input type="checkbox" ${item.checked ? 'checked' : ''} disabled>
                                <span>${item.text}</span>
                            </div>
                        `
                            )
                            .join('');
                        return `<div class="mb-4">${checklistItems}</div>`;

                    case 'image':
                        return `
                        <div class="my-4">
                            <img src="${block.data.file.url}" 
                                alt="${block.data.caption || ''}" 
                                class="max-w-[500px] h-[400px] rounded-lg"
                            />
                            ${
                                block.data.caption
                                    ? `<p class="text-center text-gray-500 mt-2">${block.data.caption}</p>`
                                    : ''
                            }
                        </div>
                    `;

                    case 'table':
                        const rows = block.data.content
                            .map(
                                (row: string[]) =>
                                    `<tr>${row
                                        .map(
                                            (cell) =>
                                                `<td class="border border-gray-300 p-2">${cell}</td>`
                                        )
                                        .join('')}</tr>`
                            )
                            .join('');
                        return `
                        <div class="overflow-x-auto my-4">
                            <table class="min-w-full border-collapse border border-gray-300">
                                <tbody>${rows}</tbody>
                            </table>
                        </div>
                    `;

                    default:
                        return '';
                }
            })
            .join('');
    };

    useEffect(() => {
        if (data) {
            try {
                const blocks =
                    typeof data === 'string' ? JSON.parse(data) : data;

                const finalHtml = generateHTML(blocks);

                setHtml(finalHtml);
            } catch (error) {
                console.error('Error parsing editor data:', error);
            }
        }
    }, [data]);

    return (
        <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};

export default ReadOnlyEditor;
