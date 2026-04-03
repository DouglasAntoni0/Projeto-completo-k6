import { group, check, sleep } from 'k6';
import http from 'k6/http';
import { Trend, Rate, Counter } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import { randomInt } from '../../helpers/utils.js';

const apiResponseTime = new Trend('threshold_api_response_time', true);
const authResponseTime = new Trend('threshold_auth_response_time', true);
const apiSuccessRate = new Rate('threshold_api_success_rate');
const authSuccessRate = new Rate('threshold_auth_success_rate');
const totalApiCalls = new Counter('threshold_total_api_calls');

export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '3m', target: 20 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(90)<500', 'p(95)<800', 'p(99)<1500', 'avg<300', 'med<250', 'max<5000', 'min>=0'],
    http_req_failed: ['rate<0.01'],
    http_reqs: ['count>100', 'rate>5'],
    checks: ['rate>0.95'],

    // Por criticidade
    'http_req_duration{criticality:critical}': [{ threshold: 'p(95)<400', abortOnFail: false }],
    'http_req_duration{criticality:normal}': [{ threshold: 'p(95)<700', abortOnFail: false }],
    'http_req_duration{criticality:background}': ['p(95)<2000'],

    // Por endpoint
    'http_req_duration{endpoint:posts}': ['p(95)<600'],
    'http_req_duration{endpoint:users}': ['p(95)<600'],
    'http_req_duration{endpoint:login}': ['p(95)<800'],

    // Com abortOnFail
    'http_req_failed{criticality:critical}': [{
      threshold: 'rate<0.05',
      abortOnFail: true,
      delayAbortEval: '30s',
    }],

    // Métricas customizadas
    threshold_api_response_time: ['p(95)<600', 'avg<300'],
    threshold_auth_response_time: ['p(95)<1000'],
    threshold_api_success_rate: ['rate>0.95'],
    threshold_auth_success_rate: ['rate>0.90'],
    threshold_total_api_calls: ['count>200'],

    // Por grupo
    'group_duration{group:::Operações de Leitura}': ['p(95)<3000'],
    'group_duration{group:::Operações de Escrita}': ['p(95)<4000'],
    'group_duration{group:::Autenticação}': ['p(95)<2000'],
  },
  tags: { test_type: 'thresholds_demo' },
};

export default function () {
  group('Operações de Leitura', () => {
    const res1 = http.get('https://jsonplaceholder.typicode.com/posts', {
      tags: { endpoint: 'posts', criticality: 'normal', operation: 'list' },
    });
    apiResponseTime.add(res1.timings.duration);
    apiSuccessRate.add(res1.status === 200);
    totalApiCalls.add(1);
    check(res1, { 'listar posts - 200': (r) => r.status === 200 });
    sleep(0.5);

    const res2 = http.get(`https://jsonplaceholder.typicode.com/posts/${randomInt(1, 100)}`, {
      tags: { endpoint: 'posts', criticality: 'normal', operation: 'get' },
    });
    apiResponseTime.add(res2.timings.duration);
    apiSuccessRate.add(res2.status === 200);
    totalApiCalls.add(1);
    check(res2, { 'buscar post - 200': (r) => r.status === 200 });
    sleep(0.5);
  });

  group('Operações de Escrita', () => {
    const payload = JSON.stringify({ title: 'Threshold Test Post', body: 'Testando thresholds.', userId: 1 });
    const res = http.post('https://jsonplaceholder.typicode.com/posts', payload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { endpoint: 'posts', criticality: 'critical', operation: 'create' },
    });
    apiResponseTime.add(res.timings.duration);
    apiSuccessRate.add(res.status === 201);
    totalApiCalls.add(1);
    check(res, { 'criar post - 201': (r) => r.status === 201 });
    sleep(0.5);
  });

  group('Autenticação', () => {
    const payload = JSON.stringify({ title: 'Login', body: 'auth', userId: 1 });
    const res = http.post('https://jsonplaceholder.typicode.com/posts', payload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { endpoint: 'login', criticality: 'critical', operation: 'auth' },
    });
    authResponseTime.add(res.timings.duration);
    authSuccessRate.add(res.status === 201);
    totalApiCalls.add(1);
    check(res, { 'login - 201': (r) => r.status === 201 });
  });

  group('Operações Background', () => {
    const res = http.get('https://jsonplaceholder.typicode.com/comments', {
      tags: { endpoint: 'comments', criticality: 'background', operation: 'list' },
    });
    apiResponseTime.add(res.timings.duration);
    apiSuccessRate.add(res.status === 200);
    totalApiCalls.add(1);
    check(res, { 'listar comentários - 200': (r) => r.status === 200 });
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'reports/thresholds-test-report.html': htmlReport(data, { title: 'Thresholds Test' }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'reports/thresholds-test-summary.json': JSON.stringify(data, null, 2),
  };
}
