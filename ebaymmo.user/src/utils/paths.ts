/**
 * Path aliases for imports
 *
 * This file provides constants for import paths to make imports more consistent
 * and easier to manage. Use these constants instead of string literals for imports.
 *
 * Example usage:
 * ```tsx
 * import { Button } from '@/components/ui/Button';
 * ```
 */

// Components
export const COMPONENTS = {
    // UI Components
    UI: {
        BUTTON: '@/components/ui/Button',
        FORM: '@/components/ui/Form',
        INPUT: '@/components/ui/Input',
        MODAL: '@/components/ui/Modal',
        TABLE: '@/components/ui/Table',
        PAGINATION: '@/components/ui/Pagination',
        SELECT: '@/components/ui/Select',
        CHECKBOX: '@/components/ui/Checkbox',
        SWITCH: '@/components/ui/Switch',
        DATEPICKER: '@/components/ui/DatePicker',
        EDITOR: '@/components/ui/Editor'
    },

    // Feature Components
    FEATURES: {
        PRODUCT: '@/components/features/Product',
        ORDER: '@/components/features/Order',
        REVIEW: '@/components/features/Review'
    },

    // Layout Components
    LAYOUT: {
        HEADER: '@/components/layout/Header',
        FOOTER: '@/components/layout/Footer',
        SIDEBAR: '@/components/layout/Sidebar'
    },

    // Common Components
    COMMON: {
        SEARCH_BAR: '@/components/common/SearchBar',
        PAGINATION: '@/components/common/Pagination',
        FILTER_TAGS: '@/components/common/FilterTags'
    }
};

// Hooks
export const HOOKS = {
    USE_FORM: '@/hooks/useForm',
    USE_MODAL: '@/hooks/useModal',
    USE_PAGINATION: '@/hooks/usePagination'
};

// Utils
export const UTILS = {
    FORMAT: '@/utils/format',
    VALIDATION: '@/utils/validation',
    API: '@/utils/api'
};

// Constants
export const CONSTANTS = {
    ROUTES: '@/constants/routes',
    API_ENDPOINTS: '@/constants/apiEndpoints',
    MESSAGES: '@/constants/messages'
};

// Types
export const TYPES = {
    COMMON: '@/types/common',
    API: '@/types/api',
    MODELS: '@/types/models'
};
