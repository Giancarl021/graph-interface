import { createHash } from 'crypto';

export default function hashObject<T>(obj: T): string {
    const json = JSON.stringify(obj);

    return createHash('sha256').update(json).digest('hex');
}
