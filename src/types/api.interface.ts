/**
 * Successful API response shape.
 * 
 * @template T - Type of the `data` payload.
 */
export interface ApiResponseSuccess<T>{
    statusCode: number,
    message: string,
    data: T,
    success: true
}

/**
 * Failed API response shape.
 * 
 * - `error` is optional because not all errors expose internal details.
 */
export interface ApiResponseFailure{
    statusCode: number,
    message: string,
    error?: any,
    success: false,
    data?: undefined
}

/**
 * Union type for Standard API responses.
 */
export type ApiResponse<T> = ApiResponseSuccess<T> | ApiResponseFailure;