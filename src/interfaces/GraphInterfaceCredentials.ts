/**
 * Credentials of an App Registration for a GraphInterface client.
 * It allows to authenticate the client to the GraphInterface.
 * It is used to generate an access token to authenticate with
 * the Graph API.
 */
interface GraphInterfaceCredentials {
    /**
     * The client ID of the App Registration.
     * It's in GUID format `00000000-0000-0000-0000-000000000000`.
     */
    clientId: string;
    /**
     * The client secret of the App Registration.
     * It's a string of characters.
     */
    clientSecret: string;
    /**
     * The tenant ID of the App Registration.
     * It's in GUID format `00000000-0000-0000-0000-000000000000`.
     * A tenant name can be used instead of the tenant ID.
     */
    tenantId: string;
}

export default GraphInterfaceCredentials;