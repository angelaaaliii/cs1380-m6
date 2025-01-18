#!/usr/bin/env bash

TOP_LEVEL=$(git rev-parse --show-toplevel)
cd "$TOP_LEVEL" || exit 1

# Check if node_modules exist in the current directory
INSTALLATION_OK=0

if [ ! -d "node_modules" ]; then
    INSTALLATION_OK=1
fi

if [ ! -d "non-distribution/node_modules" ]; then
    INSTALLATION_OK=1
fi

if [ $INSTALLATION_OK -eq 1 ]; then
    echo "[pretest] node_modules not found, please run 'npm install' in the root directory of your project" >&2
    echo "[pretest] also make sure you run 'npm install' in the 'non-distribution' folder" >&2
    exit 1
fi
