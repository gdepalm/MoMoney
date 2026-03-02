"use client"
import { useState, useCallback, useRef, useEffect } from "react";

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, stroke = 1.75, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const Icons = {
  scan: "M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M9 12h6M12 9v6",
  grid: ["M3 3h7v7H3z", "M14 3h7v7h-7z", "M14 14h7v7h-7z", "M3 14h7v7H3z"],
  table: ["M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"],
  plus: "M12 5v14M5 12h14",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  settings: ["M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", "M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"],
  check: "M20 6 9 17l-5-5",
  chevronRight: "M9 18l6-6-6-6",
  chevronDown: "M6 9l6 6 6-6",
  logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  arrowLeft: "M19 12H5M12 19l-7-7 7-7",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
  zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  fileText: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M16 13H8", "M16 17H8", "M10 9H8"],
  x: "M18 6 6 18M6 6l12 12",
  pencil: ["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7", "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"],
  trash: ["M3 6h18", "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"],
  rows: ["M3 12h18", "M3 6h18", "M3 18h18"],
  calendar: ["M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"],
  image: ["M15 8h.01", "M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6z", "M3 16l5-5 4 4 3-3 4 4"],
  alertCircle: ["M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z", "M12 8v4", "M12 16h.01"],
  checkCircle: ["M22 11.08V12a10 10 0 1 1-5.93-9.14", "M22 4 12 14.01l-3-3"],
  grip: ["M9 5h2v2H9zM13 5h2v2h-2zM9 9h2v2H9zM13 9h2v2h-2zM9 13h2v2H9zM13 13h2v2h-2z"],
  refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
};

// ─── SAMPLE DATA ──────────────────────────────────────────────────────────────
const SAMPLE_SPREADSHEETS = [
  { id: "s1", name: "January Expenses", description: "Office & travel receipts", rowCount: 24, columnCount: 5, updatedAt: "2025-01-28" },
  { id: "s2", name: "Q1 Business Travel", description: "Hotels, flights, meals", rowCount: 17, columnCount: 6, updatedAt: "2025-01-20" },
  { id: "s3", name: "Marketing Budget", description: "Ad spend & software", rowCount: 8, columnCount: 4, updatedAt: "2025-01-15" },
  { id: "s4", name: "Team Meals", description: "Restaurant receipts", rowCount: 31, columnCount: 4, updatedAt: "2025-01-10" },
];

const SAMPLE_COLUMNS = [
  { id: "c1", name: "Date", type: "date", order: 0 },
  { id: "c2", name: "Merchant", type: "text", order: 1 },
  { id: "c3", name: "Category", type: "ai_extract", order: 2 },
  { id: "c4", name: "Amount", type: "number", order: 3 },
  { id: "c5", name: "Notes", type: "text", order: 4 },
];

const SAMPLE_ROWS = [
  { id: "r1", c1: "Jan 12, 2025", c2: "Whole Foods Market", c3: "Groceries", c4: "$84.32", c5: "Team lunch supplies" },
  { id: "r2", c1: "Jan 13, 2025", c2: "Shell Gas Station", c3: "Transportation", c4: "$62.10", c5: "Client visit fuel" },
  { id: "r3", c1: "Jan 15, 2025", c2: "Office Depot", c3: "Office Supplies", c4: "$124.89", c5: "Printer paper & toner" },
  { id: "r4", c1: "Jan 17, 2025", c2: "Delta Airlines", c3: "Travel", c4: "$340.00", c5: "NYC conference flight" },
  { id: "r5", c1: "Jan 19, 2025", c2: "Marriott Hotels", c3: "Accommodation", c4: "$289.00", c5: "2 nights NYC" },
  { id: "r6", c1: "Jan 22, 2025", c2: "Uber Technologies", c3: "Transportation", c4: "$18.50", c5: "Airport to hotel" },
];

const EXTRACTED_PREVIEW = [
  { c1: "Jan 28, 2025", c2: "Starbucks Coffee", c3: "Food & Beverage", c4: "$23.45", c5: "Team meeting" },
  { c1: "Jan 28, 2025", c2: "Starbucks Coffee", c3: "Food & Beverage", c4: "$4.75", c5: "Tip" },
];

