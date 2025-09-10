/* eslint-disable */

declare module '@editorjs/header' {
    import { BlockTool, API, BlockToolData } from '@editorjs/editorjs';
    export default class Header implements BlockTool {
        constructor(data: BlockToolData);
        save(block: HTMLElement): object;
        render(): HTMLElement;
        validate(savedData: any): boolean;
        static get toolbox(): { icon: string; title: string };
    }
}

declare module '@editorjs/list' {
    import { BlockTool, API, BlockToolData } from '@editorjs/editorjs';
    export default class List implements BlockTool {
        constructor(data: BlockToolData);
        save(block: HTMLElement): object;
        render(): HTMLElement;
        validate(savedData: any): boolean;
        static get toolbox(): { icon: string; title: string };
    }
}

declare module '@editorjs/paragraph' {
    import { BlockTool, API, BlockToolData } from '@editorjs/editorjs';
    export default class Paragraph implements BlockTool {
        constructor(data: BlockToolData);
        save(block: HTMLElement): object;
        render(): HTMLElement;
        validate(savedData: any): boolean;
        static get toolbox(): { icon: string; title: string };
    }
}

declare module '@editorjs/table' {
    import { BlockTool, BlockToolData } from '@editorjs/editorjs';
    export default class Table implements BlockTool {
        constructor(data: BlockToolData);
        save(block: HTMLElement): object;
        render(): HTMLElement;
        validate(savedData: any): boolean;
        static get toolbox(): { icon: string; title: string };
    }
}

declare module '@editorjs/checklist' {
    import { BlockTool, BlockToolData } from '@editorjs/editorjs';
    export default class Checklist implements BlockTool {
        constructor(data: BlockToolData);
        save(block: HTMLElement): object;
        render(): HTMLElement;
        validate(savedData: any): boolean;
        static get toolbox(): { icon: string; title: string };
    }
}

declare module '@editorjs/image' {
    import {
        BlockTool,
        API,
        BlockToolData,
        ToolConfig
    } from '@editorjs/editorjs';

    interface ImageConfig extends ToolConfig {
        uploader?: {
            uploadByFile(
                file: File
            ): Promise<{ success: number; file: { url: string } }>;
        };
    }

    interface ImageData {
        caption?: string;
        withBorder?: boolean;
        withBackground?: boolean;
        stretched?: boolean;
        file: {
            url: string;
        };
    }

    export default class Image implements BlockTool {
        constructor({
            data,
            config,
            api,
            readOnly
        }: {
            data: ImageData;
            config?: ImageConfig;
            api: API;
            readOnly: boolean;
        });
        save(block: HTMLElement): Promise<ImageData>;
        render(): HTMLElement;
        validate(savedData: ImageData): boolean;
        static get toolbox(): { icon: string; title: string };
    }
}
