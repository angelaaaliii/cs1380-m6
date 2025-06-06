#!/bin/bash
# This is a student test
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}

if $DIFF <(cat ts/d/d14.txt | ./../c/combine.sh | sed 's/\t*$//' | sed 's/\s/ /g' | sort | uniq) <(cat ts/d/d24.txt | sed 's/\t*$//' | sed 's/\s/ /g' | sort | uniq) >&2;
then
    echo "$0 success: ngrams are identical"
    exit 0
else
    echo "$0 failure: ngrams are not identical"
    exit 1
fi
