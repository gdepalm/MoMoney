import Link from "next/link";
import Icon from "@/components/ui/Icon";

const FEATURES = [
  {
    icon: "scan" as const,
    title: "AI Extraction",
    color: "bg-emerald-50 text-emerald-600",
    desc: "Upload any receipt and our AI instantly extracts every line item, total, and merchant detail.",
  },
  {
    icon: "table" as const,
    title: "Smart Spreadsheets",
    color: "bg-blue-50 text-blue-600",
    desc: "Organize extracted data into fully configurable spreadsheets with custom column types.",
  },
  {
    icon: "zap" as const,
    title: "One-Click Confirm",
    color: "bg-yellow-50 text-yellow-600",
    desc: "Review AI output, make edits if needed, then confirm insertion in a single click.",
  },
  {
    icon: "shield" as const,
    title: "Secure & Private",
    color: "bg-purple-50 text-purple-600",
    desc: "All your data is encrypted end-to-end and accessible only to you.",
  },
];

const DEMO_ROWS = [
  ["Jan 12", "Whole Foods", "Groceries", "$84.32"],
  ["Jan 13", "Shell Station", "Transport", "$62.10"],
  ["Jan 15", "Office Depot", "Office", "$124.89"],
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-10 h-16 bg-white/90 backdrop-blur-md border-b border-slate-100 flex items-center px-8 gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-600 rounded-[9px] flex items-center justify-center text-white flex-shrink-0">
            <Icon name="scan" size={16} stroke={2} />
          </div>
          <span className="font-bold text-[15px] text-slate-900 tracking-tight">
            MoMoney
          </span>
        </div>
        <div className="flex-1" />
        <Link
          href="/login"
          className="px-4 py-2 text-[13px] font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/login"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold rounded-xl transition-colors shadow-sm"
        >
          Get started free
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto w-full px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-4 py-1.5 text-[12px] font-bold tracking-wide mb-8">
          <Icon name="zap" size={12} stroke={2} />
          AI-powered data extraction
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 leading-[1.07] tracking-tight mb-5">
          Turn receipts into
          <br />
          <span className="text-emerald-600">structured data</span>
          <br />
          instantly
        </h1>

        <p className="text-lg text-slate-500 leading-relaxed max-w-xl mx-auto mb-10 font-normal">
          Upload any receipt image and watch AI extract every detail into clean,
          organized spreadsheets. No manual entry. No errors.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[15px] font-semibold transition-all hover:shadow-lg hover:shadow-emerald-100 hover:-translate-y-0.5"
          >
            Start for free
            <Icon name="arrowRight" size={16} />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-[15px] font-semibold transition-colors"
          >
            See features
          </a>
        </div>

        {/* Demo window */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 max-w-2xl mx-auto shadow-lg">
          <div className="flex gap-1.5 mb-4">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {["Date", "Merchant", "Category", "Amount"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEMO_ROWS.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                  >
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={`px-4 py-2.5 text-[13px] text-slate-700 ${j === 3 ? "font-mono font-semibold" : ""}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-3">
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-3 py-1 text-[11px] font-bold">
              <Icon name="check" size={10} stroke={2.5} />
              AI extracted 3 items · 94% confidence
            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="bg-slate-50 border-y border-slate-100 py-20"
      >
        <div className="max-w-4xl mx-auto px-8">
          <p className="text-center text-[12px] font-bold uppercase tracking-widest text-slate-400 mb-12">
            Why MoMoney
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}
                >
                  <Icon name={f.icon} size={20} stroke={1.75} />
                </div>
                <h3 className="font-bold text-[14px] text-slate-900 mb-2 tracking-tight">
                  {f.title}
                </h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center px-8">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">
          Ready to get started?
        </h2>
        <p className="text-slate-500 mb-8">
          Join thousands saving hours on manual data entry.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[15px] font-semibold transition-all hover:shadow-lg hover:shadow-emerald-100"
        >
          Sign in with Google — it&apos;s free
          <Icon name="arrowRight" size={16} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-100 py-6 px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-emerald-600 rounded-md flex items-center justify-center text-white">
            <Icon name="scan" size={12} stroke={2} />
          </div>
          <span className="text-[13px] font-bold text-slate-700">MoMoney</span>
        </div>
        <span className="text-[12px] text-slate-400">
          © 2026 MoMoney. All rights reserved.
        </span>
      </footer>
    </div>
  );
}
