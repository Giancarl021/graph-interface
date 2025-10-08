/**
 * Interface representing the response from an access token request.
 * @remarks Some fields may vary based on the authentication provider,
 * the required fields for the library implementation are included here.
 */
export default interface AccessTokenResponse {
    /**
     * The access token string issued by the authentication provider.
     */
    access_token: string;
    /**
     * The duration in seconds for which the access token is valid.
     */
    expires_in: number;
}
