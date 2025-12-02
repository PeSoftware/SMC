module.exports = async function (context, req) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  const allowCredentials = process.env.ALLOW_CREDENTIALS === 'true';
  const targetBase = process.env.POWER_AUTOMATE_ENDPOINT;

  if (!targetBase) {
    context.log.error('POWER_AUTOMATE_ENDPOINT not configured');
    context.res = {
      status: 500,
      body: 'Proxy not configured (POWER_AUTOMATE_ENDPOINT missing)'
    };
    return;
  }

  const path = context.bindingData && context.bindingData.path ? context.bindingData.path : '';
  const query = req.query && Object.keys(req.query).length ? ('?' + new URLSearchParams(req.query).toString()) : '';
  const targetUrl = targetBase.replace(/\/$/, '') + (path ? '/' + path : '') + query;

  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,Accept',
  };
  if (allowCredentials) {
    corsHeaders['Access-Control-Allow-Credentials'] = 'true';
  }

  // Handle preflight
  if ((req.method || '').toUpperCase() === 'OPTIONS') {
    context.res = {
      status: 204,
      headers: corsHeaders,
      body: ''
    };
    return;
  }

  // Forward request to Power Automate endpoint
  const forwardHeaders = Object.assign({}, req.headers || {});
  delete forwardHeaders.host;

  const isBodyAllowed = !['GET', 'HEAD'].includes((req.method || '').toUpperCase());
  const body = req.rawBody || (req.body && typeof req.body === 'string' ? req.body : (req.body ? JSON.stringify(req.body) : undefined));

  let upstreamResp;
  try {
    upstreamResp = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: isBodyAllowed ? body : undefined,
    });
  } catch (err) {
    context.log.error('Error forwarding request to Power Automate:', err);
    context.res = {
      status: 502,
      headers: corsHeaders,
      body: 'Upstream request failed'
    };
    return;
  }

  const text = await upstreamResp.text();
  const respHeaders = {};
  upstreamResp.headers.forEach((v, k) => { respHeaders[k] = v; });
  Object.assign(respHeaders, corsHeaders);

  context.res = {
    status: upstreamResp.status,
    headers: respHeaders,
    body: text
  };
};
