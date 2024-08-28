import { Credentials, AccessTokenResponse } from '../interfaces';

type AuthenticationProvider = (
    credentials: Credentials
) => Promise<AccessTokenResponse> | AccessTokenResponse;

export default AuthenticationProvider;
