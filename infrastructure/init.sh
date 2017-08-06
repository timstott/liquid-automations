#!/bin/bash
set -euo pipefail

export AWS_DEFAULT_PROFILE=liquid-automations-infrastructure

cd "$(dirname "$BASH_SOURCE")"

bucket=liquid-automations-terraform-state

if (aws s3api head-bucket --bucket $bucket 2>&1 || true) | grep --quiet 404; then
  echo "Creating S3 bucket to store state"
  aws s3api create-bucket \
            --bucket $bucket \
            --create-bucket-configuration LocationConstraint=eu-west-1
fi

echo "Initializing Terraform"
terraform init --backend=true
