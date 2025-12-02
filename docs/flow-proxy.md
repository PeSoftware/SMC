# Flow Proxy (CORS) — Setup

This function proxies browser requests to your Power Automate HTTP endpoint and ensures responses include the proper CORS headers.

Files added:

- `api/flow-proxy/index.js` — proxy implementation
- `api/flow-proxy/function.json` — function route configuration

How it works:

- The proxy route is `/.auth`-independent and available at `/api/flow-proxy/...` (for example `/api/flow-proxy` or `/api/flow-proxy/subpath`).
- OPTIONS preflight requests are answered directly with CORS headers.
- Other methods are forwarded to the URL in `POWER_AUTOMATE_ENDPOINT`, preserving method, headers, query string and body.
- Responses from Power Automate are returned to the browser with CORS headers added.

Configuration (set these in your Static Web App configuration or Azure Portal):

- `POWER_AUTOMATE_ENDPOINT`: The base URL of your Power Automate HTTP trigger (e.g. `https://prod-00.westus.logic.azure.com:443/workflows/....`). Do NOT include a trailing slash.
- `ALLOWED_ORIGIN` (optional): Origin you want to allow (e.g. `https://your-site.azurestaticapps.net`). Defaults to `*`.
- `ALLOW_CREDENTIALS` (optional): set to `true` if you need `Access-Control-Allow-Credentials: true`.

Security notes:

- Prefer setting `ALLOWED_ORIGIN` to your site origin instead of `*` if you need to send credentials or want stricter security.
- Keep the `POWER_AUTOMATE_ENDPOINT` secret; set it as an application setting in Azure Static Web Apps (not in source).

Usage example (browser):

fetch('/api/flow-proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ foo: 1 }) })
