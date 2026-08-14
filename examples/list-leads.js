#!/usr/bin/env node
// Leads of one DOS AI project. Node 18+, no dependencies.
//
//   DOSAI_KEY=dos_sk_live_... node list-leads.js [projectId]

const BASE = process.env.DOSAI_BASE || "https://dosai.pro";
const KEY = process.env.DOSAI_KEY;

if (!KEY) {
  console.error("set DOSAI_KEY to an API key issued in the cabinet");
  process.exit(1);
}

/** Every endpoint answers with an envelope, so unwrap once and in one place. */
async function api(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${KEY}`, Accept: "application/json" },
    // The platform has no long-running reads; a timeout keeps a stuck network
    // from hanging your script forever.
    signal: AbortSignal.timeout(30_000),
  });
  if (res.status === 429) {
    const retry = res.headers.get("retry-after") || "?";
    throw new Error(`rate limited, retry after ${retry}s`);
  }
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${(await res.text()).slice(0, 300)}`);
  }
  const body = await res.json();
  return body.data ?? body;
}

async function main() {
  let projectId = process.argv[2];
  if (!projectId) {
    const projects = await api("/api/projects");
    if (!projects.length) throw new Error("no projects visible to this key");
    projectId = projects[0].id;
    console.log(`project: ${projects[0].name} (${projectId})`);
  }

  const leads = await api(`/api/projects/${projectId}/leads?limit=20`);
  for (const lead of leads) {
    console.log(
      [
        (lead.status || "").padEnd(12),
        (lead.client_name || "-").padEnd(24),
        lead.phone || "-",
      ].join(" "),
    );
  }
  console.log(`total: ${leads.length}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
