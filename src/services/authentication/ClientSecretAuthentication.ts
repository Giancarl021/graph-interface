import type AuthenticationProviderFactory from '../../interfaces/AuthenticationProviderFactory.js';

export default function ClientSecretAuthentication(
    clientId: string,
    clientSecret: string,
    tenant?: string
): AuthenticationProviderFactory {
    return factory;
}
