# Setting Up Your Encryption Key

1. **Generate a Secure Encryption Key**

   You need to generate a strong, random encryption key. Here's how you can do it:

   - Open a terminal
   - Run the following command to generate a 32-byte (256-bit) random key:

     ```
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```

   - This will output a 64-character hexadecimal string, which will be your encryption key.

2. **Store the Key for Development**

   - Create a file named `.env` in your `functions` directory if it doesn't exist already.
   - Add the following line to the `.env` file, replacing `YOUR_GENERATED_KEY` with the key you just generated:

     ```
     ENCRYPTION_KEY=YOUR_GENERATED_KEY
     ```

3. **Store the Key for Production**

   Use the Firebase CLI to securely store the encryption key:

   ```
   firebase functions:config:set encryption.key="YOUR_GENERATED_KEY"
   ```

4. **Access the Key in Your Code**

   The updated `functions/index.js` file already includes code to access this key:

   ```javascript
   const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || functions.config().encryption?.key;
   ```

   This line will use the environment variable in development (emulator) and the Firebase config in production.

5. **Security Best Practices**

   - Never commit your `.env` file or your actual encryption key to version control.
   - Limit access to your production Firebase project to only those who absolutely need it.
   - Consider using a secret management service for production environments.
   - Rotate your encryption key periodically, but be aware that this will invalidate all existing encrypted tokens.

Remember, the security of your encrypted data depends on keeping this key secret. Treat it with the same level of security as you would passwords or API keys.
