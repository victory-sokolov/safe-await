import type { HttpError, HttpResponse, SafeAwaitResult } from './types';

const nativeExceptions = [
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError,
    URIError,
].filter((except) => typeof except === 'function');

// Throw native errors immediately
const throwNative = (error: Error) => {
    for (const Exception of nativeExceptions) {
        if (error instanceof Exception) {
            throw error;
        }
    }
};

// Utility function to normalize errors from different HTTP clients
const normalizeError = (error: any): HttpError => {
    // Axios error
    if (error.isAxiosError || (error.response && error.config)) {
        return {
            ...error,
            response: error.response
                ? {
                        data: error.response.data,
                        status: error.response.status,
                        statusText: error.response.statusText,
                        headers: error.response.headers,
                    }
                : undefined,
            status: error.response?.status || error.status,
        };
    }

    // Fetch error (when response is not ok)
    if (error instanceof Response) {
        return {
            name: 'FetchError',
            message: `HTTP Error: ${error.status} ${error.statusText}`,
            response: {
                data: (error as any).data,
                status: error.status,
                statusText: error.statusText,
                headers: error.headers,
            },
            status: error.status,
        } as HttpError;
    }

    // Undici error
    if (error && typeof error === 'object' && 'statusCode' in error) {
        return {
            ...error,
            response: {
                data: error.body || error.data,
                status: error.statusCode,
                headers: error.headers,
            },
            status: error.statusCode,
        };
    }

    return error;
};

// Utility function to normalize responses from different HTTP clients
const normalizeResponse = <T>(response: any): HttpResponse<T> => {
    // Axios response
    if (
        response
        && typeof response === 'object'
        && 'data' in response
        && 'status' in response
    ) {
        return {
            data: response.data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        };
    }

    // Fetch Response
    if (response instanceof Response) {
        return {
            data: (response as any).data || response,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        };
    }

    // Undici response
    if (response && typeof response === 'object' && 'statusCode' in response) {
        return {
            data: response.body || response.data || response,
            status: response.statusCode,
            headers: response.headers,
        };
    }

    // Default case - treat as raw data
    return {
        data: response,
        status: 200,
    };
};

export const safeAwait = <T = any>(
    promise: Promise<any>,
    finallyFunc?: () => unknown
): Promise<SafeAwaitResult<T>> => {
    return promise
        .then((response): SafeAwaitResult<T> => {
            const normalized = normalizeResponse<T>(response);

            // Check if the response data is an Error object
            if (normalized.data instanceof Error) {
                throwNative(normalized.data);
                return [normalized.data, null, normalized.status];
            }

            return [undefined, normalized.data, normalized.status];
        })
        .catch((error): SafeAwaitResult<T> => {
            const normalizedError = normalizeError(error);

            // Check for native exceptions and re-throw them
            throwNative(normalizedError);

            const responseData = normalizedError.response?.data;
            const statusCode
                = normalizedError.status || normalizedError.statusCode || 500;

            // If response data is also an Error, check for native exceptions
            if (responseData instanceof Error) {
                throwNative(responseData);
            }

            return [normalizedError, responseData, statusCode];
        })
        .finally(() => {
            if (finallyFunc && typeof finallyFunc === 'function') {
                finallyFunc();
            }
        });
};

export const createSafeAwait = <TResponse, TData = any>(
    normalizer: (response: TResponse) => HttpResponse<TData>
) => {
    return <T = TData>(
        promise: Promise<TResponse>,
        finallyFunc?: () => unknown
    ): Promise<SafeAwaitResult<T>> => {
        const enhancedPromise = promise.then((response) => {
            const normalized = normalizer(response);
            return normalized;
        });

        return safeAwait<T>(enhancedPromise, finallyFunc);
    };
};
