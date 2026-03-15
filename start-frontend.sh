#!/bin/bash
# NepalQuest Frontend Launcher
export PATH="/d/nepalquest/.node/node-v20.11.1-win-x64:$PATH"
cd "$(dirname "$0")/frontend"
echo "=========================================="
echo "  NepalQuest Frontend (React)"
echo "=========================================="
npm start
