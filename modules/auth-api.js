import { check, group } from 'k6';
import http from 'k6/http';
import { trackResponse } from '../helpers/custom-metrics.js';
import { shortThinkTime } from '../helpers/utils.js';

const BASE_URL = 'https://jsonplaceholder.typicode.com';

export function login(email, password) {
  const response = http.post(`${BASE_URL}/posts`, JSON.stringify({
    title: 'Login Request',
    body: JSON.stringify({ email, password }),
    userId: 1,
  }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'login', operation: 'auth', criticality: 'critical' },
  });

  trackResponse(response, 'write');

  const success = check(response, {
    'login - status 201': (r) => r.status === 201,
    'login - retorna id': (r) => {
      try { return JSON.parse(r.body).id !== undefined; } catch (e) { return false; }
    },
  });

  let token = null;
  try {
    token = `token-${JSON.parse(response.body).id}`;
  } catch (e) {}

  return { success, token, response };
}

export function loginInvalido() {
  const response = http.get(`${BASE_URL}/posts/0`, {
    tags: { endpoint: 'login', operation: 'auth', expected_error: 'true' },
  });

  trackResponse(response, 'read');

  const success = check(response, {
    'login inválido - resposta recebida': (r) => r.status !== 0,
  });

  return { success, response };
}

export function register(email, password) {
  const response = http.post(`${BASE_URL}/posts`, JSON.stringify({
    title: 'Register Request',
    body: JSON.stringify({ email, password, action: 'register' }),
    userId: 1,
  }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'register', operation: 'auth', criticality: 'critical' },
  });

  trackResponse(response, 'write');

  const success = check(response, {
    'registro - status 201': (r) => r.status === 201,
    'registro - retorna id': (r) => {
      try { return JSON.parse(r.body).id !== undefined; } catch (e) { return false; }
    },
  });

  let id = null, token = null;
  try {
    id = JSON.parse(response.body).id;
    token = `token-${id}`;
  } catch (e) {}

  return { success, id, token, response };
}

export function fluxoAutenticacao() {
  let token = null;

  group('Fluxo de Autenticação', () => {
    group('Registro', () => {
      register('usuario@email.com', 'senha123');
      shortThinkTime();
    });

    group('Login', () => {
      const result = login('usuario@email.com', 'senha123');
      token = result.token;
      shortThinkTime();
    });
  });

  return token;
}

export default { login, loginInvalido, register, fluxoAutenticacao };
