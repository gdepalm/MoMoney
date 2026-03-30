import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { Invoice, InvoiceSummary, AIPreviewData, Column } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  googleLogin: () => { window.location.href = `${API_URL}/auth/google`; },
  getUser: () => api.get("/users/").then((r) => {
    // Handle both direct user object and nested user object
    return r.data.user || r.data;
  }).catch(() => null),
  logout: () => api.post("/auth/logout").then((r) => r.data).catch(() => null),
};

export const groupsApi = {
  list: (): Promise<any[]> => api.get("/groups/").then((r) => r.data),
};

export const invoicesApi = {
  list:   (): Promise<InvoiceSummary[]>         => api.get("/invoices/").then((r) => r.data),
  get:    (id: string): Promise<Invoice>        => api.get(`/invoices/${id}`).then((r) => r.data),
  create: (payload: { groupId?: number; name?: string; description?: string; data?: Record<string, any>; image_url?: string }): Promise<Invoice> => {
    return (payload.groupId ? Promise.resolve(payload.groupId) : groupsApi.list().then(groups => groups[0]?.id)).then(groupId => {
      if (!groupId) throw new Error("No groups available. Please create a group first.");
      const data = payload.data || { name: payload.name, description: payload.description };
      return api.post(`/invoices/groups/${groupId}/invoices`, { data, image_url: payload.image_url }).then((r) => r.data);
    });
  },
  update: (id: string, payload: Partial<Invoice>): Promise<Invoice> =>
    api.patch(`/invoices/${id}`, payload).then((r) => r.data),
  delete: (id: string): Promise<void>               => api.delete(`/invoices/${id}`).then((r) => r.data),
};

export const receiptApi = {
  upload: (invoiceId: string, file: File): Promise<{ jobId: string; preview: AIPreviewData }> => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post(`/invoices/${invoiceId}/upload-receipt`, fd, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
  },
  insertToSheet: (
    invoiceId: string,
    jobId: string,
    items: Record<string, string | number | null>[]
  ): Promise<{ success: boolean; insertedRows: number }> =>
    api.post(`/invoices/${invoiceId}/insert-to-sheet`, { items }).then((r) => r.data),
};

export default api;