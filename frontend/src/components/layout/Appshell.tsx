"use client";

import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import CreateInvoiceModal from "@/components/modals/CreateSpreadsheetModal";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onCreateNew={() => setShowCreate(true)} />
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
      <CreateInvoiceModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}