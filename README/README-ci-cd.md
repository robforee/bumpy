Cloud run log
last deploy 9/9/2024
https://console.cloud.google.com/run/detail/us-central1/webapp/logs?project=analyst-server

# CI/CD and Development Notes

## Version Compatibility

### React and Next.js
- Next.js 14.2.3 requires React 18.2.x
- Using React 18.3.x causes chunk loading errors
- If you see `ChunkLoadError: Loading chunk app/layout failed`, check React version

### Development Setup
1. Clean build:
```bash
rm -rf .next
npm run build
```

2. If you encounter chunk loading errors:
```bash
# Install compatible React version
npm install react@18.2.0 react-dom@18.2.0

# Clean and rebuild
rm -rf .next
npm run dev
```

### Deployment
```bash
rm -rf .next
npm run build
git push
```