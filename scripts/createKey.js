// token-encryption-script.js

const crypto = require('crypto');
const fs = require('fs');

// Generate a secure random key
function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

// Encrypt a token
function encryptToken(token, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Decrypt a token
function decryptToken(encryptedToken, key) {
  const [iv, encrypted] = encryptedToken.split(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Simulate token storage (in a real app, this would be a database operation)
function storeTokens(userId, accessToken, refreshToken, key) {
  const encryptedAccess = encryptToken(accessToken, key);
  const encryptedRefresh = encryptToken(refreshToken, key);
  const tokens = {
    [userId]: {
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh
    }
  };
  fs.writeFileSync('tokens.json', JSON.stringify(tokens, null, 2));
}

// Simulate token retrieval (in a real app, this would be a database operation)
function retrieveTokens(userId, key) {
  const tokens = JSON.parse(fs.readFileSync('tokens.json', 'utf8'));
  const userTokens = tokens[userId];
  if (userTokens) {
    return {
      accessToken: decryptToken(userTokens.accessToken, key),
      refreshToken: decryptToken(userTokens.refreshToken, key)
    };
  }
  return null;
}

// Main function to demonstrate the process
function main() {
  // Generate a key (in a real app, you'd generate this once and store it securely)
  const key = generateEncryptionKey();
  console.log('Generated Key:', key);

  // Simulate receiving tokens from Google OAuth
  const userId = 'user123';
  const accessToken = 'google-access-token-example';
  const refreshToken = 'google-refresh-token-example';

  // Store the tokens
  storeTokens(userId, accessToken, refreshToken, key);
  console.log('Tokens stored successfully');

  // Retrieve and decrypt the tokens
  const retrievedTokens = retrieveTokens(userId, key);
  console.log('Retrieved Tokens:', retrievedTokens);
}

main();

