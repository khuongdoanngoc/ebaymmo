import React from 'react';

/**
 * Interface for ComponentTemplate props
 */
export interface ComponentTemplateProps {
    /** Primary content or children */
    children?: React.ReactNode;
    /** Additional CSS class names */
    className?: string;
    /** Optional click handler */
    onClick?: () => void;
    // Add other props as needed
}

/**
 * ComponentTemplate - A template for creating new components
 *
 * Usage example:
 * ```tsx
 * <ComponentTemplate className="custom-class">Content</ComponentTemplate>
 * ```
 */
export const ComponentTemplate: React.FC<ComponentTemplateProps> = ({
    children,
    className = '',
    onClick,
    ...props
}) => {
    return (
        <div
            className={`component-template ${className}`}
            onClick={onClick}
            {...props}
        >
            {children}
        </div>
    );
};

export default ComponentTemplate;
