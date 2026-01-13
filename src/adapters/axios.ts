import type { AxiosResponse } from 'axios';
import type { SafeAwaitResult } from '@/types';
import { safeAwait } from '@/safe-await';

export const safeAwaitAxios = <T = any>(
    promise: Promise<AxiosResponse<T>>,
    finallyFunc?: () => unknown
): Promise<SafeAwaitResult<T>> => {
    return safeAwait<T>(promise, finallyFunc);
};
