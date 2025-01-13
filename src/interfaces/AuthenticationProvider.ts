import type { Credentials, AccessTokenResponse } from '../interfaces';

/**
 * Type for the authentication provider function, which is used to get the access token. It receives the credentials
 * and returns the access token response
 */
type AuthenticationProvider = (
    credentials: Credentials
) => Promise<AccessTokenResponse> | AccessTokenResponse;

export default AuthenticationProvider;
