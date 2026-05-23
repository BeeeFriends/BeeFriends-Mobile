export const API_BASE_URL = "https://beefriends-be.drian.my.id";

type RequestJsonOptions = Omit<RequestInit, "headers"> & {
  headers?: HeadersInit;
};

type ApiSuccessResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export async function requestJson<T>(
  path: string,
  options: RequestJsonOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await getErrorMessage(response);
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  const body = parseJsonBody<T | ApiSuccessResponse<T>>(await response.text());

  if (isApiSuccessResponse<T>(body)) {
    return body.data;
  }

  return body;
}

function parseJsonBody<T>(body: string): T {
  if (!body) return undefined as T;

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error(body);
  }
}

async function getErrorMessage(response: Response) {
  const body = await response.text();
  if (!body) return "";

  try {
    const parsed = JSON.parse(body) as { message?: unknown };
    if (Array.isArray(parsed.message)) {
      return parsed.message.join("\n");
    }

    if (typeof parsed.message === "string") {
      return parsed.message;
    }
  } catch {
    return body;
  }

  return body;
}

function isApiSuccessResponse<T>(
  body: T | ApiSuccessResponse<T>,
): body is ApiSuccessResponse<T> {
  return (
    typeof body === "object" &&
    body !== null &&
    "success" in body &&
    "data" in body
  );
}
