#!/bin/bash

# Start MinIO server in the background
minio server /data --console-address ":9001" &

# Wait for the MinIO server to start (adjust the sleep time as necessary)
sleep 5

# Configure MinIO client `mc` with the server
mc alias set manuscrape_minio http://localhost:9000 minioadmin minioadmin

# Create a new bucket
mc mb manuscrape_minio/bucket
  
# Keep the container running after setup
wait
