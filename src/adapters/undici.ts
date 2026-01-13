import type { SafeAwaitResult } from '@/types';
import { safeAwait } from '@/safe-await';

interface UndiciResponse<T = any> {
    statusCode: number;
    headers: Record<string, string | string[]>;
    body: T;
    data?: T;
}

export const safeAwaitUndici = <T = any>(
    promise: Promise<any>,
    finallyFunc?: () => unknown
): Promise<SafeAwaitResult<T>> => {
    return safeAwait<T>(promise, finallyFunc);
};
