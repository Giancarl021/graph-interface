/**
 * Interface for the response of the access token request
 * from the authentication provider
 */
interface AccessTokenResponse {
    /**
     * The value of the access token
     */
    accessToken: string;
    /**
     * The expiration time of the access token in seconds
     */
    expiresIn: number;
    /**
     * The type of the token, usually `Bearer`
     */
    tokenType: string;
    /**
     * The refresh token to get a new access token, if `offline_access` scope was used
     */
    refreshToken?: string;
    /**
     * The expiration time of the access token in seconds
     */
    extExpiresIn: number;
    /**
     * The expiration time of the access token in seconds
     */
    expiresOn?: number;
    /**
     * The expiration time of the access token in seconds
     */
    notBefore?: Date;
    /**
     * The resource of the access token
     */
    resource?: string;
}

export default AccessTokenResponse;
