import { group, check, sleep } from 'k6';
import http from 'k6/http';
import { Counter, Gauge, Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import { randomInt, randomTitle, randomBody, shortThinkTime, mediumThinkTime } from '../../helpers/utils.js';

const BASE_URL = 'https://jsonplaceholder.typicode.com';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

const users = new SharedArray('hybrid-users', function () {
  return JSON.parse(open('../../data/users.json')).users;
});

const totalOperations = new Counter('hybrid_total_operations');
const scenarioReadOps = new Counter('hybrid_scenario_read_operations');
const scenarioWriteOps = new Counter('hybrid_scenario_write_operations');
const currentLatency = new Gauge('hybrid_current_latency');
const currentResponseSize = new Gauge('hybrid_current_response_size');
const overallSuccessRate = new Rate('hybrid_overall_success_rate');
const slaRate = new Rate('hybrid_sla_compliance_rate');
const readSuccessRate = new Rate('hybrid_read_success_rate');
const writeSuccessRate = new Rate('hybrid_write_success_rate');
const readLatency = new Trend('hybrid_read_latency', true);
const writeLatency = new Trend('hybrid_write_latency', true);
const e2eTransactionTime = new Trend('hybrid_e2e_transaction', true);

export const options = {
  scenarios: {
    leitura: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [{ duration: '1m', target: 15 }, { duration: '3m', target: 25 }, { duration: '1m', target: 0 }],
      exec: 'cenarioLeitura',
      tags: { scenario: 'leitura' },
    },
    escrita: {
      executor: 'constant-arrival-rate',
      rate: 5, timeUnit: '1s', duration: '4m',
      preAllocatedVUs: 10, maxVUs: 30,
      startTime: '30s',
      exec: 'cenarioEscrita',
      tags: { scenario: 'escrita' },
    },
    e2e_flow: {
      executor: 'per-vu-iterations',
      vus: 5, iterations: 10, maxDuration: '4m',
      startTime: '1m',
      exec: 'cenarioE2E',
      tags: { scenario: 'e2e' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1500'],
    http_req_failed: ['rate<0.05'],
    checks: ['rate>0.90'],
    'http_req_duration{scenario:leitura}': ['p(95)<800'],
    'http_req_duration{scenario:escrita}': ['p(95)<1000'],
    'http_req_duration{scenario:e2e}': ['p(95)<1200'],
    hybrid_overall_success_rate: ['rate>0.90'],
    hybrid_sla_compliance_rate: ['rate>0.80'],
    hybrid_read_latency: ['p(95)<800'],
    hybrid_write_latency: ['p(95)<1000'],
    hybrid_e2e_transaction: ['p(95)<10000'],
    hybrid_total_operations: ['count>100'],
  },
};

function recordMetrics(res, type) {
  const ok = res.status >= 200 && res.status < 400;
  totalOperations.add(1);
  overallSuccessRate.add(ok);
  slaRate.add(res.timings.duration < 500);
  currentLatency.add(res.timings.duration);
  if (res.body) currentResponseSize.add(res.body.length);

  if (type === 'read') {
    scenarioReadOps.add(1); readLatency.add(res.timings.duration); readSuccessRate.add(ok);
  } else {
    scenarioWriteOps.add(1); writeLatency.add(res.timings.duration); writeSuccessRate.add(ok);
  }
}

export function setup() {
  const health = http.get(`${BASE_URL}/posts/1`);
  const loginRes = http.post(`${BASE_URL}/posts`,
    JSON.stringify({ title: 'Login', body: 'auth', userId: 1 }),
    { headers: JSON_HEADERS }
  );
  return {
    token: loginRes.status === 201 ? `token-${JSON.parse(loginRes.body).id}` : null,
    systemsHealthy: health.status === 200,
    startedAt: new Date().toISOString(),
  };
}

export function cenarioLeitura() {
  group('Cenário de Leitura', () => {
    group('Feed', () => {
      const res = http.get(`${BASE_URL}/posts`, { tags: { action: 'list_posts', priority: 'high' } });
      recordMetrics(res, 'read');
      check(res, { 'feed carregado': (r) => r.status === 200 });
      shortThinkTime();
    });

    group('Detalhe', () => {
      const user = users[randomInt(0, users.length - 1)];
      const res = http.get(`${BASE_URL}/posts/${randomInt(1, 100)}`, {
        tags: { action: 'view_post', priority: 'high', user_role: user.role },
      });
      recordMetrics(res, 'read');
      check(res, { 'post carregado': (r) => r.status === 200 });
      mediumThinkTime();
    });

    group('Comentários', () => {
      const res = http.get(`${BASE_URL}/posts/${randomInt(1, 100)}/comments`, {
        tags: { action: 'view_comments', priority: 'medium' },
      });
      recordMetrics(res, 'read');
      check(res, { 'comentários carregados': (r) => r.status === 200 });
    });
  });
  sleep(1);
}

export function cenarioEscrita() {
  group('Cenário de Escrita', () => {
    const op = randomInt(1, 4);
    if (op === 1) {
      group('Criar Post', () => {
        const res = http.post(`${BASE_URL}/posts`,
          JSON.stringify({ title: randomTitle(), body: randomBody(), userId: randomInt(1, 10) }),
          { headers: JSON_HEADERS, tags: { action: 'create_post', priority: 'high' } });
        recordMetrics(res, 'write');
        check(res, { 'post criado (201)': (r) => r.status === 201 });
      });
    } else if (op === 2) {
      group('Atualizar Post (PUT)', () => {
        const id = randomInt(1, 100);
        const res = http.put(`${BASE_URL}/posts/${id}`,
          JSON.stringify({ id, title: randomTitle(), body: randomBody(), userId: 1 }),
          { headers: JSON_HEADERS, tags: { action: 'update_post', priority: 'high' } });
        recordMetrics(res, 'write');
        check(res, { 'post atualizado': (r) => r.status === 200 });
      });
    } else if (op === 3) {
      group('Atualizar Post (PATCH)', () => {
        const res = http.patch(`${BASE_URL}/posts/${randomInt(1, 100)}`,
          JSON.stringify({ title: randomTitle() }),
          { headers: JSON_HEADERS, tags: { action: 'patch_post', priority: 'medium' } });
        recordMetrics(res, 'write');
        check(res, { 'post atualizado (PATCH)': (r) => r.status === 200 });
      });
    } else {
      group('Deletar Post', () => {
        const res = http.del(`${BASE_URL}/posts/${randomInt(1, 100)}`, null, {
          tags: { action: 'delete_post', priority: 'high' },
        });
        recordMetrics(res, 'write');
        check(res, { 'post deletado': (r) => r.status === 200 });
      });
    }
  });
}

export function cenarioE2E() {
  const start = Date.now();

  group('Cenário E2E', () => {
    group('1. Autenticar', () => {
      const res = http.post(`${BASE_URL}/posts`,
        JSON.stringify({ title: 'Login', body: 'auth', userId: 1 }),
        { headers: JSON_HEADERS, tags: { action: 'e2e_login', e2e_step: '1' } });
      recordMetrics(res, 'write');
      check(res, { 'E2E login OK': (r) => r.status === 201 });
      shortThinkTime();
    });

    group('2. Navegar', () => {
      const res = http.get(`${BASE_URL}/posts`, { tags: { action: 'e2e_browse', e2e_step: '2' } });
      recordMetrics(res, 'read');
      check(res, { 'E2E feed OK': (r) => r.status === 200 });
      shortThinkTime();
    });

    group('3. Ler Post', () => {
      const res = http.get(`${BASE_URL}/posts/${randomInt(1, 100)}`, { tags: { action: 'e2e_read', e2e_step: '3' } });
      recordMetrics(res, 'read');
      check(res, { 'E2E post OK': (r) => r.status === 200 });
      mediumThinkTime();
    });

    group('4. Criar Post', () => {
      const res = http.post(`${BASE_URL}/posts`,
        JSON.stringify({ title: randomTitle(), body: randomBody(), userId: 1 }),
        { headers: JSON_HEADERS, tags: { action: 'e2e_create', e2e_step: '4' } });
      recordMetrics(res, 'write');
      check(res, { 'E2E post criado': (r) => r.status === 201 });
      shortThinkTime();
    });

    group('5. Verificar', () => {
      const res = http.get(`${BASE_URL}/posts?userId=1`, { tags: { action: 'e2e_verify', e2e_step: '5' } });
      recordMetrics(res, 'read');
      check(res, { 'E2E verificação OK': (r) => r.status === 200 });
    });
  });

  e2eTransactionTime.add(Date.now() - start);
  sleep(2);
}

export function teardown(setupData) {
  const res = http.get(`${BASE_URL}/posts/1`);
  check(res, { '[TEARDOWN] sistema saudável': (r) => r.status === 200 });
}

export function handleSummary(data) {
  return {
    'reports/hybrid-test-report.html': htmlReport(data, { title: 'Hybrid Test — Todas as Técnicas' }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'reports/hybrid-test-summary.json': JSON.stringify(data, null, 2),
  };
}
