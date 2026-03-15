#!/bin/bash
# NepalQuest Backend Launcher
cd "$(dirname "$0")/backend"
echo "=========================================="
echo "  NepalQuest Backend Server"
echo "=========================================="
source ..//.venv/Scripts/activate
python app.py
