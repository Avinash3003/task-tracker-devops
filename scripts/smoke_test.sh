#!/bin/bash
set -e

echo "Starting automated smoke test..."

# We use Kubernetes itself to spin up a tiny temporary curl pod 
# to query the backend service internally to ensure it is healthy and responsive.
HTTP_STATUS=$(kubectl run temp-smoke-test \
    --image=curlimages/curl \
    --restart=Never \
    --rm -i \
    -- -s -o /dev/null -w "%{http_code}" http://backend-service:8000/health)

if [ "$HTTP_STATUS" == "200" ]; then
    echo "✅ Smoke Test Passed: The backend service returned 200 OK!"
    exit 0
else
    echo "❌ Smoke Test Failed: The backend returned HTTP status $HTTP_STATUS!"
    exit 1
fi
