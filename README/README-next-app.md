# Next.js App Configuration

This application is built using Next.js 13+ with the App Router, incorporating modern React patterns and best practices.

## Framework & Core Technologies

- **Next.js**: Version 13+ using the new App Router
- **React**: Latest version with Server Components
- **TypeScript**: For type safety and better developer experience
- **Tailwind CSS**: For utility-first styling
- **shadcn/ui**: For pre-built, customizable UI components

## Project Structure

```
src/
├── app/                    # App Router directory
│   ├── (auth)/            # Auth-related routes
│   ├── api/               # API routes
│   ├── error.js           # Error boundary
│   ├── global-error.js    # Global error handler
│   ├── layout.js          # Root layout
│   ├── not-found.js       # 404 handler
│   └── page.js            # Home page
├── components/            # Reusable components
├── lib/                   # Utility functions and configurations
│   ├── firebase/         # Firebase configuration
│   └── utils/            # Helper functions
├── pages/                 # Special Next.js pages (e.g., _document.js)
└── styles/               # Global styles
```

## Key Features

### Server Components
- Uses React Server Components by default
- Client components marked with 'use client' directive
- Optimized for performance with selective hydration

### Routing
- App Router for file-system based routing
- Dynamic routes with [...slug] and [[...slug]] patterns
- Route groups with (folder) syntax
- Parallel routes and intercepting routes supported

### Data Fetching
- Server-side data fetching in Server Components
- Route Handlers for API endpoints
- Server Actions for form handling and mutations

### Authentication
- Firebase Authentication integration
- Protected routes and middleware
- OAuth with Google sign-in
- Scope-based permissions

### Error Handling
- Custom error pages (404, 500)
- Error boundaries for component-level errors
- Global error handling
- Development-friendly error messages

### Styling
- Tailwind CSS for utility-first styling
- CSS Modules support for component-specific styles
- Global styles in app/globals.css
- Dark mode support

## Environment Configuration

Required environment variables:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
NEXT_PUBLIC_BASE_URL=
```

## Development Tools

- **ESLint**: For code linting
- **Prettier**: For code formatting
- **Husky**: For git hooks
- **lint-staged**: For pre-commit linting

## Build Configuration

- Output: Standalone server
- Target: Server-side rendering
- Image Optimization: Next.js Image component
- Font Optimization: Next.js Font system

## Performance Optimizations

- Automatic code splitting
- Image optimization with next/image
- Font optimization with next/font
- Static generation for applicable routes
- Dynamic imports for code splitting

## Security Features

- Headers configuration in next.config.js
- CSP policies
- CORS configuration
- Environment variable validation
- API route protection

## Deployment

The application is configured for deployment on various platforms:
- Vercel (optimized)
- Docker containers
- Traditional Node.js hosting

## Development Workflow

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Start production server:
   ```bash
   npm start
   ```

## Best Practices

- Use Server Components by default
- Client Components only when needed (interactivity/hooks)
- Implement proper error boundaries
- Follow Next.js metadata API for SEO
- Use Next.js Image and Font components
- Implement proper loading states
- Use route groups for organization

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Server Components](https://nextjs.org/docs/getting-started/react-essentials#server-components)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
