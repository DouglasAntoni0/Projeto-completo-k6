import { group, check, sleep } from 'k6';
import http from 'k6/http';
import { Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

const BASE_URL = 'https://jsonplaceholder.typicode.com';

const setupDuration = new Counter('lifecycle_setup_duration_ms');
const teardownDuration = new Counter('lifecycle_teardown_duration_ms');
const iterationCount = new Counter('lifecycle_iterations_total');

const testUsers = new SharedArray('lifecycle-users', function () {
  return [
    { id: 1, name: 'Leanne Graham' },
    { id: 2, name: 'Ervin Howell' },
    { id: 3, name: 'Clementine Bauch' },
    { id: 4, name: 'Patricia Lebsack' },
    { id: 5, name: 'Chelsey Dietrich' },
  ];
});

export const options = {
  stages: [
    { duration: '1m', target: 5 },
    { duration: '2m', target: 10 },
    { duration: '1m', target: 5 },
    { duration: '30s', target: 0 },
  ],
  thresholds: { http_req_duration: ['p(95)<800'], http_req_failed: ['rate<0.05'], checks: ['rate>0.90'] },
  tags: { test_type: 'lifecycle_demo' },
};

export function setup() {
  const startTime = Date.now();

  // Verificar disponibilidade
  const healthCheck = http.get(`${BASE_URL}/posts/1`);
  const isHealthy = check(healthCheck, {
    '[SETUP] sistema acessível': (r) => r.status === 200,
  });

  if (!isHealthy) {
    throw new Error('Sistema não está acessível. Abortando teste.');
  }

  // Criar dado de teste
  const postRes = http.post(`${BASE_URL}/posts`,
    JSON.stringify({ title: 'Post criado no Setup', body: 'Dado de teste.', userId: 1 }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  let setupPostId = null;
  try { setupPostId = JSON.parse(postRes.body).id; } catch (e) { setupPostId = 101; }

  setupDuration.add(Date.now() - startTime);

  return {
    setupPostId,
    startTime: new Date().toISOString(),
    systemHealthy: isHealthy,
  };
}

export default function (setupData) {
  iterationCount.add(1);

  group('Operações com Dados do Setup', () => {
    group('Usar Dados do Setup', () => {
      const res = http.get(`${BASE_URL}/posts/1`, { tags: { lifecycle_phase: 'vu_code' } });
      check(res, { '[VU] consegue acessar API': (r) => r.status === 200 });
      sleep(0.3);
    });

    group('Usar Dados do Init', () => {
      const user = testUsers[__VU % testUsers.length];
      const res = http.get(`${BASE_URL}/users/${user.id}`, {
        tags: { lifecycle_phase: 'vu_code', user_name: user.name },
      });
      check(res, {
        '[VU] buscar usuário do SharedArray': (r) => r.status === 200,
        '[VU] nome correto': (r) => {
          try { return JSON.parse(r.body).name === user.name; } catch (e) { return false; }
        },
      });
      sleep(0.3);
    });

    group('CRUD por VU', () => {
      const payload = JSON.stringify({
        title: `Post do VU #${__VU} - Iteração #${__ITER}`,
        body: `Criado em ${new Date().toISOString()}`,
        userId: (__VU % 10) + 1,
      });
      const res = http.post(`${BASE_URL}/posts`, payload, {
        headers: { 'Content-Type': 'application/json' },
        tags: { lifecycle_phase: 'vu_code' },
      });
      check(res, { '[VU] criar post - status 201': (r) => r.status === 201 });
    });
  });

  sleep(1);
}

export function teardown(setupData) {
  const startTime = Date.now();

  const healthCheck = http.get(`${BASE_URL}/posts/1`);
  check(healthCheck, { '[TEARDOWN] sistema ainda acessível': (r) => r.status === 200 });

  if (setupData.setupPostId) {
    const deleteRes = http.del(`${BASE_URL}/posts/${setupData.setupPostId}`);
    check(deleteRes, { '[TEARDOWN] post de teste removido': (r) => r.status === 200 });
  }

  teardownDuration.add(Date.now() - startTime);
}

export function handleSummary(data) {
  return {
    'reports/lifecycle-test-report.html': htmlReport(data, { title: 'Lifecycle Test' }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'reports/lifecycle-test-summary.json': JSON.stringify(data, null, 2),
  };
}
