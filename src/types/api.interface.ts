
export interface ApiResponse{
    statusCode: number,
    message: string,
    data?: any,
    success: boolean
}

export interface ApiError{
    statusCode: number,
    message: string,
    error?: any,
    success: boolean
}