// ─── STYLES ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --emerald: #059669;
    --emerald-light: #d1fae5;
    --emerald-mid: #6ee7b7;
    --emerald-dark: #047857;
    --gray-50: #f8fafc;
    --gray-100: #f1f5f9;
    --gray-200: #e2e8f0;
    --gray-300: #cbd5e1;
    --gray-400: #94a3b8;
    --gray-500: #64748b;
    --gray-600: #475569;
    --gray-700: #334155;
    --gray-800: #1e293b;
    --gray-900: #0f172a;
    --white: #ffffff;
    --shadow-sm: 0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04);
    --shadow: 0 4px 16px rgba(15,23,42,0.07), 0 2px 6px rgba(15,23,42,0.04);
    --shadow-lg: 0 12px 32px rgba(15,23,42,0.10), 0 4px 12px rgba(15,23,42,0.06);
    --radius: 14px;
    --radius-sm: 8px;
    --radius-lg: 20px;
    --font: 'Sora', sans-serif;
    --mono: 'JetBrains Mono', monospace;
  }

  body { font-family: var(--font); background: var(--gray-50); color: var(--gray-800); }

  /* Layout */
  .app { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
  .app-body { display: flex; flex: 1; overflow: hidden; }
  .main { flex: 1; overflow-y: auto; padding: 32px; background: var(--gray-50); }

  /* Navbar */
  .navbar {
    height: 60px; background: var(--white); border-bottom: 1px solid var(--gray-200);
    display: flex; align-items: center; padding: 0 24px; gap: 16px; flex-shrink: 0;
    box-shadow: var(--shadow-sm);
  }
  .navbar-logo { display: flex; align-items: center; gap: 10px; }
  .logo-mark {
    width: 32px; height: 32px; background: var(--emerald); border-radius: 9px;
    display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0;
  }
  .logo-text { font-weight: 700; font-size: 15px; color: var(--gray-900); letter-spacing: -0.3px; }
  .navbar-spacer { flex: 1; }
  .avatar {
    width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--emerald), #34d399);
    display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: 600;
    cursor: pointer;
  }
  .user-dropdown { position: relative; }
  .user-btn {
    display: flex; align-items: center; gap: 8px; padding: 6px 10px;
    border-radius: var(--radius-sm); cursor: pointer; background: none; border: none;
    font-family: var(--font); transition: background 0.15s;
  }
  .user-btn:hover { background: var(--gray-100); }
  .user-name { font-size: 13px; font-weight: 500; color: var(--gray-700); }
  .dropdown-menu {
    position: absolute; right: 0; top: calc(100% + 6px); width: 200px;
    background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius);
    box-shadow: var(--shadow-lg); overflow: hidden; z-index: 100;
    animation: fadeUp 0.15s ease;
  }
  .dropdown-header { padding: 12px 16px; border-bottom: 1px solid var(--gray-100); }
  .dropdown-name { font-size: 13px; font-weight: 600; color: var(--gray-800); }
  .dropdown-email { font-size: 11px; color: var(--gray-400); margin-top: 1px; }
  .dropdown-item {
    display: flex; align-items: center; gap: 8px; padding: 10px 16px;
    font-size: 13px; color: var(--gray-600); cursor: pointer; transition: background 0.12s; font-family: var(--font); background: none; border: none; width: 100%; text-align: left;
  }
  .dropdown-item:hover { background: var(--gray-50); color: var(--gray-800); }
  .dropdown-item.danger { color: #ef4444; }
  .dropdown-item.danger:hover { background: #fff5f5; }

  /* Sidebar */
  .sidebar {
    width: 220px; background: var(--white); border-right: 1px solid var(--gray-200);
    flex-shrink: 0; overflow-y: auto; display: flex; flex-direction: column;
  }
  .sidebar-section { padding: 16px 12px; }
  .sidebar-nav-item {
    display: flex; align-items: center; gap: 8px; padding: 8px 10px;
    border-radius: var(--radius-sm); cursor: pointer; transition: all 0.12s;
    font-size: 13px; font-weight: 500; color: var(--gray-500); user-select: none; border: none; background: none; font-family: var(--font); width: 100%;
  }
  .sidebar-nav-item:hover { background: var(--gray-100); color: var(--gray-700); }
  .sidebar-nav-item.active { background: var(--emerald-light); color: var(--emerald-dark); }
  .sidebar-label {
    font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
    color: var(--gray-400); padding: 4px 10px 8px; display: flex; align-items: center; justify-content: space-between;
  }
  .sidebar-add {
    width: 18px; height: 18px; border-radius: 4px; display: flex; align-items: center; justify-content: center;
    background: none; border: none; cursor: pointer; color: var(--gray-400); transition: all 0.12s;
  }
  .sidebar-add:hover { background: var(--gray-200); color: var(--gray-600); }
  .sidebar-sheet {
    display: flex; align-items: center; gap: 7px; padding: 7px 10px;
    border-radius: var(--radius-sm); cursor: pointer; transition: all 0.12s; color: var(--gray-500);
    font-size: 12.5px; font-weight: 500; border: none; background: none; font-family: var(--font); width: 100%; text-align: left;
  }
  .sidebar-sheet:hover { background: var(--gray-100); color: var(--gray-700); }
  .sidebar-sheet.active { background: var(--emerald-light); color: var(--emerald-dark); }
  .sidebar-divider { height: 1px; background: var(--gray-100); margin: 4px 12px; }

  /* Buttons */
  .btn {
    display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px;
    border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; cursor: pointer;
    border: none; font-family: var(--font); transition: all 0.15s; letter-spacing: -0.1px;
  }
  .btn-primary { background: var(--emerald); color: white; box-shadow: 0 2px 8px rgba(5,150,105,0.25); }
  .btn-primary:hover { background: var(--emerald-dark); box-shadow: 0 4px 12px rgba(5,150,105,0.35); transform: translateY(-1px); }
  .btn-secondary { background: var(--white); color: var(--gray-700); border: 1px solid var(--gray-200); }
  .btn-secondary:hover { background: var(--gray-50); border-color: var(--gray-300); }
  .btn-ghost { background: transparent; color: var(--gray-600); }
  .btn-ghost:hover { background: var(--gray-100); color: var(--gray-800); }
  .btn-danger { background: #fee2e2; color: #dc2626; }
  .btn-danger:hover { background: #fecaca; }
  .btn-sm { padding: 6px 12px; font-size: 12px; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }

  /* Cards */
  .card {
    background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius);
    box-shadow: var(--shadow-sm);
  }
  .card-hover { transition: all 0.2s; cursor: pointer; }
  .card-hover:hover { box-shadow: var(--shadow); transform: translateY(-2px); }

  /* Badge */
  .badge {
    display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px;
    border-radius: 99px; font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
  }
  .badge-emerald { background: var(--emerald-light); color: var(--emerald-dark); }
  .badge-gray { background: var(--gray-100); color: var(--gray-500); }
  .badge-purple { background: #f3e8ff; color: #7c3aed; }
  .badge-blue { background: #dbeafe; color: #1d4ed8; }
  .badge-yellow { background: #fef9c3; color: #854d0e; }

  /* Inputs */
  .input {
    width: 100%; padding: 9px 12px; border: 1.5px solid var(--gray-200); border-radius: var(--radius-sm);
    font-size: 13px; font-family: var(--font); color: var(--gray-800); background: var(--white);
    outline: none; transition: border-color 0.15s, box-shadow 0.15s;
  }
  .input:focus { border-color: var(--emerald); box-shadow: 0 0 0 3px rgba(5,150,105,0.12); }
  .input::placeholder { color: var(--gray-400); }
  textarea.input { resize: vertical; min-height: 80px; }
  select.input { cursor: pointer; }
  .label { font-size: 12px; font-weight: 600; color: var(--gray-600); margin-bottom: 5px; display: block; }

  /* Modal */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(15,23,42,0.4); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center; z-index: 200; padding: 24px;
    animation: fadeIn 0.15s ease;
  }
  .modal {
    background: var(--white); border-radius: var(--radius-lg); width: 100%; max-width: 480px;
    box-shadow: var(--shadow-lg); animation: slideUp 0.2s ease; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column;
  }
  .modal-wide { max-width: 600px; }
  .modal-header {
    display: flex; align-items: center; justify-content: space-between; padding: 20px 24px;
    border-bottom: 1px solid var(--gray-100); flex-shrink: 0;
  }
  .modal-title { font-size: 16px; font-weight: 700; color: var(--gray-900); letter-spacing: -0.3px; }
  .modal-body { padding: 24px; overflow-y: auto; flex: 1; }
  .modal-footer { padding: 16px 24px; border-top: 1px solid var(--gray-100); display: flex; gap: 10px; justify-content: flex-end; flex-shrink: 0; }
  .modal-close {
    width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
    background: none; border: none; cursor: pointer; color: var(--gray-400); transition: all 0.12s;
  }
  .modal-close:hover { background: var(--gray-100); color: var(--gray-600); }

  /* Page header */
  .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
  .page-title { font-size: 22px; font-weight: 700; color: var(--gray-900); letter-spacing: -0.5px; }
  .page-subtitle { font-size: 13px; color: var(--gray-400); margin-top: 3px; }

  /* Dashboard grid */
  .sheet-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
  .sheet-card { padding: 20px; }
  .sheet-icon {
    width: 40px; height: 40px; border-radius: 10px; background: var(--emerald-light);
    display: flex; align-items: center; justify-content: center; color: var(--emerald);
    margin-bottom: 14px;
  }
  .sheet-name { font-size: 14px; font-weight: 700; color: var(--gray-900); margin-bottom: 4px; letter-spacing: -0.2px; }
  .sheet-desc { font-size: 12px; color: var(--gray-400); line-height: 1.5; min-height: 18px; }
  .sheet-meta { display: flex; align-items: center; gap: 14px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--gray-100); }
  .sheet-meta-item { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--gray-400); }

  /* Table */
  .table-wrap { background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-sm); }
  .table { width: 100%; border-collapse: collapse; }
  .table th {
    text-align: left; padding: 11px 16px; font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.07em; color: var(--gray-400);
    background: var(--gray-50); border-bottom: 1px solid var(--gray-200); white-space: nowrap;
  }
  .table td { padding: 11px 16px; font-size: 13px; color: var(--gray-700); border-bottom: 1px solid var(--gray-100); vertical-align: middle; }
  .table tr:last-child td { border-bottom: none; }
  .table tbody tr { transition: background 0.1s; }
  .table tbody tr:hover { background: var(--gray-50); }
  .cell-edit {
    padding: 5px 8px; border: 1.5px solid var(--emerald); border-radius: 6px;
    font-size: 13px; font-family: var(--font); color: var(--gray-800); background: white;
    outline: none; width: 100%;
  }
  .table-footer { padding: 10px 16px; background: var(--gray-50); border-top: 1px solid var(--gray-100); font-size: 11px; color: var(--gray-400); }

  /* Upload zone */
  .dropzone {
    border: 2px dashed var(--gray-300); border-radius: var(--radius); padding: 48px 24px;
    text-align: center; transition: all 0.2s; cursor: pointer; background: var(--gray-50);
  }
  .dropzone:hover, .dropzone.drag { border-color: var(--emerald); background: #f0fdf4; }
  .dropzone-icon { width: 56px; height: 56px; border-radius: 14px; background: var(--white); border: 1px solid var(--gray-200); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: var(--gray-400); }
  .dropzone.drag .dropzone-icon { background: var(--emerald-light); border-color: var(--emerald-mid); color: var(--emerald); }
  .dropzone-title { font-size: 14px; font-weight: 600; color: var(--gray-700); margin-bottom: 4px; }
  .dropzone-sub { font-size: 12px; color: var(--gray-400); }
  .receipt-preview { border-radius: var(--radius); overflow: hidden; border: 1px solid var(--gray-200); background: var(--gray-50); position: relative; }
  .receipt-preview img { width: 100%; max-height: 280px; object-fit: contain; display: block; }
  .preview-clear { position: absolute; top: 10px; right: 10px; width: 28px; height: 28px; border-radius: 50%; background: white; border: 1px solid var(--gray-200); display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: var(--shadow-sm); transition: all 0.12s; }
  .preview-clear:hover { background: var(--gray-100); }

  /* AI processing */
  .processing-card { padding: 32px; text-align: center; }
  .processing-spinner {
    width: 56px; height: 56px; border-radius: 16px; background: var(--emerald-light);
    display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;
    position: relative;
  }
  .spin { animation: spin 1s linear infinite; }
  .processing-steps { margin-top: 24px; text-align: left; }
  .step-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; }
  .step-dot {
    width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; transition: all 0.3s;
  }
  .step-dot.done { background: var(--emerald-light); color: var(--emerald); }
  .step-dot.active { background: var(--emerald); color: white; }
  .step-dot.pending { background: var(--gray-100); color: var(--gray-300); }
  .step-label { font-size: 13px; font-weight: 500; transition: color 0.3s; }
  .step-label.done { color: var(--emerald); }
  .step-label.active { color: var(--gray-800); }
  .step-label.pending { color: var(--gray-300); }
  .step-bar { height: 3px; background: var(--gray-100); border-radius: 2px; margin-top: 4px; overflow: hidden; }
  .step-bar-fill { height: 100%; background: var(--emerald); border-radius: 2px; animation: fillBar 1.8s ease forwards; }

  /* Confidence bar */
  .confidence { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: var(--radius-sm); margin-bottom: 16px; font-size: 13px; }
  .confidence.high { background: var(--emerald-light); color: var(--emerald-dark); }
  .confidence.mid { background: #fef9c3; color: #854d0e; }

  /* Column config */
  .col-row { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid var(--gray-100); }
  .col-row:last-child { border-bottom: none; }
  .col-grip { color: var(--gray-300); cursor: grab; flex-shrink: 0; }

  /* Stats row */
  .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px; }
  .stat-card { padding: 16px 20px; }
  .stat-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--gray-400); margin-bottom: 6px; }
  .stat-value { font-size: 24px; font-weight: 700; color: var(--gray-900); letter-spacing: -0.5px; font-family: var(--mono); }

  /* Landing */
  .landing { background: var(--white); min-height: 100vh; overflow-y: auto; }
  .landing-nav { height: 64px; border-bottom: 1px solid var(--gray-100); display: flex; align-items: center; padding: 0 48px; gap: 16px; position: sticky; top: 0; background: rgba(255,255,255,0.9); backdrop-filter: blur(12px); z-index: 10; }
  .landing-hero { max-width: 960px; margin: 0 auto; padding: 80px 48px 60px; text-align: center; }
  .hero-pill {
    display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px;
    background: var(--emerald-light); color: var(--emerald-dark); border-radius: 99px;
    font-size: 12px; font-weight: 700; letter-spacing: 0.03em; margin-bottom: 28px;
  }
  .hero-title {
    font-size: clamp(36px, 6vw, 60px); font-weight: 700; line-height: 1.08;
    color: var(--gray-900); letter-spacing: -1.5px; margin-bottom: 20px;
  }
  .hero-title span { color: var(--emerald); }
  .hero-sub { font-size: 18px; color: var(--gray-500); line-height: 1.6; max-width: 560px; margin: 0 auto 36px; font-weight: 400; }
  .hero-cta { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 60px; }
  .hero-demo {
    background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: var(--radius-lg);
    padding: 24px; max-width: 680px; margin: 0 auto; box-shadow: var(--shadow-lg);
  }
  .demo-dots { display: flex; gap: 6px; margin-bottom: 16px; }
  .demo-dot { width: 10px; height: 10px; border-radius: 50%; }
  .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; max-width: 960px; margin: 0 auto; padding: 0 48px 80px; }
  .feature-card { padding: 24px; }
  .feature-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
  .feature-title { font-size: 15px; font-weight: 700; color: var(--gray-900); margin-bottom: 6px; letter-spacing: -0.2px; }
  .feature-desc { font-size: 13px; color: var(--gray-500); line-height: 1.6; }
  .section-label { font-size: 13px; font-weight: 600; text-align: center; color: var(--gray-400); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 40px; }
  .features-section { padding: 60px 0; background: var(--gray-50); border-top: 1px solid var(--gray-100); border-bottom: 1px solid var(--gray-100); }
  .cta-section { padding: 80px 48px; text-align: center; }
  .footer { padding: 24px 48px; border-top: 1px solid var(--gray-100); display: flex; align-items: center; justify-content: space-between; }
  .footer-text { font-size: 12px; color: var(--gray-400); }

  /* Login */
  .login-page { min-height: 100vh; background: var(--gray-50); display: flex; align-items: center; justify-content: center; padding: 24px; }
  .login-card { background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-lg); padding: 40px; max-width: 380px; width: 100%; box-shadow: var(--shadow-lg); }
  .google-btn {
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
    padding: 12px 20px; border: 1.5px solid var(--gray-200); border-radius: var(--radius-sm);
    background: var(--white); cursor: pointer; font-size: 14px; font-weight: 600; color: var(--gray-700);
    font-family: var(--font); transition: all 0.15s;
  }
  .google-btn:hover { border-color: var(--gray-300); background: var(--gray-50); box-shadow: var(--shadow-sm); }

  /* Upload page */
  .upload-steps { display: flex; gap: 0; margin-bottom: 32px; }
  .upload-step { display: flex; align-items: center; gap: 8px; flex: 1; }
  .step-num { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
  .step-num.done { background: var(--emerald); color: white; }
  .step-num.current { background: var(--emerald-light); color: var(--emerald-dark); border: 2px solid var(--emerald); }
  .step-num.pending { background: var(--gray-100); color: var(--gray-400); }
  .step-name { font-size: 12px; font-weight: 600; }
  .step-name.done { color: var(--emerald); }
  .step-name.current { color: var(--emerald-dark); }
  .step-name.pending { color: var(--gray-400); }
  .step-connector { flex: 1; height: 2px; background: var(--gray-200); margin: 0 6px; border-radius: 1px; }
  .step-connector.done { background: var(--emerald); }

  /* Animations */
  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
  @keyframes fillBar { from { width: 0 } to { width: 100% } }
  @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
  .fade-in { animation: fadeInUp 0.25s ease both; }

  /* Empty state */
  .empty { text-align: center; padding: 64px 24px; }
  .empty-icon { width: 56px; height: 56px; border-radius: 16px; background: var(--gray-100); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: var(--gray-400); }
  .empty-title { font-size: 15px; font-weight: 700; color: var(--gray-700); margin-bottom: 6px; }
  .empty-sub { font-size: 13px; color: var(--gray-400); margin-bottom: 20px; }

  /* Misc */
  .back-btn { display: flex; align-items: center; gap: 6px; color: var(--gray-400); font-size: 13px; font-weight: 500; cursor: pointer; background: none; border: none; font-family: var(--font); padding: 6px 0; transition: color 0.12s; }
  .back-btn:hover { color: var(--gray-600); }
  .spacer { flex: 1; }
  .row { display: flex; align-items: center; gap: 10px; }
  .row-between { display: flex; align-items: center; justify-content: space-between; }
  .col { display: flex; flex-direction: column; gap: 8px; }
  .mt-1 { margin-top: 4px; } .mt-2 { margin-top: 8px; } .mt-3 { margin-top: 12px; } .mt-4 { margin-top: 16px; } .mt-6 { margin-top: 24px; }
  .mb-1 { margin-bottom: 4px; } .mb-2 { margin-bottom: 8px; } .mb-3 { margin-bottom: 12px; }
  .gap-2 { gap: 8px; } .gap-3 { gap: 12px; }
  .text-sm { font-size: 13px; } .text-xs { font-size: 11px; }
  .text-muted { color: var(--gray-400); } .text-green { color: var(--emerald); }
  .fw-500 { font-weight: 500; } .fw-600 { font-weight: 600; } .fw-700 { font-weight: 700; }
  .mono { font-family: var(--mono); }
  .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .success-screen { display: flex; align-items: center; justify-content: center; flex: 1; padding: 48px; }
  .success-card { text-align: center; max-width: 400px; }
  .success-icon { width: 72px; height: 72px; border-radius: 20px; background: var(--emerald-light); display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; color: var(--emerald); }
  .type-pill { display: inline-flex; align-items: center; padding: 2px 7px; border-radius: 5px; font-size: 10px; font-weight: 700; }
`;

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function Navbar({ onNavigate, page }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="navbar">
      <div className="navbar-logo" onClick={() => onNavigate("dashboard")} style={{ cursor: "pointer" }}>
        <div className="logo-mark"><Icon d={Icons.scan} size={16} stroke={2} /></div>
        <span className="logo-text">MoMoney</span>
      </div>
      <div className="spacer" />
      <div className="user-dropdown" ref={ref}>
        <button className="user-btn" onClick={() => setOpen(!open)}>
          <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>JS</div>
          <span className="user-name">Jane Smith</span>
          <Icon d={Icons.chevronDown} size={13} className="text-muted" />
        </button>
        {open && (
          <div className="dropdown-menu">
            <div className="dropdown-header">
              <div className="dropdown-name">Jane Smith</div>
              <div className="dropdown-email">jane@company.com</div>
            </div>
            <button className="dropdown-item danger" onClick={() => { setOpen(false); onNavigate("landing"); }}>
              <Icon d={Icons.logout} size={14} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Sidebar({ onNavigate, page, spreadsheets, onCreateNew }) {
  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <button
          className={`sidebar-nav-item ${page === "dashboard" ? "active" : ""}`}
          onClick={() => onNavigate("dashboard")}
        >
          <Icon d={Icons.grid} size={14} />
          Dashboard
        </button>
      </div>
      <div className="sidebar-divider" />
      <div className="sidebar-section" style={{ paddingTop: 12 }}>
        <div className="sidebar-label">
          Spreadsheets
          <button className="sidebar-add" onClick={onCreateNew}><Icon d={Icons.plus} size={12} /></button>
        </div>
        {spreadsheets.map(s => (
          <button
            key={s.id}
            className={`sidebar-sheet ${page === `sheet-${s.id}` ? "active" : ""}`}
            onClick={() => onNavigate(`sheet-${s.id}`, s)}
          >
            <Icon d={Icons.fileText} size={13} />
            <span className="truncate" style={{ maxWidth: 140 }}>{s.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CreateModal({ open, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  if (!open) return null;
  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), description: desc.trim() });
    setName(""); setDesc("");
    onClose();
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">New Spreadsheet</span>
          <button className="modal-close" onClick={onClose}><Icon d={Icons.x} size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="col">
            <div>
              <label className="label">Name *</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., January Expenses" autoFocus onKeyDown={e => e.key === "Enter" && handleCreate()} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional description..." rows={3} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={!name.trim()}>
            <Icon d={Icons.plus} size={14} />
            Create Spreadsheet
          </button>
        </div>
      </div>
    </div>
  );
}

function ColumnConfigModal({ open, onClose, columns: initCols, onSave }) {
  const [cols, setCols] = useState(initCols);
  if (!open) return null;
  const addCol = () => setCols([...cols, { id: `nc${Date.now()}`, name: "", type: "text", order: cols.length }]);
  const removeCol = i => setCols(cols.filter((_, idx) => idx !== i));
  const update = (i, field, val) => setCols(cols.map((c, idx) => idx === i ? { ...c, [field]: val } : c));

  const TYPE_COLORS = { text: "badge-gray", number: "badge-blue", date: "badge-yellow", ai_extract: "badge-purple" };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Configure Columns</span>
          <button className="modal-close" onClick={onClose}><Icon d={Icons.x} size={16} /></button>
        </div>
        <div className="modal-body" style={{ maxHeight: 440 }}>
          {cols.length === 0 && <p className="text-sm text-muted" style={{ textAlign: "center", padding: "20px 0" }}>No columns. Add one below.</p>}
          {cols.map((col, i) => (
            <div className="col-row" key={col.id || i}>
              <div className="col-grip"><Icon d={Icons.grip} size={14} /></div>
              <input className="input" style={{ flex: 1 }} value={col.name} onChange={e => update(i, "name", e.target.value)} placeholder="Column name" />
              <select className="input" style={{ width: 130 }} value={col.type} onChange={e => update(i, "type", e.target.value)}>
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="ai_extract">AI Extract</option>
              </select>
              <span className={`badge ${TYPE_COLORS[col.type]}`} style={{ minWidth: 24 }}>
                {col.type === "ai_extract" ? "AI" : col.type[0].toUpperCase()}
              </span>
              <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray-300)", padding: 4, borderRadius: 6, transition: "all 0.1s" }}
                onClick={() => removeCol(i)}
                onMouseEnter={e => e.target.style.color = "#ef4444"}
                onMouseLeave={e => e.target.style.color = "var(--gray-300)"}>
                <Icon d={Icons.trash} size={14} />
              </button>
            </div>
          ))}
          <button className="btn btn-ghost btn-sm mt-3" onClick={addCol}>
            <Icon d={Icons.plus} size={13} />
            Add Column
          </button>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={() => { onSave(cols); onClose(); }}>
            <Icon d={Icons.check} size={13} />
            Save Columns
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PAGES ───────────────────────────────────────────────────────────────────

function LandingPage({ onNavigate }) {
  const features = [
    { icon: Icons.scan, label: "AI Extraction", color: "#d1fae5", ic: "#059669", desc: "Upload any receipt and our AI instantly extracts every line item, total, and merchant detail." },
    { icon: Icons.table, label: "Smart Spreadsheets", color: "#dbeafe", ic: "#1d4ed8", desc: "Organize extracted data into fully configurable spreadsheets with custom column types." },
    { icon: Icons.zap, label: "One-Click Confirm", color: "#fef9c3", ic: "#854d0e", desc: "Review AI output, make edits if needed, then confirm insertion in a single click." },
    { icon: Icons.shield, label: "Secure & Private", color: "#f3e8ff", ic: "#7c3aed", desc: "All your data is encrypted end-to-end and accessible only to you." },
  ];

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="navbar-logo">
          <div className="logo-mark"><Icon d={Icons.scan} size={16} stroke={2} /></div>
          <span className="logo-text">MoMoney</span>
        </div>
        <div className="spacer" />
        <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("login")}>Sign in</button>
        <button className="btn btn-primary btn-sm" onClick={() => onNavigate("login")}>Get started free</button>
      </nav>

      <div className="landing-hero">
        <div className="hero-pill">
          <Icon d={Icons.zap} size={12} stroke={2} />
          AI-powered data extraction
        </div>
        <h1 className="hero-title">
          Turn receipts into<br />
          <span>structured data</span><br />
          instantly
        </h1>
        <p className="hero-sub">
          Upload any receipt image and watch AI extract every detail into clean, organized spreadsheets. No manual entry. No errors.
        </p>
        <div className="hero-cta">
          <button className="btn btn-primary" style={{ fontSize: 15, padding: "12px 28px", borderRadius: 12 }} onClick={() => onNavigate("login")}>
            Start for free
            <Icon d={Icons.arrowRight} size={16} />
          </button>
          <button className="btn btn-secondary" style={{ fontSize: 15, padding: "12px 28px", borderRadius: 12 }}>
            View demo
          </button>
        </div>

        <div className="hero-demo">
          <div className="demo-dots">
            <div className="demo-dot" style={{ background: "#fc8181" }} />
            <div className="demo-dot" style={{ background: "#f6ad55" }} />
            <div className="demo-dot" style={{ background: "#68d391" }} />
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr>
                {["Date", "Merchant", "Category", "Amount"].map(h => <th key={h}>{h}</th>)}
              </tr></thead>
              <tbody>
                {[
                  ["Jan 12", "Whole Foods", "Groceries", "$84.32"],
                  ["Jan 13", "Shell Station", "Transport", "$62.10"],
                  ["Jan 15", "Office Depot", "Office", "$124.89"],
                ].map((row, i) => <tr key={i}>{row.map((c, j) => <td key={j} className={j === 3 ? "mono fw-600" : ""}>{c}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <span className="badge badge-emerald"><Icon d={Icons.check} size={10} stroke={2.5} />AI extracted 3 items · 94% confidence</span>
          </div>
        </div>
      </div>

      <div className="features-section">
        <div className="section-label">Why MoMoney</div>
        <div className="feature-grid">
          {features.map(f => (
            <div key={f.label} className="card feature-card card-hover">
              <div className="feature-icon" style={{ background: f.color }}><Icon d={f.icon} size={20} stroke={1.75} style={{ color: f.ic }} /></div>
              <div className="feature-title">{f.label}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="cta-section">
        <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.8, color: "var(--gray-900)", marginBottom: 12 }}>Ready to get started?</h2>
        <p style={{ fontSize: 16, color: "var(--gray-500)", marginBottom: 32 }}>Join thousands saving hours on manual data entry.</p>
        <button className="btn btn-primary" style={{ fontSize: 15, padding: "14px 32px", borderRadius: 14 }} onClick={() => onNavigate("login")}>
          Sign in with Google — it's free
          <Icon d={Icons.arrowRight} size={16} />
        </button>
      </div>

    <section
      style={{
        background: "#f4f6f9",
        padding: "70px 20px",
        borderTop: "1px solid #ddd",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          fontFamily: "Arial, Helvetica, sans-serif",
          color: "#333",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "50px" }}>
          <h2 style={{ margin: 0, fontSize: "32px", fontWeight: 700 }}>
            MoMoney
          </h2>
          <p style={{ marginTop: "10px", fontSize: "18px", color: "#666" }}>
            AI-Powered Financial Automation Solution
          </p>
        </div>

        {/* Info & Team */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "40px",
            marginBottom: "50px",
          }}
        >
          {/* Project Info */}
          <div style={{ flex: 1, minWidth: "300px" }}>
            <h3
              style={{
                fontSize: "20px",
                marginBottom: "15px",
                borderBottom: "2px solid #222",
                display: "inline-block",
                paddingBottom: "5px",
              }}
            >
              Project Information
            </h3>
            <p>
              <strong>Project:</strong> Senior Project TI
            </p>
            <p>
              <strong>Product Type:</strong> Financial Technology
            </p>
            <p style={{ marginBottom: "5px" }}>
              <strong>Institution:</strong>
            </p>
            <p style={{ margin: 0 }}>
              Departemen Teknologi Elektro dan Teknologi Informasi
            </p>
            <p style={{ margin: 0 }}>Fakultas Teknik</p>
            <p style={{ margin: 0 }}>Universitas Gadjah Mada</p>
          </div>

          {/* Team Members */}
          <div style={{ flex: 1, minWidth: "300px" }}>
            <h3
              style={{
                fontSize: "20px",
                marginBottom: "15px",
                borderBottom: "2px solid #222",
                display: "inline-block",
                paddingBottom: "5px",
              }}
            >
              Team Members
            </h3>
            <ul style={{ paddingLeft: "20px", lineHeight: 1.8 }}>
              <li>Polikarpus Arya Pradhanika — 512404</li>
              <li>Gabriele Ghea De Palma — 512218</li>
              <li>Azfanova Sammy Rafif Saputra — 521764</li>
            </ul>
          </div>
        </div>

        {/* Background */}
        <div style={{ marginBottom: "50px" }}>
          <h3
            style={{
              fontSize: "20px",
              marginBottom: "15px",
              borderBottom: "2px solid #222",
              display: "inline-block",
              paddingBottom: "5px",
            }}
          >
            Background & Problem
          </h3>
          <p
            style={{
              textAlign: "justify",
              lineHeight: 1.8,
              color: "#555",
            }}
          >
            Di era transformasi digital, kecepatan pengolahan data menjadi kunci utama dalam menjaga akurasi laporan keuangan perusahaan.
            Namun, banyak organisasi masih terjebak dalam metode administrasi tradisional yang mengandalkan pemrosesan bukti transaksi secara manual.
            Fragmentasi antara transaksi lapangan dengan sistem akuntansi pusat seringkali menciptakan keterlambatan pelaporan.
            Tanpa adanya sistem yang mampu menjembatani jeda waktu tersebut, perusahaan berisiko mengalami ketidakakuratan data kas (settlement)
            yang dapat menghambat proses pengambilan keputusan strategis.
          </p>
        </div>

        {/* Solution */}
        <div>
          <h3
            style={{
              fontSize: "20px",
              marginBottom: "15px",
              borderBottom: "2px solid #222",
              display: "inline-block",
              paddingBottom: "5px",
            }}
          >
            Proposed Solution
          </h3>
          <ul style={{ paddingLeft: "20px", lineHeight: 1.8, color: "#555" }}>
            <li>Aplikasi berbasis AI untuk mengintegrasikan bukti transaksi fisik ke sistem pelaporan perusahaan secara instan.</li>
            <li>AI memindai dan mengonversi ribuan nota menjadi format digital siap integrasi.</li>
            <li>Validasi otomatis untuk mendeteksi duplikasi serta ketidaksesuaian nilai pajak dan diskon.</li>
            <li>Sinkronisasi langsung ke database pusat mempercepat proses tutup buku dari hitungan hari menjadi hitungan jam.</li>
            <li>Digitalisasi bukti transaksi memastikan arsip tersusun sistematis untuk mempermudah audit internal maupun eksternal.</li>
          </ul>
        </div>

        {/* Images */}
        <div
          style={{
            marginTop: "40px",
            display: "flex",
            flexDirection: "column",
            gap: "30px"
          }}
        >
          <img
            src="/MoMoney/images/modul1.1.jpeg"
            alt="modul1.1"
            style={{ width: "100%", height: "auto" }}
          />

          <img
            src="/MoMoney/images/modul1.2.jpeg"
            alt="modul1.2"
            style={{ width: "100%", height: "auto" }}
          />

          <img
            src="/MoMoney/images/modul1.3.jpeg"
            alt="modul1.3"
            style={{ width: "100%", height: "auto" }}
          />
        </div>
      </div>
    </section>

      <div className="footer">
        <div className="navbar-logo">
          <div className="logo-mark" style={{ width: 24, height: 24 }}><Icon d={Icons.scan} size={12} stroke={2} /></div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--gray-700)" }}>MoMoney</span>
        </div>
        <span className="footer-text">© 2025 MoMoney. All rights reserved.</span>
      </div>
    </div>
  );
}

function LoginPage({ onNavigate }) {
  const [loading, setLoading] = useState(false);
  const handleGoogle = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onNavigate("dashboard"); }, 1400);
  };
  return (
    <div className="login-page"style={{ gap: 48 }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div className="logo-mark" style={{ width: 52, height: 52, borderRadius: 14, margin: "0 auto 16px" }}>
          <Icon d={Icons.scan} size={22} stroke={2} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: "var(--gray-900)", marginBottom: 6 }}>Welcome to MoMoney</h1>
        <p style={{ fontSize: 13, color: "var(--gray-400)" }}>Sign in to manage your receipt spreadsheets</p>
      </div>
      <div className="login-card">
        <button className="google-btn" onClick={handleGoogle} disabled={loading}>
          {loading
            ? <div style={{ width: 18, height: 18, border: "2.5px solid var(--gray-200)", borderTopColor: "var(--emerald)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            : <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
          }
          {loading ? "Signing in..." : "Continue with Google"}
        </button>
        <p style={{ fontSize: 11, color: "var(--gray-400)", textAlign: "center", marginTop: 20, lineHeight: 1.5 }}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

function DashboardPage({ spreadsheets, onNavigate, onCreateNew }) {
  return (
    <div className="main fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">{spreadsheets.length} spreadsheet{spreadsheets.length !== 1 ? "s" : ""}</div>
        </div>
        <button className="btn btn-primary" onClick={onCreateNew}>
          <Icon d={Icons.plus} size={15} />
          New Spreadsheet
        </button>
      </div>

      {spreadsheets.length === 0 ? (
        <div className="card empty">
          <div className="empty-icon"><Icon d={Icons.fileText} size={24} stroke={1.5} /></div>
          <div className="empty-title">No spreadsheets yet</div>
          <div className="empty-sub">Create your first spreadsheet to start organizing receipt data.</div>
          <button className="btn btn-primary" onClick={onCreateNew}>
            <Icon d={Icons.plus} size={14} />
            Create Spreadsheet
          </button>
        </div>
      ) : (
        <div className="sheet-grid">
          {spreadsheets.map((s, idx) => (
            <div
              key={s.id}
              className="card sheet-card card-hover fade-in"
              style={{ animationDelay: `${idx * 0.05}s` }}
              onClick={() => onNavigate(`sheet-${s.id}`, s)}
            >
              <div className="sheet-icon"><Icon d={Icons.table} size={20} stroke={1.75} /></div>
              <div className="sheet-name">{s.name}</div>
              <div className="sheet-desc">{s.description || "No description"}</div>
              <div className="sheet-meta">
                <div className="sheet-meta-item">
                  <Icon d={Icons.rows} size={11} />
                  {s.rowCount} rows
                </div>
                <div className="sheet-meta-item">
                  <Icon d={Icons.calendar} size={11} />
                  {s.updatedAt}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SpreadsheetPage({ sheet, onNavigate, onCreateNew }) {
  const [rows, setRows] = useState(SAMPLE_ROWS);
  const [columns, setColumns] = useState(SAMPLE_COLUMNS);
  const [editCell, setEditCell] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [showCols, setShowCols] = useState(false);

  const startEdit = (rowId, colId, val) => { setEditCell(`${rowId}-${colId}`); setEditVal(String(val ?? "")); };
  const saveEdit = (rowId, colId) => {
    setRows(rows.map(r => r.id === rowId ? { ...r, [colId]: editVal } : r));
    setEditCell(null);
  };

  const TYPE_BADGE = { text: ["badge-gray", "T"], number: ["badge-blue", "#"], date: ["badge-yellow", "D"], ai_extract: ["badge-purple", "AI"] };

  return (
    <div className="main fade-in">
      <button className="back-btn mb-2" onClick={() => onNavigate("dashboard")}>
        <Icon d={Icons.arrowLeft} size={14} /> Back to Dashboard
      </button>

      <div className="page-header" style={{ marginTop: 4 }}>
        <div>
          <div className="page-title">{sheet?.name || "Spreadsheet"}</div>
          <div className="page-subtitle">{sheet?.description || "Receipt data spreadsheet"}</div>
        </div>
        <div className="row">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowCols(true)}>
            <Icon d={Icons.settings} size={14} />
            Configure Columns
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate(`upload-${sheet?.id}`, sheet)}>
            <Icon d={Icons.upload} size={14} />
            Upload Receipt
          </button>
        </div>
      </div>

      <div className="stats-row">
        <div className="card stat-card"><div className="stat-label">Total Rows</div><div className="stat-value">{rows.length}</div></div>
        <div className="card stat-card"><div className="stat-label">Columns</div><div className="stat-value">{columns.length}</div></div>
        <div className="card stat-card"><div className="stat-label">Last Upload</div><div className="stat-value" style={{ fontSize: 16, paddingTop: 4 }}>Jan 22</div></div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {col.name}
                    <span className={`badge ${TYPE_BADGE[col.type][0]}`} style={{ padding: "1px 5px" }}>{TYPE_BADGE[col.type][1]}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id}>
                {columns.map(col => {
                  const key = `${row.id}-${col.id}`;
                  const isEditing = editCell === key;
                  return (
                    <td key={col.id} onDoubleClick={() => startEdit(row.id, col.id, row[col.id])}>
                      {isEditing ? (
                        <input
                          className="cell-edit"
                          autoFocus
                          value={editVal}
                          onChange={e => setEditVal(e.target.value)}
                          onBlur={() => saveEdit(row.id, col.id)}
                          onKeyDown={e => { if (e.key === "Enter") saveEdit(row.id, col.id); if (e.key === "Escape") setEditCell(null); }}
                        />
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "default" }}>
                          <span className={col.id === "c4" ? "mono fw-600" : ""}>{row[col.id] ?? "—"}</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">
          {rows.length} rows · Double-click any cell to edit
        </div>
      </div>

      <ColumnConfigModal open={showCols} onClose={() => setShowCols(false)} columns={columns} onSave={setColumns} />
    </div>
  );
}

function UploadPage({ sheet, onNavigate }) {
  const [phase, setPhase] = useState("drop"); // drop → processing → preview → done
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState("");
  const [stepState, setStepState] = useState([0, 0, 0]); // 0=pending,1=active,2=done
  const [editItems, setEditItems] = useState(EXTRACTED_PREVIEW.map(r => ({ ...r })));
  const [editCell, setEditCell] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [confirming, setConfirming] = useState(false);
  const fileInput = useRef(null);

  const columns = SAMPLE_COLUMNS;

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const startProcessing = () => {
    setPhase("processing");
    setStepState([1, 0, 0]);
    setTimeout(() => setStepState([2, 1, 0]), 1200);
    setTimeout(() => setStepState([2, 2, 1]), 2500);
    setTimeout(() => { setStepState([2, 2, 2]); setTimeout(() => setPhase("preview"), 400); }, 3800);
  };

  const confirmInsert = () => {
    setConfirming(true);
    setTimeout(() => { setConfirming(false); setPhase("done"); }, 1500);
  };

  const stepStatus = (i) => ["pending", "active", "done"][stepState[i]];

  const STEPS_META = [
    { label: "Reading receipt image", sub: "Analyzing visual content..." },
    { label: "Extracting line items", sub: "Parsing merchant, amounts..." },
    { label: "Structuring data", sub: "Mapping to your columns..." },
  ];

  // Done state
  if (phase === "done") return (
    <div className="main">
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
        <div className="success-card fade-in">
          <div className="success-icon"><Icon d={Icons.checkCircle} size={36} stroke={1.75} /></div>
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.6, marginBottom: 8 }}>Inserted Successfully!</h2>
          <p style={{ fontSize: 14, color: "var(--gray-400)", marginBottom: 32, lineHeight: 1.6 }}>
            {editItems.length} rows added to <strong style={{ color: "var(--gray-700)" }}>{sheet?.name}</strong>
          </p>
          <div className="col gap-3">
            <button className="btn btn-primary" onClick={() => onNavigate(`sheet-${sheet?.id}`, sheet)} style={{ justifyContent: "center" }}>
              View Spreadsheet
              <Icon d={Icons.arrowRight} size={15} />
            </button>
            <button className="btn btn-secondary" onClick={() => { setPhase("drop"); setPreview(null); setFileName(""); }} style={{ justifyContent: "center" }}>
              Upload Another Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const uploadStep = phase === "drop" ? "current" : "done";
  const procStep = phase === "processing" ? "current" : phase === "preview" || phase === "done" ? "done" : "pending";
  const prevStep = phase === "preview" ? "current" : "pending";

  return (
    <div className="main fade-in" style={{ maxWidth: 640, padding: "32px 32px 32px" }}>
      <button className="back-btn mb-3" onClick={() => onNavigate(`sheet-${sheet?.id}`, sheet)}>
        <Icon d={Icons.arrowLeft} size={14} /> Back to {sheet?.name}
      </button>

      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-title">Upload Receipt</div>
          <div className="page-subtitle">Extract data with AI and insert into spreadsheet</div>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="upload-steps mb-3" style={{ marginBottom: 28 }}>
        {[
          { n: "1", label: "Upload", s: uploadStep },
          { n: "2", label: "AI Processing", s: procStep },
          { n: "3", label: "Preview & Confirm", s: prevStep },
        ].map((step, i) => (
          <div key={i} className="upload-step">
            <div className={`step-num ${step.s}`}>{step.s === "done" ? <Icon d={Icons.check} size={11} stroke={3} /> : step.n}</div>
            <span className={`step-name ${step.s}`}>{step.label}</span>
            {i < 2 && <div className={`step-connector ${step.s === "done" ? "done" : ""}`} />}
          </div>
        ))}
      </div>

      {/* Phase: Drop */}
      {phase === "drop" && (
        <div className="col fade-in" style={{ gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            {preview ? (
              <div className="receipt-preview">
                <div style={{ background: "var(--gray-50)", padding: 20, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
                  <div style={{ textAlign: "center" }}>
                    <Icon d={Icons.fileText} size={48} stroke={1} style={{ color: "var(--gray-300)" }} />
                    <p style={{ fontSize: 13, color: "var(--gray-500)", marginTop: 12, fontWeight: 500 }}>{fileName}</p>
                    <p style={{ fontSize: 11, color: "var(--gray-400)" }}>Image ready for processing</p>
                  </div>
                </div>
                <button className="preview-clear" onClick={() => { setPreview(null); setFileName(""); }}>
                  <Icon d={Icons.x} size={12} />
                </button>
              </div>
            ) : (
              <div
                className={`dropzone ${dragOver ? "drag" : ""}`}
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInput.current?.click()}
              >
                <div className="dropzone-icon">
                  <Icon d={Icons.image} size={24} stroke={1.5} />
                </div>
                <div className="dropzone-title">{dragOver ? "Drop your receipt here" : "Drag & drop receipt image"}</div>
                <div className="dropzone-sub" style={{ marginTop: 4 }}>or click to browse · JPG, PNG, PDF supported</div>
                <input ref={fileInput} type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={e => handleFile(e.target.files?.[0])} />
              </div>
            )}
          </div>
          {preview && (
            <button className="btn btn-primary" style={{ justifyContent: "center" }} onClick={startProcessing}>
              Extract Data with AI
              <Icon d={Icons.zap} size={15} />
            </button>
          )}
          {!preview && (
            <div style={{ display: "flex", gap: 10 }}>
              {["receipt-sample.jpg", "coffee-receipt.png", "amazon-invoice.pdf"].map(name => (
                <button key={name} className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: "center", background: "var(--gray-100)", fontSize: 11 }}
                  onClick={() => { setFileName(name); setPreview("demo"); }}>
                  <Icon d={Icons.fileText} size={12} />
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Phase: Processing */}
      {phase === "processing" && (
        <div className="card processing-card fade-in">
          <div className="processing-spinner">
            <Icon d={Icons.scan} size={26} stroke={1.75} style={{ color: "var(--emerald)" }} className="spin" />
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.3 }}>AI Processing Receipt</h3>
          <p style={{ fontSize: 13, color: "var(--gray-400)", marginTop: 4 }}>Extracting data from your image...</p>
          <div className="processing-steps">
            {STEPS_META.map((step, i) => {
              const s = stepStatus(i);
              return (
                <div className="step-row" key={i}>
                  <div className={`step-dot ${s}`}>
                    {s === "done" ? <Icon d={Icons.check} size={12} stroke={3} /> : s === "active" ? "·" : ""}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className={`step-label ${s}`}>{step.label}</div>
                    {s === "active" && (
                      <>
                        <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 2 }}>{step.sub}</div>
                        <div className="step-bar mt-1"><div className="step-bar-fill" /></div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Phase: Preview */}
      {phase === "preview" && (
        <div className="col fade-in" style={{ gap: 16 }}>
          <div className={`confidence high`}>
            <Icon d={Icons.check} size={16} stroke={2.5} />
            <span><strong>94% confidence</strong> · AI extracted {editItems.length} items · Review and edit before confirming</span>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>{columns.map(c => <th key={c.id}>{c.name}</th>)}</tr>
              </thead>
              <tbody>
                {editItems.map((row, ri) => (
                  <tr key={ri}>
                    {columns.map(col => {
                      const k = `${ri}-${col.id}`;
                      const isEditing = editCell === k;
                      return (
                        <td key={col.id}>
                          {isEditing ? (
                            <input className="cell-edit" autoFocus value={editVal}
                              onChange={e => setEditVal(e.target.value)}
                              onBlur={() => { setEditItems(editItems.map((r, i) => i === ri ? { ...r, [col.id]: editVal } : r)); setEditCell(null); }}
                              onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") { setEditItems(editItems.map((r, i) => i === ri ? { ...r, [col.id]: editVal } : r)); setEditCell(null); } }}
                            />
                          ) : (
                            <span style={{ cursor: "pointer" }} onClick={() => { setEditCell(k); setEditVal(String(row[col.id] ?? "")); }}>
                              {row[col.id] || <span style={{ color: "var(--gray-300)" }}>—</span>}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="table-footer row" style={{ justifyContent: "space-between" }}>
              <button style={{ background: "none", border: "none", color: "var(--emerald)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)" }}
                onClick={() => setEditItems([...editItems, Object.fromEntries(columns.map(c => [c.id, ""]))])}>
                + Add row
              </button>
              <span>{editItems.length} items · Click cell to edit</span>
            </div>
          </div>

          <button className="btn btn-primary" style={{ justifyContent: "center" }} onClick={confirmInsert} disabled={confirming}>
            {confirming
              ? <div style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              : <Icon d={Icons.check} size={15} stroke={2.5} />}
            {confirming ? "Inserting..." : `Confirm & Insert ${editItems.length} Rows`}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState("landing");
  const [activeSheet, setActiveSheet] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [sheets, setSheets] = useState(SAMPLE_SPREADSHEETS);

  const navigate = (target, data = null) => {
    if (data) setActiveSheet(data);
    setPage(target);
  };

  const createSheet = ({ name, description }) => {
    const newSheet = {
      id: `s${Date.now()}`, name, description,
      rowCount: 0, columnCount: 5, updatedAt: new Date().toISOString().slice(0, 10),
    };
    setSheets(prev => [newSheet, ...prev]);
  };

  const isDashboardArea = page !== "landing" && page !== "login";

  return (
    <>
      <style>{css}</style>
      {page === "landing" && <LandingPage onNavigate={navigate} />}
      {page === "login" && <LoginPage onNavigate={navigate} />}
      {isDashboardArea && (
        <div className="app">
          <Navbar onNavigate={navigate} page={page} />
          <div className="app-body">
            <Sidebar
              onNavigate={navigate}
              page={page}
              spreadsheets={sheets}
              onCreateNew={() => setShowCreate(true)}
            />
            {page === "dashboard" && (
              <DashboardPage spreadsheets={sheets} onNavigate={navigate} onCreateNew={() => setShowCreate(true)} />
            )}
            {page.startsWith("sheet-") && (
              <SpreadsheetPage sheet={activeSheet || sheets.find(s => page === `sheet-${s.id}`)} onNavigate={navigate} onCreateNew={() => setShowCreate(true)} />
            )}
            {page.startsWith("upload-") && (
              <UploadPage sheet={activeSheet} onNavigate={navigate} />
            )}
          </div>
          <CreateModal open={showCreate} onClose={() => setShowCreate(false)} onCreate={createSheet} />
        </div>
      )}
    </>
  );
}