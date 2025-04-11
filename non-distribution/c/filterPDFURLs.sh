#!/bin/bash

# ! currently takes a URL from command line arg
# ! current usage: ./filterPDFURLs.sh < urls.txt > pdf_urls.txt 2> non_pdf_urls.txt
# ! not 100% sure where/how this gets integrated into the pipeline but the usage/output format may need to change
# ! same logic also in filterPDFURLs.js
# ! this is VERY SLOW (i think because it has to download some amount of every page)
# ! alternate dumb way is to check if url ends in .pdf although i'm not 100% sure that's correct/robust
while IFS= read -r URL; do
    if [ -z "$URL" ]; then
        continue
    fi

    CONTENT_TYPE=$(curl -s -I "$URL" | grep -i "content-type:" | sed 's/content-type: //i' | tr -d '\r')

    if [ -z "$CONTENT_TYPE" ]; then
        # couldn't retrieve headers 
        # ex: library page for a book, a lot of web.archive links
        # ! should discard the link and not bother crawling it 
        continue
    fi

    if [[ "$CONTENT_TYPE" == *"application/pdf"* ]]; then
        echo "$URL"
    else
        echo "$URL" >&2
    fi
done
