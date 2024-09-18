# Project Analysis

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

3. Authentication:
   - Keep using Firebase Authentication with Google Sign-In
   - Ensure proper token handling in both client-side and server-side code
   - Maintain the separation of concerns between authentication and data access

4. API and Server Actions:
   - Use Next.js server actions for server-side operations
   - Ensure proper error handling and logging in server actions
   - Maintain the separation between client-side and server-side API calls

5. UI and Styling:
   - Maintain consistency with the existing UI components
   - Use CSS modules for component-specific styling
   - Consider accessibility when making UI changes

6. Data Handling:
   - Follow the established patterns for reading from and writing to Firestore
   - Maintain proper data validation and sanitization
   - Be mindful of real-time updates and their impact on performance

7. Environment and Configuration:
   - Keep sensitive information in environment variables
   - Update the apphosting.yaml file if new environment variables are added

8. Performance:
   - Be mindful of unnecessary re-renders in React components
   - Optimize Firebase queries and limit the amount of data fetched
   - Utilize Next.js features like dynamic imports for code splitting

9. Testing:
   - Although not explicitly present in the current project, consider adding unit tests for new functionality
   - Test both client-side and server-side code thoroughly

10. Documentation:
    - Update comments and documentation for any new or modified functionality
    - Maintain clear and concise variable and function names

When making modifications, ensure that you maintain the existing architecture and patterns while improving or extending functionality. Always consider the security implications of any changes, especially when dealing with authentication and data access.
