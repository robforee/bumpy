# View recent logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=bumpy-roads" --limit=50

# Stream logs in real-time
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=bumpy-roads"

# View error logs specifically
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=bumpy-roads AND severity>=ERROR" --limit=20