export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
};

export const success = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  data,
  message,
});

export const error = (message: string, errorMsg?: string) => ({
  success: false,
  message,
  error: errorMsg,
});
