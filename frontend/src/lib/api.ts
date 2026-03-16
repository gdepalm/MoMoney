import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { Spreadsheet, SpreadsheetSummary, AIPreviewData, Column } from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
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
  googleLogin: () => { window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`; },
  getMe: ()    => api.get("/auth/me").then((r) => r.data),
  logout: ()   => api.post("/auth/logout").then((r) => r.data),
};

export const spreadsheetsApi = {
  list:   (): Promise<SpreadsheetSummary[]>         => api.get("/spreadsheets").then((r) => r.data),
  get:    (id: string): Promise<Spreadsheet>        => api.get(`/spreadsheets/${id}`).then((r) => r.data),
  create: (data: { name: string; description?: string }): Promise<Spreadsheet> =>
    api.post("/spreadsheets", data).then((r) => r.data),
  update: (id: string, data: Partial<Spreadsheet>): Promise<Spreadsheet> =>
    api.put(`/spreadsheets/${id}`, data).then((r) => r.data),
  delete: (id: string): Promise<void>               => api.delete(`/spreadsheets/${id}`).then((r) => r.data),
  updateColumns: (id: string, columns: Omit<Column, "id">[]): Promise<Column[]> =>
    api.put(`/spreadsheets/${id}/columns`, { columns }).then((r) => r.data),
  updateRow: (sheetId: string, rowId: string, data: Record<string, string | number | null>) =>
    api.put(`/spreadsheets/${sheetId}/rows/${rowId}`, data).then((r) => r.data),
  deleteRow: (sheetId: string, rowId: string) =>
    api.delete(`/spreadsheets/${sheetId}/rows/${rowId}`).then((r) => r.data),
};

export const receiptApi = {
  upload: (spreadsheetId: string, file: File): Promise<{ jobId: string; preview: AIPreviewData }> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("spreadsheetId", spreadsheetId);
    return api.post("/upload-receipt", fd, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
  },
  insertToSheet: (
    spreadsheetId: string,
    jobId: string,
    items: Record<string, string | number | null>[]
  ): Promise<{ success: boolean; insertedRows: number }> =>
    api.post("/insert-to-sheet", { spreadsheetId, jobId, items }).then((r) => r.data),
};

export default api;