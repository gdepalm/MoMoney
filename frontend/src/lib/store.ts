import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, InvoiceSummary, Invoice, AIPreviewData, UploadPhase, Group } from "@/types";

interface AppStore {
  // Auth
  user: User | null;
  token: string | null;
  setUser: (u: User | null) => void;
  setToken: (t: string | null) => void;
  logout: () => void;

  // Groups
  groups: Group[];
  setGroups: (groups: Group[]) => void;
  addGroup: (group: Group) => void;
  removeGroup: (id: number) => void;

  // Invoices
  invoices: InvoiceSummary[];
  selectedInvoice: Invoice | null;
  setInvoices: (s: InvoiceSummary[]) => void;
  setSelectedInvoice: (s: Invoice | null) => void;
  addInvoice: (s: InvoiceSummary) => void;
  removeInvoice: (id: string) => void;

  // Backwards compatibility
  spreadsheets: InvoiceSummary[];
  selectedSpreadsheet: Invoice | null;
  setSpreadsheets: (s: InvoiceSummary[]) => void;
  setSelectedSpreadsheet: (s: Invoice | null) => void;
  addSpreadsheet: (s: InvoiceSummary) => void;
  removeSpreadsheet: (id: string) => void;

  // Upload
  uploadPhase: UploadPhase;
  uploadedFile: File | null;
  uploadedImageUrl: string | null;
  jobId: string | null;
  aiPreviewData: AIPreviewData | null;
  uploadError: string | null;
  setUploadPhase: (p: UploadPhase) => void;
  setUploadedFile: (f: File | null) => void;
  setUploadedImageUrl: (u: string | null) => void;
  setJobId: (id: string | null) => void;
  setAiPreviewData: (d: AIPreviewData | null) => void;
  setUploadError: (e: string | null) => void;
  resetUpload: () => void;
}

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => {
        set({ token });
        if (typeof window !== "undefined") {
          token ? localStorage.setItem("auth_token", token) : localStorage.removeItem("auth_token");
        }
      },
      logout: () => {
        if (typeof window !== "undefined") localStorage.removeItem("auth_token");
        set({ user: null, token: null });
      },

      // Groups
      groups: [],
      setGroups: (groups) => set({ groups }),
      addGroup: (group) => set((st) => ({ groups: [group, ...st.groups] })),
      removeGroup: (id) => set((st) => ({ groups: st.groups.filter((g) => g.id !== id) })),

      // Invoices
      invoices: [],
      selectedInvoice: null,
      setInvoices: (invoices) => set({ invoices, spreadsheets: invoices }),
      setSelectedInvoice: (selectedInvoice) => set({ selectedInvoice, selectedSpreadsheet: selectedInvoice }),
      addInvoice: (s) => set((st) => { const newInvoices = [s, ...st.invoices]; return { invoices: newInvoices, spreadsheets: newInvoices }; }),
      removeInvoice: (id) => set((st) => { const newInvoices = st.invoices.filter((s) => s.id !== id); return { invoices: newInvoices, spreadsheets: newInvoices }; }),

      // Backwards compatibility
      spreadsheets: [],
      selectedSpreadsheet: null,
      setSpreadsheets: (spreadsheets) => set({ spreadsheets, invoices: spreadsheets }),
      setSelectedSpreadsheet: (selectedSpreadsheet) => set({ selectedSpreadsheet, selectedInvoice: selectedSpreadsheet }),
      addSpreadsheet: (s) => set((st) => { const newInvoices = [s, ...st.invoices]; return { invoices: newInvoices, spreadsheets: newInvoices }; }),
      removeSpreadsheet: (id) => set((st) => { const newInvoices = st.invoices.filter((s) => s.id !== id); return { invoices: newInvoices, spreadsheets: newInvoices }; }),

      // Upload
      uploadPhase: "drop",
      uploadedFile: null,
      uploadedImageUrl: null,
      jobId: null,
      aiPreviewData: null,
      uploadError: null,
      setUploadPhase: (uploadPhase) => set({ uploadPhase }),
      setUploadedFile: (uploadedFile) => set({ uploadedFile }),
      setUploadedImageUrl: (uploadedImageUrl) => set({ uploadedImageUrl }),
      setJobId: (jobId) => set({ jobId }),
      setAiPreviewData: (aiPreviewData) => set({ aiPreviewData }),
      setUploadError: (uploadError) => set({ uploadError }),
      resetUpload: () =>
        set({ uploadPhase: "drop", uploadedFile: null, uploadedImageUrl: null, jobId: null, aiPreviewData: null, uploadError: null }),
    }),
    {
      name: "receipt-ai-store",
      partialize: (s) => ({ user: s.user, token: s.token }),
    }
  )
);