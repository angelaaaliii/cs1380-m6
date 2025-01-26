#!/bin/bash
# This is a student test

T_FOLDER=${T_FOLDER:-t}
TS_FOLDER=${TS_FOLDER:-ts}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}


if $DIFF <(cat "$TS_FOLDER"/d/d12.txt | /../../c/stem.js | sort) <(sort "$TS_FOLDER"/d/d13.txt) >&2;
then
    echo "$0 success: stemmed words are identical"
    exit 0
else
    echo "$0 failure: stemmed words are not identical"
    exit 1
fi
