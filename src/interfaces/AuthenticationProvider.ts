/**
 * Defines the interface for an authentication provider.
 * An authentication provider is responsible for providing the necessary
 * authentication details for making requests to a service.
 */
export default interface AuthenticationProvider {
    /**
     * Generates and returns an authentication request.
     * This request typically includes the necessary headers or tokens
     * required for authenticating with the target service.
     *
     * @returns A Request object containing authentication details.
     */
    getAuthenticationRequest(): Request;
    /**
     * Generates a hash representing the current credentials.
     * This is used on cache to determine if the cached token is still valid.
     *
     * @returns A string hash of the current credentials.
     */
    getCredentialsHash(): string;
}
