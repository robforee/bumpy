# Firebase Functions Implementation Notes

## Important Version Requirements

### Firebase Functions v2
We use Firebase Functions v2 for all new functions. This requires:
```bash
npm install firebase-functions@latest
```

Key differences from v1:
- Different import paths (e.g., `firebase-functions/v2/scheduler`)
- New configuration options (memory, labels)
- Better type safety
- Improved error handling

### Scheduler Implementation
```javascript
// Correct v2 implementation
const { onSchedule } = require("firebase-functions/v2/scheduler");

exports.myScheduledJob = onSchedule({
    schedule: 'every 30 minutes',
    timeZone: 'America/Chicago',
    retryCount: 3,
    memory: '256MB',
    minInstances: 0,  // IMPORTANT: Required for background functions
    maxInstances: 1   // Limit concurrent instances
}, async (event) => {
    // Function code
});

// Old v1 style (DO NOT USE)
exports.myScheduledJob = functions.pubsub.schedule('every 30 minutes')
    .timeZone('America/Chicago')
    .onRun(async (context) => {
        // Function code
    });
```

## Configuration

### Instance Settings
```javascript
{
    minInstances: 0,  // Required for background functions to avoid Cloud Run
    maxInstances: 1,  // Limit concurrent executions
}
```

### Memory Settings
- Default: 256MB
- Increase for heavy operations
- Available options: 128MB, 256MB, 512MB, 1GB, 2GB, 4GB

### Retry Settings
```javascript
{
    retryCount: 3,           // Number of retry attempts
    maxRetrySeconds: 60      // Max time between retries
}
```

### Labels
Use labels for organization and filtering:
```javascript
{
    labels: {
        job: 'token-refresh',
        type: 'scheduled'
    }
}
```

## Secrets Management

### Required Secrets
- GOOGLE_SERVICE_ACCOUNT_KEY: Service account credentials
- ENCRYPTION_KEY: For token encryption

### Setting Secrets
```bash
# Set a secret
firebase functions:secrets:set SECRET_NAME

# List secrets
firebase functions:secrets:list
```

### Using Secrets
```javascript
const { defineSecret } = require("firebase-functions/params");
const mySecret = defineSecret('SECRET_NAME');
```

## Deployment

### Deploy Single Function
```bash
firebase deploy --only functions:functionName
```

### Deploy All Functions
```bash
firebase deploy --only functions
```

### View Logs
```bash
firebase functions:log
```

## Best Practices

### Error Handling
1. Log errors with context
2. Use proper retry configuration
3. Return appropriate status codes

### Resource Management
1. Set appropriate memory limits
2. Use timeouts wisely
3. Clean up resources

### Security
1. Use least privilege access
2. Never log sensitive data
3. Use secrets for credentials

### Monitoring
1. Use structured logging
2. Set up alerting
3. Monitor costs

## Common Issues

### Container Failed to Start
If you see "Container failed to start" error:
1. Check minInstances is set to 0 for background functions
2. Set maxInstances appropriately
3. Verify function doesn't need HTTP endpoints

### Cloud Run Issues
Background functions (like scheduled jobs) should:
- Set minInstances: 0
- Not try to listen on ports
- Not handle HTTP requests

### Secrets Access
If function can't access secrets:
1. Verify secret exists
2. Check service account permissions
3. Redeploy function

### Memory Issues
If function runs out of memory:
1. Increase memory setting
2. Optimize code
3. Split into smaller functions
