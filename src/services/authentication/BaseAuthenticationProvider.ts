import format from 'string-template';
import type AuthenticationProviderFactory from '../../interfaces/AuthenticationProviderFactory.js';
import type AuthenticationUrl from '../../interfaces/AuthenticationUrl.js';
import type Tenant from '../../interfaces/Tenant.js';

export default function BaseAuthenticationProvider<
    Extensions extends Record<any, any> = {}
>(
    authenticationUrl: AuthenticationUrl,
    tenant: Tenant = 'common',
    extensions = {} as Extensions
): AuthenticationProviderFactory<Extensions> {
    const url = _parseUrl(tenant);
    const context = { url, body, headers };

    function _parseUrl(tenant: Tenant) {
        let url: string;

        switch (authenticationUrl) {
            case 'oAuth 2.0 v1':
                url = 'https://login.microsoftonline.com/{tenant}/oauth2/token';
                break;
            case 'oAuth 2.0 v2':
                url =
                    'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token';
                break;
            default:
                url = authenticationUrl;
        }

        return format(url, { tenant: tenant ?? 'common' });
    }
}
