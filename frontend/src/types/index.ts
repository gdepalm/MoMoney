export type ColumnType = "text" | "number" | "date" | "ai_extract";

export interface Column {
  id: string;
  name: string;
  type: ColumnType;
  order: number;
}

export interface InvoiceRow {
  id: string;
  [colId: string]: string | number | null;
}

// ── Backend-aligned models ────────────────────────────────────────────────────
// Mirrors backend/domain/groups/schemas.py::GroupRead
export interface Group {
  id: number;
  name: string;
  owner_id: number;
  columns: string[];
}

// Mirrors backend/domain/invoices/schemas.py::InvoiceRead
export interface InvoiceRead {
  id: number;
  group_id: number;
  data: Record<string, unknown>;
  image_url?: string | null;
  created_at: string;
}

// Mirrors backend/domain/users/schemas.py::UserResponse (+ session shape)
export interface BackendUser {
  id: number;
  name: string;
  email: string;
  google_id?: string;
}

// ── Frontend view models (legacy/UI shape — superset of InvoiceRead) ──────────
// `data` is intentionally loose because it comes from a JSONB column on the
// backend and individual columns are user-defined per group.
export interface Invoice {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  id: string;
  name: string;
  description?: string;
  columns: Column[];
  rows: InvoiceRow[];
  rowCount: number;
  columnCount: number;
  createdAt: string;
  updatedAt: string;
  image_url?: string | null;
  group_id?: number;
}

export interface InvoiceSummary {
  id: string;
  name: string;
  description?: string;
  rowCount: number;
  columnCount: number;
  updatedAt: string;
  createdAt: string;
}

export interface ExtractedItem {
  [colId: string]: string | number | null;
}

export interface AIPreviewData {
  items: ExtractedItem[];
  confidence: number;
  rawText?: string;
}

export interface User {
  id: string | number;
  name: string;
  email: string;
  avatar?: string;
  google_id?: string;
}

export type UploadPhase =
  | "drop"
  | "processing"
  | "preview"
  | "confirming"
  | "done";
