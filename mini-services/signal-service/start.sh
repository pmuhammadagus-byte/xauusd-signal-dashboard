#!/bin/bash
# Persistent launcher for XAU signal service
cd /home/z/my-project/mini-services/signal-service
while true; do
  echo "[$(date)] Starting signal service..."
  bun index.ts >> service.log 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Signal service exited with code $EXIT_CODE, restarting in 3s..."
  sleep 3
done
