import Link from "next/link";
import Icon from "@/components/ui/Icon";

const FEATURES = [
  {
    icon: "scan" as const,
    title: "AI Extraction",
    color: "bg-emerald-50 text-emerald-700",
    desc: "Upload any receipt and our AI instantly extracts every line item, total, and merchant detail.",
  },
  {
    icon: "table" as const,
    title: "Smart Spreadsheets",
    color: "bg-white text-teal-700 border border-teal-100",
    desc: "Organize extracted data into fully configurable spreadsheets with custom column types.",
  },
  {
    icon: "zap" as const,
    title: "One-Click Confirm",
    color: "bg-lime-50 text-lime-700",
    desc: "Review AI output, make edits if needed, then confirm insertion in a single click.",
  },
  {
    icon: "shield" as const,
    title: "Secure & Private",
    color: "bg-white text-violet-700 border border-violet-100",
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
    <div className="flex min-h-screen flex-col bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-emerald-100 bg-white/90 px-8 shadow-sm shadow-emerald-950/5 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-emerald-700 text-white shadow-sm shadow-emerald-900/15">
            <Icon name="scan" size={16} stroke={2} />
          </div>
          <span className="font-display text-xl font-semibold text-emerald-950">
            MoMoney
          </span>
        </div>
        <div className="flex-1" />
        <Link
          href="/login"
          className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-900/10 transition-colors hover:bg-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero */}
      <section className="border-b border-emerald-100 bg-[linear-gradient(180deg,#f7fff9_0%,#ffffff_74%)]">
        <div className="mx-auto w-full max-w-5xl px-8 pb-16 pt-20 text-center">
        <div className="mb-8 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm font-bold text-emerald-800 shadow-sm shadow-emerald-950/5">
          <Icon name="zap" size={12} stroke={2} />
          AI-powered data extraction
        </div>

        <h1 className="mb-5 font-display text-5xl font-medium leading-[1.04] text-[#153f32] sm:text-7xl">
          Turn receipts into
          <br />
          <span className="italic text-emerald-700">
            structured data
          </span>
          <br />
          instantly
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg leading-8 text-emerald-950/70 md:text-xl">
          Upload any receipt image and watch AI extract every detail into clean,
          organized spreadsheets. No manual entry. No errors.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
          <Link
            href="/login"
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-600 to-violet-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-900/10 transition-transform hover:-translate-y-0.5 hover:shadow-emerald-900/15 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            Start for free
            <Icon name="arrowRight" size={16} />
          </Link>
          <a
            href="#features"
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-emerald-200 bg-white/85 px-7 py-3.5 text-base font-semibold text-emerald-800 shadow-sm shadow-emerald-950/5 transition-colors hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            See features
          </a>
        </div>

        {/* Demo window */}
        <div className="mx-auto max-w-3xl rounded-2xl border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-950/10">
          <div className="flex gap-1.5 mb-4">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="overflow-hidden rounded-xl border border-emerald-100 bg-white">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-emerald-100 bg-emerald-50">
                  {["Date", "Merchant", "Category", "Amount"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-emerald-700/70"
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
                    className="border-b border-emerald-50 transition-colors last:border-0 hover:bg-emerald-50/40"
                  >
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={`px-4 py-3 text-sm text-emerald-950/80 ${j === 3 ? "font-mono font-semibold" : ""}`}
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
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
              <Icon name="check" size={10} stroke={2.5} />
              AI extracted 3 items · 94% confidence
            </span>
          </div>
        </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="border-b border-emerald-100 bg-white py-20"
      >
        <div className="max-w-4xl mx-auto px-8">
          <p className="mb-12 text-center text-sm font-bold uppercase tracking-widest text-emerald-700/60">
            Why MoMoney
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm shadow-emerald-950/5 transition-shadow hover:shadow-md hover:shadow-emerald-950/10"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}
                >
                  <Icon name={f.icon} size={20} stroke={1.75} />
                </div>
                <h3 className="mb-2 text-base font-bold text-emerald-950">
                  {f.title}
                </h3>
                <p className="text-sm leading-7 text-emerald-950/65">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#f8fff9] px-8 py-24 text-center">
        <h2 className="mb-3 font-display text-4xl font-semibold text-emerald-950">
          Ready to get started?
        </h2>
        <p className="mb-8 text-lg text-emerald-950/65">
          Join thousands saving hours on manual data entry.
        </p>
        <Link
          href="/login"
          className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-emerald-700 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-900/10 transition-colors hover:bg-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          Sign in with Google — it&apos;s free
          <Icon name="arrowRight" size={16} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="mt-auto flex items-center justify-between border-t border-emerald-100 bg-white/80 px-8 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-700 text-white">
            <Icon name="scan" size={12} stroke={2} />
          </div>
          <span className="font-display text-lg font-semibold text-emerald-950">MoMoney</span>
        </div>
        <span className="text-sm text-emerald-800/55">
          © 2026 MoMoney. All rights reserved.
        </span>
      </footer>
    </div>
  );
}
