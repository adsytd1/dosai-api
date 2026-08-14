#!/usr/bin/env python3
"""Leads of one DOS AI project. Standard library only.

    DOSAI_KEY=dos_sk_live_... python3 list_leads.py [project_id]
"""

import json
import os
import sys
import urllib.error
import urllib.request

BASE = os.environ.get("DOSAI_BASE", "https://dosai.pro")
KEY = os.environ.get("DOSAI_KEY")


def api(path: str):
    """GET a public endpoint and unwrap the response envelope."""
    req = urllib.request.Request(
        f"{BASE}{path}",
        headers={"Authorization": f"Bearer {KEY}", "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            body = json.load(res)
    except urllib.error.HTTPError as err:
        if err.code == 429:
            raise SystemExit(f"rate limited, retry after {err.headers.get('Retry-After', '?')}s")
        raise SystemExit(f"{err.code} {err.reason}: {err.read()[:300].decode('utf-8', 'replace')}")
    return body.get("data", body)


def main() -> None:
    if not KEY:
        raise SystemExit("set DOSAI_KEY to an API key issued in the cabinet")

    project_id = sys.argv[1] if len(sys.argv) > 1 else None
    if not project_id:
        projects = api("/api/projects")
        if not projects:
            raise SystemExit("no projects visible to this key")
        project_id = projects[0]["id"]
        print(f"project: {projects[0].get('name')} ({project_id})")

    leads = api(f"/api/projects/{project_id}/leads?limit=20")
    for lead in leads:
        status = (lead.get("status") or "").ljust(12)
        name = (lead.get("client_name") or "-").ljust(24)
        print(f"{status} {name} {lead.get('phone') or '-'}")
    print(f"total: {len(leads)}")


if __name__ == "__main__":
    main()
