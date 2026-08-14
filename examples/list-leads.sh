#!/usr/bin/env bash
# Leads and analytics of one DOS AI project.
#
# Usage:
#   export DOSAI_KEY="dos_sk_live_..."
#   ./list-leads.sh            # picks the first project the key can see
#   ./list-leads.sh <projectId>
set -euo pipefail

BASE="${DOSAI_BASE:-https://dosai.pro}"
: "${DOSAI_KEY:?set DOSAI_KEY to an API key issued in the cabinet}"

auth=(-H "Authorization: Bearer $DOSAI_KEY" -H "Accept: application/json")

project_id="${1:-}"
if [ -z "$project_id" ]; then
  project_id=$(curl -sS "${auth[@]}" "$BASE/api/projects" \
    | python3 -c 'import json,sys; d=json.load(sys.stdin).get("data") or []; print(d[0]["id"] if d else "")')
  [ -n "$project_id" ] || { echo "no projects visible to this key" >&2; exit 1; }
  echo "project: $project_id"
fi

echo "--- leads (last 20)"
curl -sS "${auth[@]}" "$BASE/api/projects/$project_id/leads?limit=20" \
  | python3 -c '
import json,sys
rows = json.load(sys.stdin).get("data") or []
for r in rows:
    print(f'"'"'{r.get("status",""):12} {r.get("client_name") or "-":24} {r.get("phone") or "-"}'"'"')
print(f"total: {len(rows)}")
'

echo "--- analytics (last 30 days)"
from_date=$(python3 -c 'import datetime;print((datetime.date.today()-datetime.timedelta(days=30)).isoformat())')
to_date=$(python3 -c 'import datetime;print(datetime.date.today().isoformat())')
curl -sS "${auth[@]}" "$BASE/api/projects/$project_id/analytics?from=$from_date&to=$to_date" \
  | python3 -m json.tool
