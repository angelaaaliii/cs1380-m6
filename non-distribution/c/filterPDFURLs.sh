#!/bin/bash

# ! currently takes a URL from command line arg
# ! not 100% sure where/how this gets integrated into the pipeline
# ! same logic also in filterPDFURLs.js
# Check if a URL is provided
if [ -z "$1" ]; then
    echo "Please provide a URL to check"
    echo "Usage: $0 <url>"
    exit 1
else
    echo "$1"
fi

# Get the URL from command line argument
URL=$1

# Make a HEAD request and get the Content-Type header
CONTENT_TYPE=$(curl -s -I "$URL" | grep -i "content-type:" | sed 's/content-type: //i' | tr -d '\r')

# Check if curl was able to retrieve headers
if [ -z "$CONTENT_TYPE" ]; then
    echo "✗ Error: Could not retrieve headers from URL"
    exit 1
fi

# Check if the Content-Type contains "application/pdf"
if [[ "$CONTENT_TYPE" == *"application/pdf"* ]]; then
    echo "URL points to a PDF file"
    echo "Content-Type: $CONTENT_TYPE"
    exit 0
else
    echo "URL does not point to a PDF file"
    echo "Content-Type: $CONTENT_TYPE"
    exit 0
fi