variable "region" {
  type    = string
  default = "ap-southeast-1"
}

variable "user_pool_name" {
  type    = string
  default = "lastbite-users"
}

variable "domain_prefix" {
  type    = string
  default = "lastbite-auth-294787"
}

variable "google_client_id" {
  type = string
}

variable "google_client_secret" {
  type      = string
  sensitive = true
}

variable "callback_url" {
  type    = string
  default = "http://localhost:3000/auth/callback"
}

variable "logout_urls" {
  type = set(string)
  default = [
    "http://localhost:5173"
  ]
}
