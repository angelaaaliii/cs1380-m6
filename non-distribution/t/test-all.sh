#!/bin/bash

cd "$(dirname "$0")" || exit

./test-getURLs.sh
./test-getText.sh
./test-process.sh
./test-stem.sh
./test-combine.sh
./test-invert.sh
./test-merge.sh
./test-query.sh
./test-end_to_end.sh
