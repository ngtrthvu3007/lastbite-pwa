output "PRODUCT_IMAGE_BUCKET" {
  value = aws_s3_bucket.product_images.bucket
}

output "PRODUCT_IMAGE_REGION" {
  value = var.region
}

output "API_MEDIA_POLICY_ARN" {
  value = aws_iam_policy.api_media.arn
}
