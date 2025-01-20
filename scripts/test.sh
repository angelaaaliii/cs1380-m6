#!/usr/bin/env bash

# Default values for options
RUN_SCENARIOS=false
RUN_EXTRA_CREDIT=false
RUN_NORMAL_TESTS=false
INCLUDE_NON_DISTRIBUTION=false

# Function to show usage
show_usage() {
    cat << EOF
Usage: npm test -- [options]

Options:
  -s, --scenarios         Run the scenario tests (*.scenario.js)
  -ec, --extra-credit     Run the extra credit tests (*.extra.test.js)
  -t, --tests             Run the normal tests (*.test.js)
  -nd, --non-distribution Run the non-distribution tests
  -h, --help              Show this help message and exit

By default:
  - Only regular tests (*.test.js) run if no options are passed.
  - Tests with "non-distribution" in their names are excluded unless -nd is specified.
EOF
}

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        -s|--scenarios)
            RUN_SCENARIOS=true
            shift
            ;;
        -ec|--extra-credit)
            RUN_EXTRA_CREDIT=true
            shift
            ;;
        -t|--tests)
            RUN_NORMAL_TESTS=true
            shift
            ;;
        -nd|--non-distribution)
            INCLUDE_NON_DISTRIBUTION=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Construct the JEST command
JEST_COMMAND="jest --maxWorkers=1"

# Add test matching logic
if $RUN_SCENARIOS; then
    JEST_COMMAND+=" --testMatch \"**/*.scenario.js\""
fi

if $RUN_EXTRA_CREDIT; then
    JEST_COMMAND+=" --testMatch \"**/*.extra.test.js\""
fi

if $RUN_NORMAL_TESTS || (! $RUN_SCENARIOS && ! $RUN_EXTRA_CREDIT && ! $RUN_NORMAL_TESTS); then
    JEST_COMMAND+=" --testMatch \"**/*.test.js\""
fi

# Exclude "non-distribution" tests by default unless -nd is specified
if ! $INCLUDE_NON_DISTRIBUTION; then
    JEST_COMMAND+=" --testPathIgnorePatterns \"non-distribution\""
fi

if ! $RUN_EXTRA_CREDIT; then
    JEST_COMMAND+=" --testPathIgnorePatterns \"extra\""
fi

# Run the constructed JEST command
eval "$JEST_COMMAND"
