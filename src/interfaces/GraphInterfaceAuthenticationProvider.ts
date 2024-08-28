import type GraphInterfaceAccessTokenResponse from './GraphInterfaceAccessTokenResponse.js';
import type GraphInterfaceCredentials from './GraphInterfaceCredentials.js';

/**
 * A function that provides access tokens to authenticate using
 * Graph Credentials. It's used by the GraphInterface client
 * to authenticate requests to the Graph API.
 * @param credentials The credentials to authenticate with the Graph API.
 * @returns A promise with the access token response with the access token
 * and its metadata.
 */
type GraphInterfaceAuthenticationProvider = (
    credentials: GraphInterfaceCredentials
) => Promise<GraphInterfaceAccessTokenResponse>;

export default GraphInterfaceAuthenticationProvider;
