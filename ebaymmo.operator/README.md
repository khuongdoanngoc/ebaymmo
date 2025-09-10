# EbayMMO Admin Dashboard

A modern, responsive admin dashboard for EbayMMO built with React, TypeScript, Vite, and TailwindCSS.

## Features

- 🚀 Built with Vite for fast development and optimized production builds
- 🔥 Modern React with TypeScript for type safety
- 💅 TailwindCSS for utility-first styling
- 📱 Fully responsive design with mobile-friendly bottom navigation
- 🌙 Light and dark mode support
- 📊 Dashboard with key metrics and statistics
- 📦 Product management
- 🛒 Order management
- 👥 Customer management
- ⚙️ Settings and preferences
- 📱 PWA (Progressive Web App) support for offline functionality

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone [your-repo-url]
cd shop3.admin
```

2. Install dependencies:

```bash
npm install
# or
yarn
```

3. Start the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Building for Production

```bash
npm run build
# or
yarn build
```

The build output will be in the `dist` directory.

## PWA Support

This application is configured as a Progressive Web App (PWA), which means:

- It can be installed on mobile devices and desktops
- It works offline or with a poor internet connection
- It loads quickly and reliably

To test the PWA functionality, build the app for production and serve it:

```bash
npm run build
npm run preview
```

## Project Structure

```
shop3.admin/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable components
│   ├── pages/           # Page components
│   ├── lib/             # Utility functions and helpers
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles
├── index.html           # HTML template
├── tailwind.config.js   # Tailwind CSS configuration
└── vite.config.ts       # Vite configuration
```

## Customization

### Theme

The application supports light and dark themes. You can modify the theme colors in `src/index.css`.

### Layout

The layout includes a responsive sidebar for desktop and a bottom navigation for mobile. You can customize the navigation items in `src/components/Layout.tsx`.

## License

[MIT](LICENSE)

# shop3.operator
