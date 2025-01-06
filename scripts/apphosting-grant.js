#!/usr/bin/env node

import fs from 'fs';
import yaml from 'yaml';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the apphosting.yaml file
const apphostingPath = path.join(__dirname, '..', 'apphosting.yaml');
const apphostingContent = fs.readFileSync(apphostingPath, 'utf8');
const apphostingConfig = yaml.parse(apphostingContent);

// Extract all secret names
const secrets = [];
apphostingConfig.env.forEach(env => {
  if (env.secret) {
    // Extract the secret name from the full path
    // Format: projects/727308999536/secrets/SECRET_NAME
    const secretName = env.secret.split('/').pop();
    secrets.push(secretName);
  }
});

// Configuration
const location = 'us-central1';
const backend = 'bumpy-roads';

console.log('Found these secrets that need permissions:');
console.log('----------------------------------------\n');

// Generate commands for each secret
secrets.forEach((secret, index) => {
  console.log(`${index + 1}. For secret "${secret}", run:`);
  console.log(`firebase apphosting:secrets:grantaccess "${secret}" --location "${location}" --backend "${backend}"\n`);
});
