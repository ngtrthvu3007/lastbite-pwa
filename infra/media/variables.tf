variable "region" {
  type    = string
  default = "ap-southeast-1"
}

variable "bucket_name" {
  type        = string
  description = "Globally unique private bucket for original product images."
}

variable "web_app_origins" {
  type        = set(string)
  description = "Origins allowed to upload directly with a presigned URL."
  default     = ["http://localhost:5173"]
}
