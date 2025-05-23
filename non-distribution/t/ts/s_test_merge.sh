#!/bin/bash
# This is a student test

R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}
DIFF_PERCENT=${DIFF_PERCENT:-0}

cat /dev/null > d/global-index.txt

files=(./d/m{1..2}.txt)

for file in "${files[@]}"
do
    cat "$file" | ./../c/merge.js d/global-index.txt > d/temp-global-index.txt
    mv d/temp-global-index.txt d/global-index.txt
done


if DIFF_PERCENT=$DIFF_PERCENT ./gi-diff.js <(sort d/global-index.txt) <(sort ./d/m5.txt) >&2;
then
    echo "$0 success: global indexes are identical"
    exit 0
else
    echo "$0 failure: global indexes are not identical"
    exit 1
fi
