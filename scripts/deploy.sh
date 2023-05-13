#!/bin/bash
set -e

echo "Submit the container image..."
gcloud builds submit --region=us-west2 --tag us-west2-docker.pkg.dev/care-chat-386021/care-chat-api-repo/care-chat-api --verbosity=info
echo "Container build completed."

echo "Deploying to Cloud Run..."
gcloud run deploy care-chat-api --image us-west2-docker.pkg.dev/care-chat-386021/care-chat-api-repo/care-chat-api:latest
echo "Cloud Run deploy completed."



