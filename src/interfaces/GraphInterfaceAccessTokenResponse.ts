/**
 * The access token response from a authentication flow
 * with the Graph API. It contains the access token and
 * its metadata.
 */
interface GraphInterfaceAccessTokenResponse {
    /**
     * The access token to authenticate with the Graph API.
     */
    accessToken: string;
    /**
     * The expiration time of the access token in seconds.
     * It's usually 3600 seconds (1 hour).
     */
    expiresIn: number;
    /**
     * The type of the token. It's usually `Bearer`.
     */
    tokenType: string;
    /**
     * The refresh token to get a new access token
     * if the scope `offline_access` is granted.
     */
    refreshToken?: string;
}

export default GraphInterfaceAccessTokenResponse;