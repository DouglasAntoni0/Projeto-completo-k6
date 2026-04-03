import http from 'k6/http';

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

function mergeHeaders(customHeaders = {}) {
  return Object.assign({}, DEFAULT_HEADERS, customHeaders);
}

function buildParams(options = {}) {
  const params = {
    headers: mergeHeaders(options.headers),
    tags: options.tags || {},
    timeout: options.timeout || '30s',
  };
  if (options.name) params.tags.name = options.name;
  return params;
}

export function get(url, options = {}) {
  return http.get(url, buildParams(options));
}

export function post(url, body, options = {}) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  return http.post(url, payload, buildParams(options));
}

export function put(url, body, options = {}) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  return http.put(url, payload, buildParams(options));
}

export function patch(url, body, options = {}) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  return http.patch(url, payload, buildParams(options));
}

export function del(url, options = {}) {
  return http.del(url, null, buildParams(options));
}

export function batch(requests) {
  return http.batch(requests);
}

export function authenticatedRequest(method, url, token, body = null, options = {}) {
  const opts = { ...options, headers: { ...options.headers, 'Authorization': `Bearer ${token}` } };

  switch (method.toUpperCase()) {
    case 'GET': return get(url, opts);
    case 'POST': return post(url, body, opts);
    case 'PUT': return put(url, body, opts);
    case 'PATCH': return patch(url, body, opts);
    case 'DELETE': return del(url, opts);
    default: throw new Error(`Método HTTP não suportado: ${method}`);
  }
}

export default { get, post, put, patch, del, batch, authenticatedRequest };
