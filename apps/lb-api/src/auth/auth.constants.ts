export const AUTH_COOKIE_NAME = 'lb_session';
export const SIGNED_IN_COOKIE_NAME = 'lb_signed_in';

// Captures the session token from a Cookie header. The name must start the header or follow a ";",
// so a cookie such as "x_lb_session=" is not mistaken for the session cookie.
export const SESSION_TOKEN_PATTERN = new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;\\s]*)`);

// A session with less than this left is swapped for a new one, so active users never hit 401.
export const SESSION_ROTATE_BELOW_MS = 2 * 60 * 60 * 1000;

export const COGNITO_AUTHORIZE_PATH = '/oauth2/authorize';
export const COGNITO_TOKEN_PATH = '/oauth2/token';
export const COGNITO_GOOGLE_PROVIDER = 'Google';
export const COGNITO_SCOPES = 'openid email profile';
