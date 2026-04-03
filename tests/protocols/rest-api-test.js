import { group, check, sleep } from 'k6';
import http from 'k6/http';
import { Trend, Rate } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import { randomInt, randomTitle, randomBody } from '../../helpers/utils.js';

const BASE_URL = 'https://jsonplaceholder.typicode.com';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

const getTime = new Trend('rest_get_response_time', true);
const postTime = new Trend('rest_post_response_time', true);
const putTime = new Trend('rest_put_response_time', true);
const patchTime = new Trend('rest_patch_response_time', true);
const deleteTime = new Trend('rest_delete_response_time', true);
const batchTime = new Trend('rest_batch_response_time', true);
const crudSuccessRate = new Rate('rest_crud_success_rate');

export const options = {
  stages: [
    { duration: '2m', target: 15 },
    { duration: '5m', target: 30 },
    { duration: '2m', target: 15 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],
    checks: ['rate>0.90'],
    rest_get_response_time: ['p(95)<700'],
    rest_post_response_time: ['p(95)<900'],
    rest_put_response_time: ['p(95)<900'],
    rest_patch_response_time: ['p(95)<900'],
    rest_delete_response_time: ['p(95)<700'],
    rest_crud_success_rate: ['rate>0.95'],
  },
  tags: { test_type: 'rest_api' },
};

export default function () {
  group('GET — Leitura', () => {
    group('Listar Recursos', () => {
      const res = http.get(`${BASE_URL}/posts`, { tags: { method: 'GET', operation: 'list' } });
      getTime.add(res.timings.duration);
      crudSuccessRate.add(res.status === 200);
      check(res, {
        'GET list - status 200': (r) => r.status === 200,
        'GET list - retorna array': (r) => { try { return Array.isArray(JSON.parse(r.body)); } catch (e) { return false; } },
        'GET list - 100 posts': (r) => { try { return JSON.parse(r.body).length === 100; } catch (e) { return false; } },
      });
      sleep(0.3);
    });

    group('Buscar por ID', () => {
      const id = randomInt(1, 100);
      const res = http.get(`${BASE_URL}/posts/${id}`, { tags: { method: 'GET', operation: 'get_by_id' } });
      getTime.add(res.timings.duration);
      crudSuccessRate.add(res.status === 200);
      check(res, {
        'GET by id - status 200': (r) => r.status === 200,
        'GET by id - id correto': (r) => { try { return JSON.parse(r.body).id === id; } catch (e) { return false; } },
      });
      sleep(0.3);
    });

    group('Filtrar com Query Params', () => {
      const userId = randomInt(1, 10);
      const res = http.get(`${BASE_URL}/posts?userId=${userId}`, { tags: { method: 'GET', operation: 'filter' } });
      getTime.add(res.timings.duration);
      crudSuccessRate.add(res.status === 200);
      check(res, {
        'GET filter - status 200': (r) => r.status === 200,
        'GET filter - todos do mesmo userId': (r) => {
          try { return JSON.parse(r.body).every(p => p.userId === userId); } catch (e) { return false; }
        },
      });
      sleep(0.3);
    });

    group('Nested Resources', () => {
      const postId = randomInt(1, 100);
      const res = http.get(`${BASE_URL}/posts/${postId}/comments`, { tags: { method: 'GET', operation: 'nested' } });
      getTime.add(res.timings.duration);
      crudSuccessRate.add(res.status === 200);
      check(res, {
        'GET nested - status 200': (r) => r.status === 200,
        'GET nested - comments do post certo': (r) => {
          try { return JSON.parse(r.body).every(c => c.postId === postId); } catch (e) { return false; }
        },
      });
      sleep(0.3);
    });
  });

  group('POST — Criação', () => {
    const payload = JSON.stringify({ title: randomTitle(), body: randomBody(), userId: randomInt(1, 10) });
    const res = http.post(`${BASE_URL}/posts`, payload, {
      headers: JSON_HEADERS, tags: { method: 'POST', operation: 'create' },
    });
    postTime.add(res.timings.duration);
    crudSuccessRate.add(res.status === 201);
    check(res, {
      'POST - status 201': (r) => r.status === 201,
      'POST - retorna id': (r) => { try { return JSON.parse(r.body).id !== undefined; } catch (e) { return false; } },
    });
    sleep(0.3);
  });

  group('PUT — Atualização Completa', () => {
    const id = randomInt(1, 100);
    const payload = JSON.stringify({ id, title: randomTitle(), body: randomBody(), userId: randomInt(1, 10) });
    const res = http.put(`${BASE_URL}/posts/${id}`, payload, {
      headers: JSON_HEADERS, tags: { method: 'PUT', operation: 'update' },
    });
    putTime.add(res.timings.duration);
    crudSuccessRate.add(res.status === 200);
    check(res, {
      'PUT - status 200': (r) => r.status === 200,
      'PUT - id correto': (r) => { try { return JSON.parse(r.body).id === id; } catch (e) { return false; } },
    });
    sleep(0.3);
  });

  group('PATCH — Atualização Parcial', () => {
    const id = randomInt(1, 100);
    const res = http.patch(`${BASE_URL}/posts/${id}`, JSON.stringify({ title: 'Título via PATCH' }), {
      headers: JSON_HEADERS, tags: { method: 'PATCH', operation: 'partial_update' },
    });
    patchTime.add(res.timings.duration);
    crudSuccessRate.add(res.status === 200);
    check(res, {
      'PATCH - status 200': (r) => r.status === 200,
      'PATCH - título atualizado': (r) => {
        try { return JSON.parse(r.body).title === 'Título via PATCH'; } catch (e) { return false; }
      },
    });
    sleep(0.3);
  });

  group('DELETE — Exclusão', () => {
    const res = http.del(`${BASE_URL}/posts/${randomInt(1, 100)}`, null, {
      tags: { method: 'DELETE', operation: 'delete' },
    });
    deleteTime.add(res.timings.duration);
    crudSuccessRate.add(res.status === 200);
    check(res, { 'DELETE - status 200': (r) => r.status === 200 });
    sleep(0.3);
  });

  group('BATCH — Requisições Paralelas', () => {
    const startTime = Date.now();
    const responses = http.batch([
      ['GET', `${BASE_URL}/posts/1`, null, { tags: { method: 'BATCH' } }],
      ['GET', `${BASE_URL}/posts/2`, null, { tags: { method: 'BATCH' } }],
      ['GET', `${BASE_URL}/users/1`, null, { tags: { method: 'BATCH' } }],
      ['GET', `${BASE_URL}/comments/1`, null, { tags: { method: 'BATCH' } }],
    ]);
    batchTime.add(Date.now() - startTime);
    for (let i = 0; i < responses.length; i++) {
      check(responses[i], { [`BATCH[${i}] - status 200`]: (r) => r.status === 200 });
      crudSuccessRate.add(responses[i].status === 200);
    }
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'reports/rest-api-test-report.html': htmlReport(data, { title: 'REST API Test — CRUD + Batch' }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'reports/rest-api-test-summary.json': JSON.stringify(data, null, 2),
  };
}
