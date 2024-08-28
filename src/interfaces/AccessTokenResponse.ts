interface AccessTokenResponse {
    accessToken: string;
    expiresIn: number;
    tokenType: string;
    refreshToken?: string;
    extExpiresIn: number;
    expiresOn?: number;
    notBefore?: Date;
    resource?: string;
}

export default AccessTokenResponse;
