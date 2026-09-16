const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000"
).replace(/\/$/, "");


type ApiOptions = RequestInit & {
  errorMessage?: string;
};


export async function apiRequest<T>(
  path: string,
  {
    errorMessage = "Request failed.",
    ...options
  }: ApiOptions = {}
): Promise<T> {
  const response = await fetch(
    `${API_URL}${path}`,
    options
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => null) as {
        detail?: string;
      } | null;

    throw new Error(
      error?.detail ?? errorMessage
    );
  }

  // 204 No Content has an empty body,
  // so response.json() would throw.
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
