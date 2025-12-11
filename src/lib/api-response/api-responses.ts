import { ApiResponse, ApiResponseFailure, ApiResponseSuccess } from "@/types/api.interface";
import { NextResponse } from "next/server";

/**
 * Creates a standardized success API response.
 * 
 * @template T - Type of the successful `data` payload.
 * @param message - Human-readable success message.
 * @param data - Payload returned to the client.
 * @param status - HTTP status code (default: 200)
 * @param statusCode - Internal API status code (default: 200)
 * 
 * @returns NextRepsonse - JSON reponse with success: true
 */
export function successResponse<T>(
    message: string,
    data: T,
    status: number = 200,
    statusCode: number = 200
): NextResponse{
    const jsonBody: ApiResponseSuccess<T> = {
        statusCode: statusCode,
        message: message,
        data: data,
        success: true,
    };
    return NextResponse.json(jsonBody, { status: status });
}

/**
 * Create a standardized error API response.
 * 
 * @param message - Human-readable error message
 * @param status - HTTP status code (default: 500)
 * @param statusCode - Internal API status code (default: 500)
 * 
 * @returns NextResponse - JSON response with success: false 
 */
export function errorResponse(
    message: string,
    status: number = 500,
    statusCode: number = 500,
    data?: any
): NextResponse{
    const jsonBody: ApiResponseFailure = {
        statusCode: statusCode,
        message: message,
        success: false,
        data: data
    };
    return NextResponse.json(jsonBody, { status: status });
}