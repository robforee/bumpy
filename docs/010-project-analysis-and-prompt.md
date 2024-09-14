# Updated Project Analysis and Prompt

## Software Libraries and Versions

1. Next.js (v14.2.3) - React framework for server-side rendering and static site generation
2. React (v18.3.1) - JavaScript library for building user interfaces
3. Firebase (v10.11.1) - Platform for building web and mobile applications
4. Firebase Admin (v12.1.0) - Server-side Firebase SDK
5. React Markdown (v9.0.1) - Markdown component for React
6. Server-only (v0.0.1) - Utility for server-side only code
7. Google Generative AI (v0.10.0) - Library for interacting with Google's generative AI models
8. Google APIs Node.js Client (vX.X.X) - Official Node.js client library for Google APIs

## Design Patterns Used

1. Server-side Rendering (SSR) - Utilized through Next.js for improved performance and SEO
2. Component-based Architecture - React components are used throughout the application
3. Hooks - React hooks (useState, useEffect) are used for state management and side effects
4. Server Actions - Next.js server actions are used for server-side operations
5. Service Worker - Custom service worker for handling Firebase authentication
6. Modular File Structure - Separation of concerns with different files for actions, components, and Firebase configurations
7. OAuth 2.0 Server-Side Flow - Used for long-term access to Google services like Gmail
8. API Gateway Pattern - Server-side endpoints act as a gateway for client requests to external services

## Authentication Scheme

1. Firebase Authentication - Used for user sign-in and management
2. Google Sign-In - Implemented as the primary authentication method
3. Custom Token Handling - Service worker manages Firebase ID tokens and Installation tokens. Server-side storage and management of OAuth refresh tokens.
4. Server-side Authentication - getAuthenticatedAppForUser function in serverApp.js handles server-side auth
5. Role-based Access Control - Firestore rules implement basic access control based on user authentication
6. OAuth 2.0 Integration - Used for obtaining and managing long-lived access to Google services

# LLM Modification Prompt

When modifying this application, please consider the following guidelines:

1. Next.js and React:
   - Maintain the server-side rendering approach using Next.js
   - Keep components modular and follow React best practices
   - Utilize React hooks for state management and side effects
   - Be aware of the distinction between client and server components

2. Firebase Integration:
   - Maintain the separation between client-side and server-side Firebase initialization
   - Be cautious when modifying Firebase security rules (firestore.rules and storage.rules)
   - Ensure any new Firestore collections or documents are properly secured
   - Maintain the custom service worker (auth-service-worker.js) for handling Firebase authentication
   - Implement secure storage and retrieval of OAuth refresh tokens in Firestore

3. Authentication:
   - Keep using Firebase Authentication with Google Sign-In
   - Ensure proper token handling in both client-side and server-side code
   - Maintain the separation of concerns between authentication and data access
   - Maintain the OAuth 2.0 server-side flow for Google services access
   - Ensure proper handling and storage of refresh tokens

4. API and Server Actions:
   - Use Next.js server actions for server-side operations
   - Ensure proper error handling and logging in server actions
   - Maintain the separation between client-side and server-side API calls
   - Implement server-side endpoints for proxying requests to external services like Gmail
   - Ensure proper authentication and authorization checks before accessing user data

5. UI and Styling:
   - Maintain consistency with the existing UI components
   - Use CSS modules for component-specific styling
   - Consider accessibility when making UI changes

6. Data Handling:
   - Follow the established patterns for reading from and writing to Firestore
   - Maintain proper data validation and sanitization
   - Be mindful of real-time updates and their impact on performance
   - Implement secure storage and retrieval of OAuth refresh tokens
   - Handle potential issues with token expiration or revocation

7. Environment and Configuration:
   - Keep sensitive information in environment variables
   - Update the apphosting.yaml file if new environment variables are added

8. Performance:
   - Be mindful of unnecessary re-renders in React components
   - Optimize Firebase queries and limit the amount of data fetched
   - Utilize Next.js features like dynamic imports for code splitting
   - Consider implementing background jobs for periodic email checking or processing
   - Be mindful of rate limits when interacting with external APIs

9. Testing:
   - Although not explicitly present in the current project, consider adding unit tests for new functionality
   - Test both client-side and server-side code thoroughly

10. Documentation:
    - Update comments and documentation for any new or modified functionality
    - Maintain clear and concise variable and function names

11. External API Integration:
    - Use the Google APIs Node.js Client for server-side interactions with Gmail API
    - Implement proper error handling and rate limiting for external API calls
    - Consider implementing a caching mechanism for frequently accessed data
    - Ensure all API keys and credentials are properly secured and not exposed to the client

When making modifications, ensure that you maintain the existing architecture and patterns while improving or extending functionality. Always consider the security implications of any changes, especially when dealing with authentication and data access.
