import { check, group } from 'k6';
import { get } from '../helpers/request.js';
import { trackResponse } from '../helpers/custom-metrics.js';
import { shortThinkTime, randomInt } from '../helpers/utils.js';

const BASE_URL = 'https://jsonplaceholder.typicode.com';

export function listarUsuarios() {
  const response = get(`${BASE_URL}/users`, {
    tags: { endpoint: 'users', operation: 'list' },
    name: 'GET /users',
  });

  trackResponse(response, 'read');

  check(response, {
    'listar usuários - status 200': (r) => r.status === 200,
    'listar usuários - retorna array': (r) => {
      try { return Array.isArray(JSON.parse(r.body)); } catch (e) { return false; }
    },
    'listar usuários - tem 10 usuários': (r) => {
      try { return JSON.parse(r.body).length === 10; } catch (e) { return false; }
    },
  });

  return response;
}

export function buscarUsuario(id) {
  const response = get(`${BASE_URL}/users/${id}`, {
    tags: { endpoint: 'users', operation: 'get' },
    name: 'GET /users/:id',
  });

  trackResponse(response, 'read');

  check(response, {
    'buscar usuário - status 200': (r) => r.status === 200,
    'buscar usuário - id correto': (r) => {
      try { return JSON.parse(r.body).id === id; } catch (e) { return false; }
    },
    'buscar usuário - tem nome': (r) => {
      try { return JSON.parse(r.body).name !== undefined; } catch (e) { return false; }
    },
    'buscar usuário - tem email': (r) => {
      try { return JSON.parse(r.body).email !== undefined; } catch (e) { return false; }
    },
    'buscar usuário - tem endereço': (r) => {
      try { return JSON.parse(r.body).address !== undefined; } catch (e) { return false; }
    },
  });

  return response;
}

export function buscarPostsDoUsuario(userId) {
  const response = get(`${BASE_URL}/users/${userId}/posts`, {
    tags: { endpoint: 'users', operation: 'nested' },
    name: 'GET /users/:id/posts',
  });

  trackResponse(response, 'read');

  check(response, {
    'posts do usuário - status 200': (r) => r.status === 200,
    'posts do usuário - retorna array': (r) => {
      try { return Array.isArray(JSON.parse(r.body)); } catch (e) { return false; }
    },
  });

  return response;
}

export function buscarTodosDoUsuario(userId) {
  const response = get(`${BASE_URL}/users/${userId}/todos`, {
    tags: { endpoint: 'todos', operation: 'nested' },
    name: 'GET /users/:id/todos',
  });

  trackResponse(response, 'read');

  check(response, {
    'todos do usuário - status 200': (r) => r.status === 200,
    'todos do usuário - retorna array': (r) => {
      try { return Array.isArray(JSON.parse(r.body)); } catch (e) { return false; }
    },
  });

  return response;
}

export function listarUsuariosPaginado(page = 1) {
  const response = get(`${BASE_URL}/users?_page=${page}&_limit=6`, {
    tags: { endpoint: 'users', operation: 'list_paginated' },
    name: 'GET /users?page',
  });

  trackResponse(response, 'read');

  check(response, {
    'listar usuários paginado - status 200': (r) => r.status === 200,
    'listar usuários paginado - retorna array': (r) => {
      try { return Array.isArray(JSON.parse(r.body)); } catch (e) { return false; }
    },
  });

  return response;
}

export function buscarUsuarioInexistente() {
  const response = get(`${BASE_URL}/users/999`, {
    tags: { endpoint: 'users', operation: 'get_not_found', expected_error: 'true' },
    name: 'GET /users/999 (404)',
  });

  trackResponse(response, 'read');

  check(response, {
    'usuário inexistente - status 404': (r) => r.status === 404,
  });

  return response;
}

export function fluxoNavegacaoUsuario() {
  group('Navegação de Usuário', () => {
    group('1. Listar Usuários', () => {
      listarUsuarios();
      shortThinkTime();
    });

    const userId = randomInt(1, 10);

    group('2. Detalhes do Usuário', () => {
      buscarUsuario(userId);
      shortThinkTime();
    });

    group('3. Posts do Usuário', () => {
      buscarPostsDoUsuario(userId);
      shortThinkTime();
    });

    group('4. Todos do Usuário', () => {
      buscarTodosDoUsuario(userId);
    });
  });
}

export default {
  listarUsuarios, buscarUsuario, buscarPostsDoUsuario, buscarTodosDoUsuario,
  listarUsuariosPaginado, buscarUsuarioInexistente, fluxoNavegacaoUsuario,
};
