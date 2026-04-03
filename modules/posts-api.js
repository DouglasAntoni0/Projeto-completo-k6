import { check, group } from 'k6';
import { get, post, put, patch, del } from '../helpers/request.js';
import { trackResponse } from '../helpers/custom-metrics.js';
import { generatePost, shortThinkTime } from '../helpers/utils.js';

const BASE_URL = 'https://jsonplaceholder.typicode.com';

export function listarPosts() {
  const response = get(`${BASE_URL}/posts`, {
    tags: { endpoint: 'posts', operation: 'list', criticality: 'normal' },
    name: 'GET /posts',
  });

  trackResponse(response, 'read');

  check(response, {
    'listar posts - status 200': (r) => r.status === 200,
    'listar posts - retorna array': (r) => {
      try { return Array.isArray(JSON.parse(r.body)); } catch (e) { return false; }
    },
    'listar posts - tem 100 posts': (r) => {
      try { return JSON.parse(r.body).length === 100; } catch (e) { return false; }
    },
  });

  return response;
}

export function buscarPost(id) {
  const response = get(`${BASE_URL}/posts/${id}`, {
    tags: { endpoint: 'posts', operation: 'get', criticality: 'normal' },
    name: 'GET /posts/:id',
  });

  trackResponse(response, 'read');

  check(response, {
    'buscar post - status 200': (r) => r.status === 200,
    'buscar post - tem id correto': (r) => {
      try { return JSON.parse(r.body).id === id; } catch (e) { return false; }
    },
    'buscar post - tem título': (r) => {
      try { return JSON.parse(r.body).title !== undefined; } catch (e) { return false; }
    },
    'buscar post - tem body': (r) => {
      try { return JSON.parse(r.body).body !== undefined; } catch (e) { return false; }
    },
  });

  return response;
}

export function filtrarPostsPorUsuario(userId) {
  const response = get(`${BASE_URL}/posts?userId=${userId}`, {
    tags: { endpoint: 'posts', operation: 'filter', criticality: 'normal' },
    name: 'GET /posts?userId',
  });

  trackResponse(response, 'read');

  check(response, {
    'filtrar posts - status 200': (r) => r.status === 200,
    'filtrar posts - retorna array': (r) => {
      try { return Array.isArray(JSON.parse(r.body)); } catch (e) { return false; }
    },
    'filtrar posts - todos do mesmo userId': (r) => {
      try { return JSON.parse(r.body).every((p) => p.userId === userId); } catch (e) { return false; }
    },
  });

  return response;
}

export function buscarComentariosDoPost(postId) {
  const response = get(`${BASE_URL}/posts/${postId}/comments`, {
    tags: { endpoint: 'comments', operation: 'list', criticality: 'background' },
    name: 'GET /posts/:id/comments',
  });

  trackResponse(response, 'read');

  check(response, {
    'comentários do post - status 200': (r) => r.status === 200,
    'comentários do post - retorna array': (r) => {
      try { return Array.isArray(JSON.parse(r.body)); } catch (e) { return false; }
    },
  });

  return response;
}

export function criarPost(postData) {
  const data = postData || generatePost();

  const response = post(`${BASE_URL}/posts`, data, {
    tags: { endpoint: 'posts', operation: 'create', criticality: 'critical' },
    name: 'POST /posts',
  });

  trackResponse(response, 'write');

  check(response, {
    'criar post - status 201': (r) => r.status === 201,
    'criar post - retorna id': (r) => {
      try { return JSON.parse(r.body).id !== undefined; } catch (e) { return false; }
    },
    'criar post - título correto': (r) => {
      try { return JSON.parse(r.body).title === data.title; } catch (e) { return false; }
    },
  });

  return response;
}

export function atualizarPost(id, postData) {
  const data = postData || generatePost();

  const response = put(`${BASE_URL}/posts/${id}`, data, {
    tags: { endpoint: 'posts', operation: 'update', criticality: 'critical' },
    name: 'PUT /posts/:id',
  });

  trackResponse(response, 'write');

  check(response, {
    'atualizar post (PUT) - status 200': (r) => r.status === 200,
    'atualizar post (PUT) - id correto': (r) => {
      try { return JSON.parse(r.body).id === id; } catch (e) { return false; }
    },
  });

  return response;
}

export function atualizarPostParcial(id, partialData) {
  const data = partialData || { title: 'Título Atualizado via PATCH' };

  const response = patch(`${BASE_URL}/posts/${id}`, data, {
    tags: { endpoint: 'posts', operation: 'patch', criticality: 'normal' },
    name: 'PATCH /posts/:id',
  });

  trackResponse(response, 'write');

  check(response, {
    'atualizar post (PATCH) - status 200': (r) => r.status === 200,
    'atualizar post (PATCH) - id correto': (r) => {
      try { return JSON.parse(r.body).id === id; } catch (e) { return false; }
    },
  });

  return response;
}

export function excluirPost(id) {
  const response = del(`${BASE_URL}/posts/${id}`, {
    tags: { endpoint: 'posts', operation: 'delete', criticality: 'critical' },
    name: 'DELETE /posts/:id',
  });

  trackResponse(response, 'delete');

  check(response, {
    'excluir post - status 200': (r) => r.status === 200,
  });

  return response;
}

export function fluxoCrudCompleto() {
  const results = {};

  group('CRUD Completo de Posts', () => {
    group('1. Criar Post', () => {
      results.create = criarPost();
      shortThinkTime();
    });

    group('2. Ler Post', () => {
      results.read = buscarPost(1);
      shortThinkTime();
    });

    group('3. Atualizar Post', () => {
      results.update = atualizarPost(1, {
        title: 'Post Atualizado',
        body: 'Conteúdo atualizado pelo teste de performance.',
        userId: 1,
      });
      shortThinkTime();
    });

    group('4. Atualizar Parcial', () => {
      results.patch = atualizarPostParcial(1, { title: 'Título via PATCH' });
      shortThinkTime();
    });

    group('5. Excluir Post', () => {
      results.delete = excluirPost(1);
    });
  });

  return results;
}

export default {
  listarPosts, buscarPost, filtrarPostsPorUsuario, buscarComentariosDoPost,
  criarPost, atualizarPost, atualizarPostParcial, excluirPost, fluxoCrudCompleto,
};
