#!/bin/bash

# Combine terms to create  n-grams (for n=1,2,3) and then count and sort them
# Usage: ./combine.sh <terms > n-grams

[ -p p1 ] || mkfifo p1
[ -p p2 ] || mkfifo p2
[ -p p3 ] || mkfifo p3

tee >(sort) >(tee p1 | tail +2 | paste p1 - | sort) >(tee p2 | tail +2 | paste p2 - | tee p3 | cut -f 1 | tail +3 | paste p3 - | sort) > /dev/null

rm p1 p2 p3
