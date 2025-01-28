#!/bin/bash
# This is a student test

T_FOLDER=${T_FOLDER:-t}
TS_FOLDER=${TS_FOLDER:-ts}
D_FOLDER=${D_FOLDER:-d}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}

term="sIMPl "

cat "$TS_FOLDER"/d/d7.txt > "$D_FOLDER"/global-index.txt


if $DIFF <(/usr/src/app/non-distribution/query.js "$term") <(cat "$TS_FOLDER"/d/d16.txt) >&2;
then
    echo "$0 success: search results are identical"
    exit 0
else
    echo "$0 failure: search results are not identical"
    exit 1
fi