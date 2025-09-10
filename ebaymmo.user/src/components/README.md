# Components Directory

This directory contains all the reusable UI components for the application. The components are organized into the following categories:

## Directory Structure

- **ui/**: Base UI components (formerly BaseUI)

    - Button, Form, Input, Modal, Table, etc.
    - These are the foundational UI components used throughout the application.

- **features/**: Feature-specific components

    - Product, Order, Review, etc.
    - Components that are specific to a particular feature or domain.

- **layout/**: Layout components

    - Header, Footer, Sidebar, etc.
    - Components that define the overall layout of the application.

- **common/**: Common components used across features
    - SearchBar, Pagination, etc.
    - Components that are used in multiple features but aren't basic UI elements.

## Component Structure

Each component should follow this structure:

```tsx
/ComponentName/
  ├── index.ts         # Exports the component
  ├── ComponentName.tsx # Main component file
  ├── ComponentName.test.tsx # Tests (optional)
  ├── ComponentName.module.css # Styles (if not using Tailwind)
  └── types.ts         # Type definitions (if complex)
```

## Best Practices

1. **Component Naming**:

    - Use PascalCase for component names (e.g., `Button`, `ProductCard`).
    - Use descriptive names that indicate the component's purpose.

2. **Props**:

    - Define prop interfaces with descriptive names.
    - Use TypeScript for type safety.
    - Document props with JSDoc comments.

3. **Styling**:

    - Use Tailwind CSS for styling.
    - For complex components, consider using CSS modules.

4. **Exports**:

    - Export components as named exports.
    - Also provide a default export for convenience.

5. **Documentation**:
    - Add JSDoc comments to describe the component and its props.
    - Include usage examples for complex components.

## Example Component

```tsx
import React from 'react';

export interface ButtonProps {
    /** Button content */
    children: React.ReactNode;
    /** Button variant */
    variant?: 'primary' | 'secondary';
    /** Click handler */
    onClick?: () => void;
}

/**
 * Button component with different variants
 */
export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    onClick
}) => {
    return (
        <button
            className={`btn ${variant === 'primary' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={onClick}
        >
            {children}
        </button>
    );
};

export default Button;
```
