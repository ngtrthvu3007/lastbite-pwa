terraform {
  required_version = ">= 1.11"

  backend "s3" {
    bucket       = "lastbite-tfstate-ap-sa-v1"
    key          = "cognito/terraform.tfstate"
    region       = "ap-southeast-1"
    encrypt      = true
    use_lockfile = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.region
}
