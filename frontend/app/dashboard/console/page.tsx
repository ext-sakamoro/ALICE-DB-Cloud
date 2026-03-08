"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081";

type Tab = "query" | "write" | "backup" | "stats";

export default function ConsolePage() {
  const [tab, setTab] = useState<Tab>("query");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // query
  const [queryEngine, setQueryEngine] = useState("lsm");
  const [querySql, setQuerySql] = useState("SELECT * FROM users LIMIT 10;");

  // write
  const [writeEngine, setWriteEngine] = useState("lsm");
  const [writeTable, setWriteTable] = useState("users");
  const [writePayload, setWritePayload] = useState('{"id":1,"name":"Alice"}');

  // backup
  const [backupDb, setBackupDb] = useState("primary");
  const [backupDest, setBackupDest] = useState("s3://backups/db/");

  const run = async () => {
    setLoading(true);
    setResult("");
    try {
      let res: Response;
      if (tab === "query") {
        res = await fetch(`${API_BASE}/api/v1/db/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ engine: queryEngine, sql: querySql }),
        });
      } else if (tab === "write") {
        res = await fetch(`${API_BASE}/api/v1/db/write`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            engine: writeEngine,
            table: writeTable,
            data: JSON.parse(writePayload),
          }),
        });
      } else if (tab === "backup") {
        res = await fetch(`${API_BASE}/api/v1/db/backup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ database: backupDb, destination: backupDest }),
        });
      } else {
        res = await fetch(`${API_BASE}/api/v1/db/stats`);
      }
      const json = await res.json();
      setResult(JSON.stringify(json, null, 2));
    } catch (e) {
      setResult(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  const tabs: Tab[] = ["query", "write", "backup", "stats"];

  return (
    <div className="min-h-screen bg-gray-900 text-green-400 p-6 font-mono">
      <h1 className="text-2xl font-bold mb-6 text-green-300">
        ALICE-DB-Cloud Console
      </h1>

      {/* Tab bar */}
      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setResult(""); }}
            className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
              tab === t
                ? "bg-green-600 text-gray-900"
                : "bg-gray-800 text-green-400 hover:bg-gray-700"
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6 space-y-4">
        {tab === "query" && (
          <>
            <div>
              <label className="block text-xs text-green-500 mb-1">Engine</label>
              <select
                value={queryEngine}
                onChange={(e) => setQueryEngine(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-green-400 text-sm"
              >
                <option value="lsm">LSM-Tree</option>
                <option value="btree">B-Tree</option>
                <option value="columnar">Columnar</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-green-500 mb-1">SQL</label>
              <textarea
                value={querySql}
                onChange={(e) => setQuerySql(e.target.value)}
                rows={4}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-green-400 text-sm resize-none"
              />
            </div>
          </>
        )}

        {tab === "write" && (
          <>
            <div>
              <label className="block text-xs text-green-500 mb-1">Engine</label>
              <select
                value={writeEngine}
                onChange={(e) => setWriteEngine(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-green-400 text-sm"
              >
                <option value="lsm">LSM-Tree</option>
                <option value="btree">B-Tree</option>
                <option value="columnar">Columnar</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-green-500 mb-1">Table</label>
              <input
                value={writeTable}
                onChange={(e) => setWriteTable(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-green-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-green-500 mb-1">Payload (JSON)</label>
              <textarea
                value={writePayload}
                onChange={(e) => setWritePayload(e.target.value)}
                rows={3}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-green-400 text-sm resize-none"
              />
            </div>
          </>
        )}

        {tab === "backup" && (
          <>
            <div>
              <label className="block text-xs text-green-500 mb-1">Database</label>
              <input
                value={backupDb}
                onChange={(e) => setBackupDb(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-green-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-green-500 mb-1">Destination</label>
              <input
                value={backupDest}
                onChange={(e) => setBackupDest(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-green-400 text-sm"
              />
            </div>
          </>
        )}

        {tab === "stats" && (
          <p className="text-green-500 text-sm">
            Fetches GET /api/v1/db/stats — click Run to retrieve live metrics.
          </p>
        )}
      </div>

      <button
        onClick={run}
        disabled={loading}
        className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-gray-900 font-bold rounded transition-colors"
      >
        {loading ? "Running..." : "Run"}
      </button>

      {result && (
        <pre className="mt-6 bg-gray-800 rounded-lg p-4 text-green-300 text-sm overflow-x-auto whitespace-pre-wrap">
          {result}
        </pre>
      )}
    </div>
  );
}
