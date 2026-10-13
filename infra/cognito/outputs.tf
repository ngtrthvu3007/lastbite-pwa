output "COGNITO_USER_POOL_ID" {
  value = aws_cognito_user_pool.main.id
}

output "COGNITO_CLIENT_ID" {
  value = aws_cognito_user_pool_client.backend.id
}

output "COGNITO_CLIENT_SECRET" {
  value     = aws_cognito_user_pool_client.backend.client_secret
  sensitive = true
}

output "COGNITO_DOMAIN" {
  value = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${var.region}.amazoncognito.com"
}
