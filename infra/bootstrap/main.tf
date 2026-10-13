# Bucket chứa Terraform state cho mọi thư mục khác trong infra/.
# prevent_destroy chặn mọi plan muốn xoá bucket (đổi tên, lỡ destroy),
# vì mất bucket là mất dấu toàn bộ hạ tầng.
resource "aws_s3_bucket" "tfstate" {
  bucket = "lastbite-tfstate-ap-sa-v1"

  lifecycle {
    prevent_destroy = true
  }
}

# Giữ lại mọi phiên bản cũ của file state mỗi lần apply ghi đè,
# để khôi phục được khi state bị hỏng hoặc bị ghi nhầm.
resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  versioning_configuration {
    status = "Enabled"
  }
}

# State chứa secret ở dạng văn bản thường, nên chặn mọi cách mở public (ACL lẫn policy).
# Khai báo trong code để plan phát hiện nếu có ai tắt trên console.
resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}
