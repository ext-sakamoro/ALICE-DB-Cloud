import Link from "next/link";

const features = [
  {
    title: "Multi-Engine Storage",
    description:
      "Choose between LSM-Tree, B-Tree, and Columnar engines per workload. Write-optimized or read-optimized — ALICE-DB-Cloud adapts to your data patterns.",
  },
  {
    title: "ALICE-Zip Compression",
    description:
      "All data at rest is compressed with ALICE-Zip, delivering up to 3x storage savings with hardware-accelerated decompression on read paths.",
  },
  {
    title: "Backup & Replication",
    description:
      "One-click encrypted backups to object storage and synchronous multi-region replication with automatic failover and zero data loss guarantees.",
  },
];

const endpoints = [
  { method: "POST", path: "/api/v1/db/query", desc: "Execute SQL query" },
  { method: "POST", path: "/api/v1/db/write", desc: "Write records" },
  { method: "POST", path: "/api/v1/db/create", desc: "Create database/table" },
  { method: "POST", path: "/api/v1/db/backup", desc: "Trigger backup" },
  { method: "POST", path: "/api/v1/db/replica", desc: "Configure replica" },
  { method: "GET", path: "/api/v1/db/engines", desc: "List available engines" },
  { method: "GET", path: "/api/v1/db/stats", desc: "Runtime statistics" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-gray-100 font-sans">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
        <span className="text-xl font-bold text-green-400 tracking-tight">
          ALICE-DB-Cloud
        </span>
        <Link
          href="/dashboard/console"
          className="px-4 py-1.5 text-sm bg-green-600 hover:bg-green-500 text-gray-900 font-semibold rounded transition-colors"
        >
          Dashboard
        </Link>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 py-24">
        <h1 className="text-5xl font-extrabold mb-6 text-white leading-tight">
          Cloud-Native Database<br />
          <span className="text-green-400">for Every Workload</span>
        </h1>
        <p className="max-w-2xl mx-auto text-gray-400 text-lg mb-10">
          ALICE-DB-Cloud delivers multi-engine storage — LSM-Tree, B-Tree, and
          Columnar — with ALICE-Zip compression, automatic backups, and
          synchronous multi-region replication. One API, any scale.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/dashboard/console"
            className="px-8 py-3 bg-green-600 hover:bg-green-500 text-gray-900 font-bold rounded-lg transition-colors"
          >
            Open Console
          </Link>
          <a
            href="#features"
            className="px-8 py-3 border border-gray-700 hover:border-green-500 text-gray-300 rounded-lg transition-colors"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-8 py-16 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-12 text-gray-200">
          Core Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-green-600 transition-colors"
            >
              <h3 className="text-lg font-bold text-green-400 mb-3">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* API Endpoints */}
      <section className="px-8 py-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-200">
          API Endpoints
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400">
                <th className="text-left py-3 pr-6">Method</th>
                <th className="text-left py-3 pr-6">Path</th>
                <th className="text-left py-3">Description</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((e) => (
                <tr
                  key={e.path}
                  className="border-b border-gray-800 hover:bg-gray-800 transition-colors"
                >
                  <td className="py-3 pr-6">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                        e.method === "GET"
                          ? "bg-blue-900 text-blue-300"
                          : e.method === "DELETE"
                          ? "bg-red-900 text-red-300"
                          : "bg-green-900 text-green-300"
                      }`}
                    >
                      {e.method}
                    </span>
                  </td>
                  <td className="py-3 pr-6 font-mono text-gray-300">{e.path}</td>
                  <td className="py-3 text-gray-400">{e.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-600 text-sm border-t border-gray-800">
        ALICE-DB-Cloud — Licensed under AGPL-3.0-or-later
      </footer>
    </div>
  );
}
