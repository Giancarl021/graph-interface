import type HttpHeaders from '../HttpHeaders';
import type KeyMapper from '../KeyMapper';
import type Nullable from '../util/Nullable';

/**
 * Represents a collection of options for a request.
 * This interface is generic, meant to be extended by other interfaces.
 */
interface RequestOptions {
    /**
     * If the request should use cache, returning a cached result if called with the same parameters.
     */
    useCache: boolean;
    /**
     * The method of the request
     */
    method: string;
    /**
     * The headers of the request
     */
    headers: HttpHeaders;
    /**
     * The body of the request
     */
    body: any;
    /**
     * The key mapper to use for the request
     */
    keyMapper: Nullable<KeyMapper>;
    /**
     * A custom access token to use for the request, bypassing
     * the authentication provider.
     */
    customAccessToken?: string;
}

export default RequestOptions;
