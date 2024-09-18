# Authentication System: Comprehensive Security Overview

## 1. System Architecture

Our authentication system integrates Firebase Authentication with OAuth 2.0 for Gmail API access, utilizing service account impersonation for certain operations. This hybrid approach allows for secure user authentication while enabling authorized access to users' Gmail accounts and other Google services.

### Key Components:

1. Firebase Authentication: Primary user authentication mechanism
2. OAuth 2.0: Manages access to Google services (primarily Gmail)
3. Service Account Impersonation: Allows server-side operations on behalf of users
4. Token Management: Secure storage and refresh of OAuth tokens

## 2. Authentication Flows

### 2.1 User Authentication Flow

1. User initiates sign-in via Firebase Authentication (Google Sign-In)
2. Additional OAuth 2.0 scopes for Gmail and other services are requested
3. Upon successful authentication, access and refresh tokens are securely stored in Firestore

### 2.2 Service Account Impersonation Flow

1. For certain server-side operations, we use a service account to impersonate the user
2. The service account uses the user's stored refresh token to generate a new access token
3. This access token is then used to perform operations on behalf of the user

## 3. OAuth Scopes and Permissions

Currently requested scopes:
- `https://www.googleapis.com/auth/gmail.readonly`: Read-only access to Gmail
- `https://www.googleapis.com/auth/gmail.modify`: Read and modify (but not delete) Gmail messages
- `https://www.googleapis.com/auth/userinfo.email`: Access to user's email address

SECURITY CONSIDERATION: Regularly review these scopes to ensure we're adhering to the principle of least privilege.

Tokens are collected/stored/used in the following locations:
- auth.js : signInWithGoogle() : storeUserScopes()
- auth.js : signInWithGoogle() : sendTokensToBackend()
- /api/storeTokens : POST()

## 4. Token Management

- Access tokens and refresh tokens are stored in Firestore
- Access tokens are short-lived (typically 1 hour) and refreshed as needed
- Refresh tokens are long-lived and securely stored
- Firestore security rules restrict token access to the respective user and admin service account

ADD INFO:
- Not all tokens save and recall functions are encrypting properly
- Using 32 bytes long key for AES-256 encryption 
- Encryption key is stored in environment variables

## 5. Service Account Usage

- A Firebase Admin SDK service account is used for server-side operations
- This service account has the ability to impersonate users for specific Google API calls (AND FIRESTORE API CALLS)
- The service key is stored securely and never exposed client-side

SECURITY CONSIDERATION: Regularly rotate the service account key and monitor its usage for any suspicious activity.

True: Ability to impersonate user for Firestore API calls (serverWriteAsImpersonatedUser)

Some file location notes:
- functions/index.js : storeToken() && decryptToken()
- src/app/api/storeTokens/route.js : POST()
- src/lib/firebase/tokenManager.js : refreshAccessToken() gets token directly from Firestore, no decrypt
- src/lib/gmail/gmailOperations.js : getUserTokens()
- src/lib/gmail/gmailOperationsCommon.js : getUserTokens() gets token directly from Firestore, no decrypt
- auth.js : signInWithGoogle() : sendTokensToBackend() : /api/storeTokens
- firebase.json refers to encryption key in it for some unknown use "ENCRYPTION_KEY": "${ENCRYPTION_KEY}"

## 6. Development Environment and OAuth Consent Screen

- The application is currently in OAuth consent screen "Testing" mode
- In this mode, there's a limit of 100 test users over the lifetime of the app
- Test users must be manually added through the Google Cloud Console
- The application cannot programmatically add test users

SECURITY CONSIDERATION: Plan for the transition from "Testing" to "Production" mode, including the necessary security reviews and verification processes required by Google.

## 7. Firestore Security Rules

Implement and regularly review Firestore security rules, especially for the `userTokens` collection:

```
match /userTokens/{userId} {
  allow read, write: if request.auth.uid == userId || request.auth.token.firebase.sign_in_provider == 'google';
}
```

## 8. Key Security Considerations

1. Token Storage: Ensure tokens are never exposed client-side or logged
2. Scope Management: Regularly review and minimize requested scopes
3. Service Account: Strictly control and monitor service account usage
4. User Consent: Clearly communicate requested permissions to users
5. Token Refresh: Implement secure token refresh mechanisms
6. Error Handling: Securely handle and log authentication errors
7. Rate Limiting: Implement rate limiting to prevent abuse
8. Audit Logging: Maintain comprehensive logs of authentication events
9. Compliance: Ensure compliance with relevant data protection regulations (GDPR, CCPA, etc.)

## 9. Potential Security Enhancements

1. Implement multi-factor authentication
2. Add support for passwordless authentication
3. Implement a token rotation strategy
4. Develop a system for handling token revocation and re-authentication
5. Implement more granular permission management for Gmail access
6. Add user-initiated connected account management features

## 10. Regular Security Audits

Conduct regular security audits focusing on:
1. Token storage and management practices
2. Service account usage and key rotation
3. Scope creep in OAuth permissions
4. Firestore security rules
5. Authentication error logs
6. User impersonation practices
7. Compliance with Google's OAuth policies and terms of service

## 11. Incident Response Plan

Develop and maintain an incident response plan for potential security breaches, including:
1. Steps to revoke compromised tokens
2. Process for rotating service account keys
3. Communication plan for affected users
4. Procedures for post-incident security review

## 12. Security Check Files and Functions

The following files and functions are involved in security checks:

- functions/index.js                     : storeToken() && decryptToken()
- src/app/api/storeTokens/route.js       : POST()
- src/lib/firebase/auth.js               : signInWithGoogle() calls sendTokensToBackend()
- src/lib/firebase/tokenManager.js       : refreshAccessToken()
- src/lib/gmail/gmailOperations.js       : getUserTokens()
- src/lib/gmail/gmailOperationsCommon.js : getUserTokens()

By adhering to these security practices and regularly reviewing this document, we can maintain a robust and secure authentication system. It's crucial to keep this overview updated as the system evolves or when new features are added.

