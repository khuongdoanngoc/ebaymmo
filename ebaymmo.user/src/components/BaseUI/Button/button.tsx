import React, { ButtonHTMLAttributes, ReactNode } from 'react';

// Define color mapping with types
type ColorScheme = 'green' | 'red' | 'white' | 'green2';

interface ColorConfig {
    fromColor: string;
    toColor: string;
    useGradient: boolean;
}

const colorMap: Record<ColorScheme, ColorConfig> = {
    green: { fromColor: '#2C995E', toColor: '#36B555', useGradient: true },
    red: { fromColor: '#D33E3E', toColor: '#F15959', useGradient: true },
    white: { fromColor: '#F4F4F4', toColor: '#F4F4F4', useGradient: false },
    green2: { fromColor: '#33A959', toColor: '#33A959', useGradient: false }
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    onClick?: () => void;
    className?: string;
    colorScheme?: ColorScheme;
    width?: string | number;
    notCircle?: boolean;
    disabled?: boolean;
}

/**
 * Button component with various color schemes and styles
 *
 * @param children - Button content
 * @param onClick - Click handler function
 * @param className - Additional CSS classes
 * @param type - Button type (default: 'button')
 * @param colorScheme - Color scheme (default: 'green')
 * @param width - Button width (default: '97px')
 * @param notCircle - Whether to use rectangular corners instead of rounded (default: false)
 */
export const Button: React.FC<ButtonProps> = ({
    children,
    onClick,
    className = '',
    type = 'button',
    colorScheme = 'green',
    width = '',
    notCircle = false,
    disabled = false,
    ...props
}) => {
    // Get color configuration from colorMap
    const { fromColor, toColor, useGradient } = colorMap[colorScheme];

    // Determine background style based on color scheme
    const backgroundStyle = disabled
        ? '#CCCCCC'
        : colorScheme === 'green2'
          ? `var(--Primary-500, ${fromColor})`
          : useGradient
            ? `linear-gradient(90deg, ${fromColor} 0%, ${toColor} 75%)`
            : fromColor;

    // Set text color based on background color
    const textColor = disabled
        ? '#666666'
        : colorScheme === 'white'
          ? '#000'
          : '#FFF';

    // Font styling for white background
    const fontStyle =
        colorScheme === 'white'
            ? {
                  fontFamily: '"BT Beau Sans"',
                  fontSize: '18px',
                  fontWeight: '400',
                  lineHeight: '160%'
              }
            : {};

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`
        flex px-[20px] py-[10px] justify-center items-center gap-[10px] 
        font-inter text-[14px] font-semibold leading-[160%] 
        transition cursor-pointer hover:brightness-90
        ${disabled ? '!cursor-not-allowed opacity-70' : ''}
        ${className}
      `}
            style={{
                width,
                background: backgroundStyle,
                borderRadius: notCircle ? '8px' : '86px',
                color: textColor,
                ...fontStyle
            }}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
