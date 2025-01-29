#!/bin/bash
# This is the main entry point of the search engine.
# cd "$(dirname "$0")" || exit 1

# echo "$(pwd)"

# SECONDS=0
# # do some work
# duration=$SECONDS

# for i in 1 2 3 4 5
# do
#   ./crawl.sh "$url" >d/content.txt
# done
# duration=$SECONDS
# echo "$(duration)"


#!/bin/bash
# This is the main entry point of the search engine.
cd "$(dirname "$0")" || exit 1

echo "$(pwd)"

SECONDS=0
# do some work
duration=$SECONDS

for i in 1 2 3 4 5
do
  ./query.js "bioluminescence"
done
duration=$SECONDS
echo $duration
