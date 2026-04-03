import { check, group } from 'k6';
import { get, post } from '../helpers/request.js';
import { trackResponse } from '../helpers/custom-metrics.js';
import { generateComment, shortThinkTime, randomInt } from '../helpers/utils.js';

const BASE_URL = 'https://jsonplaceholder.typicode.com';

export function listarComentarios() {
  const response = get(`${BASE_URL}/comments`, {
    tags: { endpoint: 'comments', operation: 'list' },
    name: 'GET /comments',
  });

  trackResponse(response, 'read');

  check(response, {
    'listar comentários - status 200': (r) => r.status === 200,
    'listar comentários - retorna array': (r) => {
      try { return Array.isArray(JSON.parse(r.body)); } catch (e) { return false; }
    },
    'listar comentários - tem 500 itens': (r) => {
      try { return JSON.parse(r.body).length === 500; } catch (e) { return false; }
    },
  });

  return response;
}

export function buscarComentario(id) {
  const response = get(`${BASE_URL}/comments/${id}`, {
    tags: { endpoint: 'comments', operation: 'get' },
    name: 'GET /comments/:id',
  });

  trackResponse(response, 'read');

  check(response, {
    'buscar comentário - status 200': (r) => r.status === 200,
    'buscar comentário - id correto': (r) => {
      try { return JSON.parse(r.body).id === id; } catch (e) { return false; }
    },
    'buscar comentário - tem email': (r) => {
      try { return JSON.parse(r.body).email !== undefined; } catch (e) { return false; }
    },
    'buscar comentário - tem body': (r) => {
      try { return JSON.parse(r.body).body !== undefined; } catch (e) { return false; }
    },
  });

  return response;
}

export function filtrarComentariosPorPost(postId) {
  const response = get(`${BASE_URL}/comments?postId=${postId}`, {
    tags: { endpoint: 'comments', operation: 'filter' },
    name: 'GET /comments?postId',
  });

  trackResponse(response, 'read');

  check(response, {
    'filtrar comentários - status 200': (r) => r.status === 200,
    'filtrar comentários - retorna array': (r) => {
      try { return Array.isArray(JSON.parse(r.body)); } catch (e) { return false; }
    },
    'filtrar comentários - todos do mesmo post': (r) => {
      try { return JSON.parse(r.body).every((c) => c.postId === postId); } catch (e) { return false; }
    },
  });

  return response;
}

export function criarComentario(commentData) {
  const data = commentData || generateComment();

  const response = post(`${BASE_URL}/comments`, data, {
    tags: { endpoint: 'comments', operation: 'create' },
    name: 'POST /comments',
  });

  trackResponse(response, 'write');

  check(response, {
    'criar comentário - status 201': (r) => r.status === 201,
    'criar comentário - retorna id': (r) => {
      try { return JSON.parse(r.body).id !== undefined; } catch (e) { return false; }
    },
  });

  return response;
}

export function fluxoLeituraComentarios() {
  group('Leitura de Comentários', () => {
    const postId = randomInt(1, 100);
    const commentId = randomInt(1, 500);

    group('1. Filtrar por Post', () => {
      filtrarComentariosPorPost(postId);
      shortThinkTime();
    });

    group('2. Ler Detalhe', () => {
      buscarComentario(commentId);
      shortThinkTime();
    });

    group('3. Criar Comentário', () => {
      criarComentario();
    });
  });
}

export default {
  listarComentarios, buscarComentario, filtrarComentariosPorPost,
  criarComentario, fluxoLeituraComentarios,
};
