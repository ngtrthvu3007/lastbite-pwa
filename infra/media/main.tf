resource "aws_s3_bucket" "product_images" {
  bucket = var.bucket_name

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_ownership_controls" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_public_access_block" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_cors_configuration" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  cors_rule {
    allowed_headers = ["content-type"]
    allowed_methods = ["GET", "POST"]
    allowed_origins = tolist(var.web_app_origins)
    expose_headers  = ["ETag"]
    max_age_seconds = 300
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  rule {
    id     = "abort-incomplete-multipart-uploads"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

data "aws_iam_policy_document" "api_media" {
  statement {
    actions = [
      "s3:GetObject",
      "s3:PutObject",
    ]
    resources = ["${aws_s3_bucket.product_images.arn}/uploads/*"]
  }
}

resource "aws_iam_policy" "api_media" {
  name        = "lastbite-api-product-images"
  description = "Allows the LastBite API to sign and verify product-image uploads."
  policy      = data.aws_iam_policy_document.api_media.json
}
