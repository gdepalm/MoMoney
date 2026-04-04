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

export interface Invoice {
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
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export type UploadPhase =
  | "drop"
  | "processing"
  | "preview"
  | "confirming"
  | "done";

export interface Group {
  id: number;
  name: string;
  owner_id: number;
  columns: string[];
}

export interface Group {
  id: number;
  name: string;
  owner_id: number;
  columns: string[];
}