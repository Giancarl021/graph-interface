import { Credentials, AccessTokenResponse } from '../..';

type AuthenticationProvider = (credentials: Credentials) => Promise<AccessTokenResponse> | AccessTokenResponse;

export default AuthenticationProvider;