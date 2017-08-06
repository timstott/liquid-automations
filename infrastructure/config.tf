variable "region" {
  description = "AWS region in which to create infrastructure"
  default     = "eu-west-1"
}

variable "service" {
  description = "Name of the Serverless service being deployed"
  default     = "liquid-automations"
}

terraform {
  backend "s3" {
    bucket  = "liquid-automations-terraform-state"
    key     = "terraform.tfstate"
    profile = "liquid-automations-infrastructure"
    region  = "eu-west-1"
  }
}

provider "aws" {
  profile = "liquid-automations-infrastructure"
  region  = "${var.region}"
}
