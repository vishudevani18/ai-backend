export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error: boolean;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export class ResponseUtil {
  static success<T>(data: T, message?: string, requestId?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      error: false,
      message,
      timestamp: new Date().toISOString(),
      requestId,
    };
  }

  static error<T>(data: T, message: string, requestId?: string): ApiResponse {
    return {
      success: false,
      message,
      data,
      error: true,
      timestamp: new Date().toISOString(),
      requestId,
    };
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string,
    requestId?: string,
  ): ApiResponse<{
    items: T[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    return {
      success: true,
      data: {
        items: data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      error: false,
      message,
      timestamp: new Date().toISOString(),
      requestId,
    };
  }
}
