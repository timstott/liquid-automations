#!/bin/bash

if [[ -z "$1" ]]; then
  echo "Usage: ./encrypt.sh <environment>" >&2
  exit 1
fi

read -p "Environment variable value: " \
     -s plaintext

printf "\r" >&2

aws kms encrypt --key-id "alias/liquid-automations-$1-env-vars" \
                --plaintext "$plaintext" \
                --profile liquid-automations-infrastructure \
                --region eu-west-1 \
                --query CiphertextBlob \
                --output text
