resource "aws_cognito_user_pool" "main" {
  name                     = var.user_pool_name
  user_pool_tier           = "ESSENTIALS"
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]
  deletion_protection      = "ACTIVE"

  username_configuration {
    case_sensitive = false
  }

  admin_create_user_config {
    allow_admin_create_user_only = true
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_cognito_user_pool_domain" "main" {
  domain                = var.domain_prefix
  user_pool_id          = aws_cognito_user_pool.main.id
  managed_login_version = 1
}

resource "aws_cognito_identity_provider" "google" {
  user_pool_id  = aws_cognito_user_pool.main.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    authorize_scopes = "email profile openid"
    client_id        = var.google_client_id
    client_secret    = var.google_client_secret
  }

  attribute_mapping = {
    email          = "email"
    email_verified = "email_verified"
    name           = "name"
    picture        = "picture"
  }
}

resource "aws_cognito_user_pool_client" "backend" {
  name                                 = "lastbite-backend"
  user_pool_id                         = aws_cognito_user_pool.main.id
  generate_secret                      = true
  refresh_token_validity               = 7
  access_token_validity                = 1
  id_token_validity                    = 1
  explicit_auth_flows                  = ["ALLOW_REFRESH_TOKEN_AUTH"]
  supported_identity_providers         = [aws_cognito_identity_provider.google.provider_name]
  callback_urls                        = [var.callback_url]
  logout_urls                          = tolist(var.logout_urls)
  default_redirect_uri                 = var.callback_url
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  allowed_oauth_flows_user_pool_client = true
  prevent_user_existence_errors        = "ENABLED"
  enable_token_revocation              = true

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }
}
