import { Column, InvoiceRow, InvoiceSummary, ExtractedItem } from "@/types";

export const SAMPLE_INVOICES: InvoiceSummary[] = [
  { id: "s1", name: "January Expenses",   description: "Office & travel receipts", rowCount: 24, columnCount: 5, updatedAt: "2025-01-28", createdAt: "2025-01-01" },
  { id: "s2", name: "Q1 Business Travel", description: "Hotels, flights, meals",   rowCount: 17, columnCount: 6, updatedAt: "2025-01-20", createdAt: "2025-01-01" },
  { id: "s3", name: "Marketing Budget",   description: "Ad spend & software",       rowCount: 8,  columnCount: 4, updatedAt: "2025-01-15", createdAt: "2025-01-01" },
  { id: "s4", name: "Team Meals",         description: "Restaurant receipts",       rowCount: 31, columnCount: 4, updatedAt: "2025-01-10", createdAt: "2025-01-01" },
];

export const SAMPLE_COLUMNS: Column[] = [
  { id: "c1", name: "Date",     type: "date",       order: 0 },
  { id: "c2", name: "Merchant", type: "text",       order: 1 },
  { id: "c3", name: "Category", type: "ai_extract", order: 2 },
  { id: "c4", name: "Amount",   type: "number",     order: 3 },
  { id: "c5", name: "Notes",    type: "text",       order: 4 },
];

export const SAMPLE_ROWS: InvoiceRow[] = [
  { id: "r1", c1: "Jan 12, 2025", c2: "Whole Foods Market",  c3: "Groceries",      c4: "$84.32",  c5: "Team lunch supplies"    },
  { id: "r2", c1: "Jan 13, 2025", c2: "Shell Gas Station",   c3: "Transportation", c4: "$62.10",  c5: "Client visit fuel"      },
  { id: "r3", c1: "Jan 15, 2025", c2: "Office Depot",        c3: "Office Supplies",c4: "$124.89", c5: "Printer paper & toner"  },
  { id: "r4", c1: "Jan 17, 2025", c2: "Delta Airlines",      c3: "Travel",         c4: "$340.00", c5: "NYC conference flight"  },
  { id: "r5", c1: "Jan 19, 2025", c2: "Marriott Hotels",     c3: "Accommodation",  c4: "$289.00", c5: "2 nights NYC"           },
  { id: "r6", c1: "Jan 22, 2025", c2: "Uber Technologies",   c3: "Transportation", c4: "$18.50",  c5: "Airport to hotel"       },
];

export const EXTRACTED_PREVIEW: ExtractedItem[] = [
  { c1: "Jan 28, 2025", c2: "Starbucks Coffee", c3: "Food & Beverage", c4: "$23.45", c5: "Team meeting" },
  { c1: "Jan 28, 2025", c2: "Starbucks Coffee", c3: "Food & Beverage", c4: "$4.75",  c5: "Tip"          },
];

export const COLUMN_TYPE_BADGE: Record<string, { cls: string; label: string }> = {
  text:       { cls: "bg-slate-100 text-slate-500",   label: "T"  },
  number:     { cls: "bg-blue-100 text-blue-700",     label: "#"  },
  date:       { cls: "bg-yellow-100 text-yellow-700", label: "D"  },
  ai_extract: { cls: "bg-purple-100 text-purple-700", label: "AI" },
};