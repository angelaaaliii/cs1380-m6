#!/bin/bash

URL="$1"

echo "$1" >> d/visited.txt

# first check if the URL points to a pdf, and if so direct the url to getPDFText.js instead
# ! NOTE: checks that URL points to a pdf by checking if the url ends in .pdf -- this should work for 99% of pdfs
if [[ "$URL" =~ \.pdf$ ]]; then
  echo "$URL" | c/getPDFText.js
else
# the only difference here (from the original crawl script) is the html is also sent to getImages.js to extract image_urls
  curl -skL "$1" |
    tee \
      >(c/getURLs.js "$1" | grep -vxf d/visited.txt >> d/urls.txt) \
      >(c/getImages.js "$1" >> d/image_urls.txt) |
    c/getText.js
fi

