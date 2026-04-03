import { check } from 'k6';

export function checkStatus(response, expectedStatus) {
  return check(response, {
    [`status é ${expectedStatus}`]: (r) => r.status === expectedStatus,
  });
}

export function checkSuccess(response) {
  return check(response, {
    'status é 2xx': (r) => r.status >= 200 && r.status < 300,
  });
}

export function checkBodyNotEmpty(response) {
  return check(response, {
    'body não está vazio': (r) => r.body && r.body.length > 0,
  });
}

export function checkJsonResponse(response) {
  return check(response, {
    'Content-Type contém json': (r) =>
      r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
    'body é JSON válido': (r) => {
      try { JSON.parse(r.body); return true; } catch (e) { return false; }
    },
  });
}

export function checkResponseTime(response, maxDuration) {
  return check(response, {
    [`tempo de resposta < ${maxDuration}ms`]: (r) => r.timings.duration < maxDuration,
  });
}

export function checkJsonField(response, field) {
  return check(response, {
    [`resposta contém "${field}"`]: (r) => {
      try { return JSON.parse(r.body).hasOwnProperty(field); } catch (e) { return false; }
    },
  });
}

export function checkArrayResponse(response, minLength = 1) {
  return check(response, {
    'resposta é array': (r) => {
      try { return Array.isArray(JSON.parse(r.body)); } catch (e) { return false; }
    },
    [`array tem >= ${minLength} item(ns)`]: (r) => {
      try { return JSON.parse(r.body).length >= minLength; } catch (e) { return false; }
    },
  });
}

export function checkFullResponse(response, expectedStatus = 200, maxDuration = 500) {
  return check(response, {
    [`status é ${expectedStatus}`]: (r) => r.status === expectedStatus,
    'body não está vazio': (r) => r.body && r.body.length > 0,
    'Content-Type é JSON': (r) =>
      r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
    [`tempo de resposta < ${maxDuration}ms`]: (r) => r.timings.duration < maxDuration,
  });
}

export function checkSecurityHeaders(response) {
  return check(response, {
    'possui Content-Type': (r) => r.headers['Content-Type'] !== undefined,
    'possui Cache-Control': (r) => r.headers['Cache-Control'] !== undefined,
  });
}

export default {
  checkStatus, checkSuccess, checkBodyNotEmpty, checkJsonResponse,
  checkResponseTime, checkJsonField, checkArrayResponse,
  checkFullResponse, checkSecurityHeaders,
};
