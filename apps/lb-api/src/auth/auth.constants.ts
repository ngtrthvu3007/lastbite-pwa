export const AUTH_COOKIE_NAME = 'lb_session';

export const COGNITO_AUTHORIZE_PATH = '/oauth2/authorize';
export const COGNITO_TOKEN_PATH = '/oauth2/token';
export const COGNITO_GOOGLE_PROVIDER = 'Google';
// Forwarded to Google so it always shows the account chooser. Needs Cognito managed login.
export const COGNITO_PROMPT = 'select_account';
export const COGNITO_SCOPES = 'openid email profile';
