/src
├── apis/ # API call utilities and configurations
├── app/ # Application pages and layouts
│ ├── (account)/ # Account-related pages
│ │ ├── layout.tsx # Layout for account-related pages
│ │ ├── ...pages # Other pages related to accounts
│ │
│ ├── (auth)/ # Authentication-related pages
│ │ ├── layout.tsx # Layout for authentication pages
│ │ ├── login # Login page
│ │ ├── page.tsx  
│ │ ├── register # Register page
│ │ ├── page.tsx  
│ │
│ ├── (default)/ # Default pages (main structure)
│ │ ├── layout.tsx # Main layout
│ │ ├── page.tsx # Main landing page
│ │ ├── ...pages # Other common pages
│ │
│ ├── favicon.ico # Project favicon
│ ├── globals.css # Global styles
│
├── components/ # Reusable UI components
│ ├── ui/ # Base UI components (renamed from BaseUI)
│ │ ├── Button/ # Button components
│ │ ├── Form/ # Form components
│ │ ├── Input/ # Input components
│ │ ├── Modal/ # Modal components
│ │ ├── Table/ # Table components
│ │ ├── ...
│ │
│ ├── features/ # Feature-specific components
│ │ ├── Product/ # Product-related components
│ │ ├── Order/ # Order-related components
│ │ ├── Review/ # Review-related components
│ │ ├── ...
│ │
│ ├── layout/ # Layout components
│ │ ├── Header/ # Header components
│ │ ├── Footer/ # Footer components
│ │ ├── Sidebar/ # Sidebar components
│ │ ├── ...
│ │
│ ├── common/ # Common components used across features
│ │ ├── SearchBar/ # Search bar components
│ │ ├── Pagination/ # Pagination components
│ │ ├── ...
│
├── contexts/ # Context API for global state management
├── guards/ # Route guards (authentication, authorization)
├── hooks/ # Custom React hooks
├── libs/ # Utility libraries and helpers
├── utils/ # Utility functions
├── types/ # TypeScript type definitions
├── constants/ # Constants and configuration values
├── store/ # Redux store configuration
├── graphql/ # GraphQL queries and mutations
├── generated/ # Generated code (GraphQL, etc.)
