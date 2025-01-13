/**
 * Credentials to a connect to the Microsoft Graph API service
 */
interface Credentials {
    /**
     * The client ID of the App Registration on Azure
     */
    clientId: string;
    /**
     * The client secret **value** of the App Registration on Azure
     */
    clientSecret: string;
    /**
     * The tenant ID of the Azure AD tenant, can be a GUID, domain name or a generic, such as
     * `common`, `consumers` or `organizations`
     */
    tenantId: 'common' | 'organizations' | 'consumers' | (string & {});
}

export default Credentials;
