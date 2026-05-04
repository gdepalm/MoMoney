import { Invoice, InvoiceRead, InvoiceSummary, AIPreviewData, Group } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  data: unknown;
  response: { status: number; data: unknown };
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.response = { status, data };
  }
}

interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  opts: RequestOptions = {},
): Promise<{ data: T; status: number }> {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    ...(opts.headers || {}),
  };
  if (!isForm && body !== undefined && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const url = path.startsWith("http") ? path : `${API_URL}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      credentials: "include",
      signal: opts.signal,
      body:
        body === undefined
          ? undefined
          : isForm
            ? (body as FormData)
            : JSON.stringify(body),
    });
  } catch (err) {
    throw new ApiError(
      err instanceof Error ? err.message : "Network error",
      0,
      null,
    );
  }

  const contentType = res.headers.get("content-type") || "";
  let data: unknown = null;
  if (res.status !== 204) {
    if (contentType.includes("application/json")) {
      data = await res.json().catch(() => null);
    } else {
      data = await res.text().catch(() => null);
    }
  }

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      // Clear the persisted user from the Zustand store too. Without this,
      // the login page's `if (user) router.replace("/dashboard")` would
      // immediately send us back here and trigger an infinite redirect loop.
      try {
        const raw = localStorage.getItem("receipt-ai-store");
        if (raw) {
          const parsed = JSON.parse(raw) as { state?: Record<string, unknown> };
          if (parsed?.state) {
            parsed.state.user = null;
            parsed.state.token = null;
            localStorage.setItem("receipt-ai-store", JSON.stringify(parsed));
          }
        }
      } catch {
        // ignore — best-effort cleanup
      }
      if (!window.location.pathname.startsWith("/login")) {
        window.location.replace("/login");
      }
    }
    const detail =
      (data && typeof data === "object" && "detail" in (data as object)
        ? String((data as { detail: unknown }).detail)
        : null) ||
      (typeof data === "string" ? data : null) ||
      res.statusText ||
      `Request failed with status ${res.status}`;
    throw new ApiError(detail, res.status, data);
  }

  return { data: data as T, status: res.status };
}

const api = {
  get: <T = unknown>(path: string, opts?: RequestOptions) =>
    request<T>("GET", path, undefined, opts),
  post: <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("POST", path, body, opts),
  patch: <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("PATCH", path, body, opts),
  put: <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("PUT", path, body, opts),
  delete: <T = unknown>(path: string, opts?: RequestOptions) =>
    request<T>("DELETE", path, undefined, opts),
};

export const authApi = {
  googleLogin: () => {
    if (typeof window !== "undefined") {
      window.location.href = `${API_URL}/auth/google`;
    }
  },
  testLogin: () =>
    api
      .post<{ message: string; user: { id: number; name: string; email: string } }>(
        "/test-login",
      )
      .then((r) => r.data.user),
  getUser: () =>
    api
      .get<{ message: string; user?: { id: number; name: string; email: string } }>(
        "/users/",
      )
      .then((r) => {
        const body = r.data as { user?: unknown } & Record<string, unknown>;
        return (body.user ?? body) as { id: number; name: string; email: string } | null;
      })
      .catch(() => null),
  logout: () =>
    api
      .post<{ message: string }>("/auth/logout")
      .then((r) => r.data)
      .catch(() => null),
};

export const groupsApi = {
  list: (): Promise<Group[]> =>
    api.get<Group[]>("/groups/").then((r) => r.data),
  create: (payload: { name: string; columns?: string[] }): Promise<Group> =>
    api.post<Group>("/groups/", payload).then((r) => r.data),
  get: (id: number): Promise<Group & { invoices?: Invoice[] }> =>
    api
      .get<Group & { invoices?: Invoice[] }>(`/groups/${id}`)
      .then((r) => r.data),
  update: (
    id: number,
    payload: { name?: string; columns?: string[] },
  ): Promise<Group> =>
    api.patch<Group>(`/groups/${id}`, payload).then((r) => r.data),
  remove: (id: number): Promise<void> =>
    api.delete<void>(`/groups/${id}`).then(() => undefined),
};

export const invoicesApi = {
  list: (): Promise<InvoiceRead[]> =>
    api.get<InvoiceRead[]>("/invoices/").then((r) => r.data),
  get: (id: string | number): Promise<InvoiceRead> =>
    api.get<InvoiceRead>(`/invoices/${id}`).then((r) => r.data),
  create: (payload: {
    groupId?: number;
    name?: string;
    description?: string;
    data?: Record<string, unknown>;
    image_url?: string;
  }): Promise<InvoiceRead> => {
    const resolveGroup: Promise<number | undefined> = payload.groupId
      ? Promise.resolve(payload.groupId)
      : groupsApi.list().then((groups) => groups[0]?.id);

    return resolveGroup.then((groupId) => {
      if (!groupId)
        throw new Error("No groups available. Please create a group first.");
      const data = payload.data || {
        name: payload.name,
        description: payload.description,
      };
      return api
        .post<InvoiceRead>(`/groups/${groupId}/invoices`, {
          data,
          image_url: payload.image_url,
        })
        .then((r) => r.data);
    });
  },
  update: (
    id: string | number,
    payload: Partial<Invoice> & Partial<Pick<InvoiceRead, "data" | "image_url">>,
  ): Promise<Invoice & InvoiceRead> =>
    api
      .patch<Invoice & InvoiceRead>(`/invoices/${id}`, payload)
      .catch((error) => {
        if (error instanceof ApiError && error.status === 405) {
          return api.patch<Invoice & InvoiceRead>(
            `/invoices/invoices/${id}`,
            payload,
          );
        }
        throw error;
      })
      .then((r) => r.data),
  delete: (id: string | number): Promise<void> =>
    api
      .delete<void>(`/invoices/${id}`)
      .catch((error) => {
        if (error instanceof ApiError && error.status === 405) {
          return api.delete<void>(`/invoices/invoices/${id}`);
        }
        throw error;
      })
      .then(() => undefined),
};

// Re-export so consumers can satisfy the (unused) Invoice import
export type { Invoice, InvoiceSummary };

export const receiptApi = {
  upload: (
    invoiceId: string,
    file: File,
  ): Promise<{ jobId: string; preview: AIPreviewData }> => {
    const fd = new FormData();
    fd.append("file", file);
    return api
      .post<{ jobId: string; preview: AIPreviewData }>(
        `/invoices/${invoiceId}/upload-receipt`,
        fd,
      )
      .then((r) => r.data);
  },
  insertToSheet: (
    invoiceId: string,
    _jobId: string,
    items: Record<string, string | number | null>[],
  ): Promise<{ success: boolean; insertedRows: number }> =>
    api
      .post<{ success: boolean; insertedRows: number }>(
        `/invoices/${invoiceId}/insert-to-sheet`,
        { items },
      )
      .then((r) => r.data),
};

export interface InvoiceExtraction {
  id: number;
  invoice_id: number;
  extracted_data: Record<string, unknown>;
  model?: string | null;
  created_at: string;
}

export const extractionsApi = {
  list: (invoiceId: number): Promise<InvoiceExtraction[]> =>
    api
      .get<InvoiceExtraction[]>(`/invoices/${invoiceId}/extractions`)
      .then((r) => r.data),
  create: (invoiceId: number, file?: File): Promise<InvoiceExtraction> => {
    if (file) {
      const fd = new FormData();
      fd.append("file", file);
      return api
        .post<InvoiceExtraction>(`/invoices/${invoiceId}/extractions`, fd)
        .then((r) => r.data);
    }
    return api
      .post<InvoiceExtraction>(`/invoices/${invoiceId}/extractions`)
      .then((r) => r.data);
  },
};

export default api;
