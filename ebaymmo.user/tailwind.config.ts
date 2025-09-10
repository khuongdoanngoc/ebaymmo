import type { Config } from 'tailwindcss';

const colors = {
    neutral: {
        600: '#000000',
        500: '#1C1C1C',
        400: '#3F3F3F',
        300: '#6C6C6C',
        200: '#9C9C9C',
        100: '#D0D0D0',
        90: '#E6E6E6',
        75: '#F7F7F7',
        50: '#FFFFFF',
        4: '#8894AA'
    },
    primary: {
        600: '#248C46',
        500: '#33A959',
        400: '#40C96D',
        300: '#6EEC97',
        200: '#B9F7CD',
        100: '#E8FFEF'
    },
    secondary: {
        600: '#D33E3E',
        500: '#F15959',
        400: '#FF7272',
        300: '#FAA0A0',
        200: '#FFD7D7',
        100: '#FFF1F1'
    },
    sellerBlue: '#47A8DF',
    starYellow: '#F8E008',
    badgeWarning: '#e2da035e',
    badgeWarningText: '#EBC608'
};

export default {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}'
    ],
    theme: {
        extend: {
            screens: {
                md: '768px',
                lg: '1024px'
            },
            colors: {
                'Neutral-300': '#6C6C6C',
                'main-gradio':
                    'linear-gradient(90deg, #2c995e 0%, #36b555 75%)',
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                green_main: '#33A959',
                'modal-bg': 'var(--background-modal)',
                border_color: '#E1E1E1',
                bg_search: '#F7F7F7',
                ...colors
            },
            fontFamily: {
                beausans: ['var(--font-beausans)'],
                beausans2: ['"BT Beau Sans"', 'sans-serif']
            },
            backgroundImage: {
                'modal-content-bg': 'var(--background-modal-content)',
                'main-gradio':
                    'linear-gradient(90deg, #2c995e 0%, #36b555 75%)',
                'text-gradient':
                    'linear-gradient(90deg, #2C995E 0%, #36B555 75%)',
                'slogan-homepage':
                    'linear-gradient(320deg, rgba(255, 255, 255, 0.00) 23.27%, rgba(110, 236, 151, 0.90) 85.13%)',
                'sub-gradio': 'linear-gradient(90deg, #D33E3E 0%, #F15959 75%)',
                'sub-gradio2':
                    'linear-gradient(266deg, #F15959 -6.72%, #D33E3E 89.03%)'
            },

            // animation configs
            keyframes: {
                scaleEffect: {
                    '0%': { transform: 'scale(0.7)' },
                    '45%': { transform: 'scale(1.05)' },
                    '80%': { transform: 'scale(0.95)' },
                    '100%': { transform: 'scale(1)' }
                },
                slideIn: {
                    '0%': { transform: 'translateX(-100%)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' }
                },
                slideInSlow: {
                    '0%': { transform: 'translateX(100%)', opacity: '0' },
                    '20%': { transform: 'translateX(80%)', opacity: '0.3' },
                    '60%': { transform: 'translateX(20%)', opacity: '0.7' },
                    '100%': { transform: 'translateX(0)', opacity: '1' }
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' }
                },
                slideFromLeft: {
                    '0%': { transform: 'translateX(-100%)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' }
                },
                slideFromRight: {
                    '0%': { transform: 'translateX(100%)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' }
                },
                messageSlideIn: {
                    '0%': {
                        transform: 'translateY(20px)',
                        opacity: '0'
                    },
                    '100%': {
                        transform: 'translateY(0)',
                        opacity: '1'
                    }
                }
            },
            animation: {
                scaleBounce: 'scaleEffect 0.3s ease-in-out',
                slideIn: 'slideIn 0.8s ease-out forwards',
                slideInSlow:
                    'slideInSlow 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                fadeIn: 'fadeIn 0.3s ease-in-out',
                slideFromLeft: 'slideFromLeft 0.3s ease-out',
                slideFromRight: 'slideFromRight 0.3s ease-out',
                messageIn: 'messageSlideIn 0.5s ease-out forwards'
            }
        },
        screens: {
            sm: '640px', // Mobile
            md: '768px',
            lg: '1024px'
        }
    },
    plugins: []
} satisfies Config;
