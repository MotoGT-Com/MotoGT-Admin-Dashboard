import { AxiosError } from 'axios';

const NETWORK_ERROR_MESSAGE =
  'Cannot reach API. Check NEXT_PUBLIC_API_BASE_URL in .env and open the app at http://localhost:3000 (not the Network URL).';

export function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const axiosError = error as AxiosError;
  return (
    axiosError.code === 'ERR_NETWORK' ||
    axiosError.message === 'Network Error' ||
    (!axiosError.response && axiosError.request !== undefined)
  );
}

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (isNetworkError(error)) {
    return NETWORK_ERROR_MESSAGE;
  }

  const axiosError = error as AxiosError<{ error?: { message?: string } }>;
  return axiosError.response?.data?.error?.message || fallbackMessage;
}
