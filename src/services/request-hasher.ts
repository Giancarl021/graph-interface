import { TokenOptions } from '../..';
import { RequestOptions } from '../interfaces';
import { createHash } from 'crypto';

export default function (resource: string, options: RequestOptions | TokenOptions): string {
    let hash = `${resource}::${JSON.stringify(options)}`;

    return createHash('sha1')
        .update(hash)
        .digest('base64');
}