import type { HttpError, SafeAwaitResult } from '@/types';
import { safeAwait } from '@/safe-await';


export const safeAwaitFetch = async <T = any>(
    promise: Promise<Response>,
    finallyFunc?: () => unknown
): Promise<SafeAwaitResult<T>> => {
    const enhancedPromise = promise.then(async (response) => {
        let data: T;

        // Clone response to avoid consuming the body multiple times
        const responseClone = response.clone();

        try {
            // Try to parse as JSON first
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else if (contentType && contentType.includes('text/')) {
                data = (await response.text()) as unknown as T;
            } else {
                data = (await response.blob()) as unknown as T;
            }
        } catch (parseError) {
            // If parsing fails, use the raw response
            data = responseClone as unknown as T;
        }

        // For fetch, we need to manually handle non-2xx status codes
        if (!response.ok) {
            const error = new Error(
                `HTTP Error: ${response.status} ${response.statusText}`
            ) as HttpError<T>;
            error.response = {
                data,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
            };
            error.status = response.status;
            throw error;
        }

        // Attach data to response for normalization
        (response as any).data = data;
        return response;
    });

    return safeAwait<T>(enhancedPromise, finallyFunc);
};
