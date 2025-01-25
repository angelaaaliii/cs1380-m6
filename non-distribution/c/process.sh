#!/bin/bash

# Convert input to a stream of non-stopword terms
# Usage: ./process.sh < input > output

# Convert each line to one word per line, 
tr -c '[:alnum:]' ' ' | tr '[:digit:]' ' ' | tr -s ' ' ' ' | tr ' ' '\n' | tr '[:upper:]' '[:lower:]' | iconv -f utf-8 -t ascii//TRANSLIT | grep -v -w -f "./d/stopwords.txt"
# **remove non-letter characters**, 
# make lowercase, 
# convert to ASCII; 
# then remove stopwords (inside d/stopwords.txt)

# Commands that will be useful: tr, iconv, grep

