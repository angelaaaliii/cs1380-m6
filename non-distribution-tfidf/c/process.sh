#!/bin/bash

# Convert input to a stream of non-stopword terms
# Usage: ./process.sh < input > output

INPUT=$(cat)
node c/process.js "$INPUT" "$1"
# TFIDF LAB

