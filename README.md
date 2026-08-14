# DOS AI API and MCP server

Public interfaces of [DOS AI](https://dosai.pro), a platform for AI assistants (chatbots) in WhatsApp and Telegram with a built-in CRM.

This repository holds the machine-readable contract and runnable examples. The platform itself is hosted, so there is nothing to install: you get an API key in the cabinet and call the endpoints below.

- **OpenAPI spec:** https://dosai.pro/api/openapi.json
- **MCP endpoint:** `https://dosai.pro/api/mcp`
- **Agent primer:** https://dosai.pro/llms.txt
- **Full public corpus (guide + course + articles):** https://dosai.pro/llms-full.txt
- **Human docs:** https://dosai.pro/docs/guide/08-developers/80-public-api

## What the platform does

A project in DOS AI is one bot: its instructions, its knowledge base, its channel (WhatsApp via QR or Telegram), its balance and its clients. The bot answers incoming messages in natural language, books time slots from a Google Calendar or Sheet, issues invoices in the chat, files every conversation as a lead, and hands the dialog over to a human when your rules say so.

The API exposes that same data: projects, conversations, messages, leads, analytics and balance.

## Authentication

Every request carries an API key issued in the cabinet:

```
Authorization: Bearer dos_sk_live_...
```

The key authenticates as the user who created it, so it inherits that user's access. Only a SHA-256 hash of the key is stored, which means a lost key cannot be recovered, only revoked and reissued. Keys can be scoped to a single project and to read-only access.

Rate limit: 120 requests per minute per key, plus a stricter per-endpoint budget. On 429 the `Retry-After` header tells you how many seconds to wait.

## REST in one minute

```bash
export DOSAI_KEY="dos_sk_live_..."

# projects visible to this key
curl -s https://dosai.pro/api/projects \
  -H "Authorization: Bearer $DOSAI_KEY"

# leads of one project
curl -s "https://dosai.pro/api/projects/$PROJECT_ID/leads?limit=20" \
  -H "Authorization: Bearer $DOSAI_KEY"

# analytics for a period
curl -s "https://dosai.pro/api/projects/$PROJECT_ID/analytics?from=2026-08-01&to=2026-08-14" \
  -H "Authorization: Bearer $DOSAI_KEY"
```

Available paths (full schemas in the OpenAPI file):

| Path | What it gives |
|---|---|
| `/api/projects` | list of projects |
| `/api/projects/{id}` | one project, including its prompt |
| `/api/projects/{id}/conversations` | dialogs with filters and paging |
| `/api/projects/{id}/leads` | leads with status and source |
| `/api/projects/{id}/leads/export` | leads as CSV |
| `/api/projects/{id}/analytics` | dialogs, leads, conversion, response time |
| `/api/projects/{id}/functions` | functions the bot can call |
| `/api/projects/{id}/integrations` | connected Google and CRM integrations |
| `/api/projects/{id}/reports` | owner reports |
| `/api/projects/{id}/tokens` | balance |
| `/api/projects/{id}/tokens/history` | balance movements |

Responses come wrapped in an envelope (`{ "data": ... }`), so unwrap before use. The OpenAPI file is the authority here and is generated from the same source the routes are checked against.

## MCP: connect an AI assistant

The platform ships a Model Context Protocol endpoint, so an AI assistant can read and manage your bots directly. Point your MCP client at:

```
https://dosai.pro/api/mcp
```

Tools exposed (all prefixed `dosai_`):

`list_projects`, `get_project`, `get_prompt`, `update_prompt`, `list_functions`, `list_leads`, `get_lead`, `update_lead`, `list_conversations`, `get_messages`, `send_operator_message`, `get_analytics`, `get_balance`.

Two design decisions worth knowing:

**No destructive tools.** There is no delete-project, no payment, no member management. Adding one would be a conscious decision, not a reflex, and a test guards the list.

**Every tool calls the public REST route over HTTP**, not an internal service layer. That way a read-only key stays read-only, project scoping and rate limits apply exactly once, and the agent cannot reach anything a human with the same key could not.

Example client config (Claude Desktop style):

```json
{
  "mcpServers": {
    "dosai": {
      "url": "https://dosai.pro/api/mcp",
      "headers": { "Authorization": "Bearer dos_sk_live_..." }
    }
  }
}
```

## Webhooks

Instead of polling, you can receive events on your own endpoint: new lead, new message, stage change. Signature verification and payload shapes are documented at https://dosai.pro/docs/guide/08-developers/81-custom-webhooks

## Examples

- [`examples/list-leads.sh`](examples/list-leads.sh) — curl, leads and analytics
- [`examples/list-leads.js`](examples/list-leads.js) — Node, no dependencies
- [`examples/list_leads.py`](examples/list_leads.py) — Python, standard library only

## Getting a key

1. Register at https://dosai.pro/register (a starting balance is granted, no card required)
2. Create a project and connect a channel
3. Open the cabinet, section API keys, and issue a key with the scope you need

## Links

- Platform: https://dosai.pro
- Guide: https://dosai.pro/docs/guide
- Free course: https://dosai.pro/learn
- Articles: https://dosai.pro/blog
- Contact: adsytd1@gmail.com

## License

Examples in this repository are MIT. The platform itself is a hosted commercial service.
