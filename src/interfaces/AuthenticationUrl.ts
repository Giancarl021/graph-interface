/**
 * Defines the types of authentication URLs supported.
 * This type can be extended to include custom authentication URLs as needed.
 * - oAuth 2.0 v1: `https://login.microsoftonline.com/{tenant}/oauth2/token`
 * - oAuth 2.0 v2: `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token`
 * - Custom URLs can be provided as strings using `{tenant}` inside as a template to be replaced by
 * the tenant value provided to the authentication provider factory.
 */
type AuthenticationUrl = 'oAuth 2.0 v1' | 'oAuth 2.0 v2' | (string & {});

export default AuthenticationUrl;
