# Cloud Run Logging Guide

## Quick Start
Most commonly used command:
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=bumpy-roads" --limit=50
```

## View Logs in Console
1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Select service `bumpy-roads`
3. Click "LOGS" tab
4. Use query builder or these sample queries:

```
# Show all logs
resource.type="cloud_run_revision"
resource.labels.service_name="bumpy-roads"

# Show only errors
resource.type="cloud_run_revision"
resource.labels.service_name="bumpy-roads"
severity>=ERROR

# Show auth-related logs
resource.type="cloud_run_revision"
resource.labels.service_name="bumpy-roads"
textPayload=~"(OAuth|token|auth)"
```

## View Logs in Terminal

### Stream Recent Logs
```bash
# Stream all logs (actual command used in production)
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=bumpy-roads"

# Stream errors only
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=bumpy-roads AND severity>=ERROR"

# Stream auth-related logs
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=bumpy-roads AND textPayload=~\"(OAuth|token|auth)\""
```

### View Recent Logs
```bash
# View last 50 logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=bumpy-roads" --limit=50

# View recent errors
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=bumpy-roads AND severity>=ERROR" --limit=20

# View recent auth logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=bumpy-roads AND textPayload=~\"(OAuth|token|auth)\"" --limit=50
```

## Common Issues
1. No logs appearing:
   - Check service name is correct (`bumpy-roads`)
   - Verify logs are being written (console.log statements)
   - Check time range in Cloud Console

2. Missing expected logs:
   - Some logs might be filtered by default
   - Try removing severity filters
   - Check if logs are being written at the right level

3. Too many logs:
   - Use more specific filters
   - Add time range constraints
   - Filter by severity level