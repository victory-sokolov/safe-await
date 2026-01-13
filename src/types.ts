// Generic HTTP response interface
interface HttpResponse<T = any> {
    data: T;
    status: number;
    statusText?: string;
    headers?: any;
}

// Type definitions for different HTTP client responses
interface FetchResponse<T = any> extends Response {
    data?: T;
}

// Error response interface
interface HttpError<T = any> extends Error {
    response?: {
        data: T;
        status: number;
        statusText?: string;
        headers?: any;
    };
    status?: number;
    statusCode?: number;
}

// Return type for safeAwait - [error, data, statusCode]
type SafeAwaitResult<T> = [Error, any, number] | [undefined, T, number];

export type { HttpError, HttpResponse, SafeAwaitResult };
