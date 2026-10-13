# Khai báo phiên bản Terraform và provider dùng chung cho cả team.
# Cần >= 1.11 để khoá state bằng file ngay trong S3 (use_lockfile).
terraform {
  required_version = ">= 1.11"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

# Credential không ghi ở đây, provider tự đọc AWS_PROFILE từ môi trường
# để mỗi người dùng profile của mình.
provider "aws" {
  region = "ap-southeast-1"
}
