import { group, check, sleep } from 'k6';
import http from 'k6/http';
import { Counter, Trend, Rate } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import { randomInt, randomTitle, randomBody, mediumThinkTime, shortThinkTime, longThinkTime } from '../../helpers/utils.js';

const BASE_URL = 'https://jsonplaceholder.typicode.com';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

const readerOps = new Counter('multi_reader_operations');
const creatorOps = new Counter('multi_creator_operations');
const adminOps = new Counter('multi_admin_operations');
const apiOps = new Counter('multi_api_operations');
const readerTime = new Trend('multi_reader_response_time', true);
const creatorTime = new Trend('multi_creator_response_time', true);
const adminTime = new Trend('multi_admin_response_time', true);
const apiTime = new Trend('multi_api_response_time', true);
const overallSuccess = new Rate('multi_overall_success_rate');

export const options = {
  scenarios: {
    leitores_casuais: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [{ duration: '2m', target: 30 }, { duration: '5m', target: 30 }, { duration: '2m', target: 0 }],
      exec: 'leitorCasual',
      tags: { user_profile: 'leitor_casual' },
    },
    criadores_conteudo: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [{ duration: '2m', target: 10 }, { duration: '5m', target: 10 }, { duration: '2m', target: 0 }],
      exec: 'criadorConteudo',
      tags: { user_profile: 'criador_conteudo' },
    },
    administradores: {
      executor: 'constant-vus',
      vus: 5, duration: '8m',
      exec: 'administrador',
      startTime: '1m',
      tags: { user_profile: 'admin' },
    },
    api_consumers: {
      executor: 'constant-arrival-rate',
      rate: 10, timeUnit: '1s', duration: '8m',
      preAllocatedVUs: 15, maxVUs: 30,
      exec: 'apiConsumer',
      startTime: '30s',
      tags: { user_profile: 'api_consumer' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1500'],
    http_req_failed: ['rate<0.05'],
    checks: ['rate>0.90'],
    multi_overall_success_rate: ['rate>0.90'],
    'http_req_duration{user_profile:leitor_casual}': ['p(95)<800'],
    'http_req_duration{user_profile:criador_conteudo}': ['p(95)<1000'],
    'http_req_duration{user_profile:admin}': ['p(95)<800'],
    'http_req_duration{user_profile:api_consumer}': ['p(95)<1200'],
    multi_reader_response_time: ['p(95)<800'],
    multi_creator_response_time: ['p(95)<1000'],
    multi_admin_response_time: ['p(95)<800'],
    multi_api_response_time: ['p(95)<1200'],
  },
};

function track(res, trend, counter) {
  trend.add(res.timings.duration);
  counter.add(1);
  overallSuccess.add(res.status >= 200 && res.status < 400);
}

export function leitorCasual() {
  group('Leitor Casual', () => {
    let res = http.get(`${BASE_URL}/posts`, { tags: { action: 'view_feed' } });
    track(res, readerTime, readerOps);
    check(res, { '[Leitor] feed carregado': (r) => r.status === 200 });
    mediumThinkTime();

    res = http.get(`${BASE_URL}/posts/${randomInt(1, 100)}`, { tags: { action: 'read_post' } });
    track(res, readerTime, readerOps);
    check(res, { '[Leitor] post lido': (r) => r.status === 200 });
    longThinkTime();

    res = http.get(`${BASE_URL}/posts/${randomInt(1, 100)}/comments`, { tags: { action: 'view_comments' } });
    track(res, readerTime, readerOps);
    check(res, { '[Leitor] comentários carregados': (r) => r.status === 200 });
    shortThinkTime();

    res = http.get(`${BASE_URL}/users/${randomInt(1, 10)}`, { tags: { action: 'view_profile' } });
    track(res, readerTime, readerOps);
    check(res, { '[Leitor] perfil carregado': (r) => r.status === 200 });
  });
  sleep(2);
}

export function criadorConteudo() {
  group('Criador de Conteúdo', () => {
    let res = http.post(`${BASE_URL}/posts`,
      JSON.stringify({ title: 'Login', body: 'auth', userId: 1 }),
      { headers: JSON_HEADERS, tags: { action: 'login' } }
    );
    track(res, creatorTime, creatorOps);
    check(res, { '[Criador] login OK': (r) => r.status === 201 });
    shortThinkTime();

    res = http.post(`${BASE_URL}/posts`,
      JSON.stringify({ title: randomTitle(), body: randomBody(), userId: randomInt(1, 10) }),
      { headers: JSON_HEADERS, tags: { action: 'create_post' } }
    );
    track(res, creatorTime, creatorOps);
    check(res, { '[Criador] post criado': (r) => r.status === 201 });
    longThinkTime();

    res = http.patch(`${BASE_URL}/posts/${randomInt(1, 100)}`,
      JSON.stringify({ title: `${randomTitle()} (editado)` }),
      { headers: JSON_HEADERS, tags: { action: 'edit_post' } }
    );
    track(res, creatorTime, creatorOps);
    check(res, { '[Criador] post editado': (r) => r.status === 200 });
    mediumThinkTime();

    res = http.post(`${BASE_URL}/comments`,
      JSON.stringify({ postId: randomInt(1, 100), name: randomTitle(), email: 'criador@email.com', body: randomBody() }),
      { headers: JSON_HEADERS, tags: { action: 'create_comment' } }
    );
    track(res, creatorTime, creatorOps);
    check(res, { '[Criador] comentário criado': (r) => r.status === 201 });
  });
  sleep(3);
}

export function administrador() {
  group('Administrador', () => {
    let res = http.get(`${BASE_URL}/users`, { tags: { action: 'list_users' } });
    track(res, adminTime, adminOps);
    check(res, { '[Admin] usuários listados': (r) => r.status === 200 });
    shortThinkTime();

    res = http.get(`${BASE_URL}/users/${randomInt(1, 10)}`, { tags: { action: 'detail_user' } });
    track(res, adminTime, adminOps);
    check(res, { '[Admin] detalhe do usuário': (r) => r.status === 200 });
    shortThinkTime();

    res = http.del(`${BASE_URL}/posts/${randomInt(1, 100)}`, null, { tags: { action: 'moderate_delete' } });
    track(res, adminTime, adminOps);
    check(res, { '[Admin] post moderado': (r) => r.status === 200 });
    mediumThinkTime();

    res = http.get(`${BASE_URL}/comments?postId=${randomInt(1, 100)}`, { tags: { action: 'review_comments' } });
    track(res, adminTime, adminOps);
    check(res, { '[Admin] comentários revisados': (r) => r.status === 200 });
  });
  sleep(2);
}

export function apiConsumer() {
  group('API Consumer', () => {
    const op = randomInt(1, 5);
    let res;

    if (op === 1) res = http.get(`${BASE_URL}/posts`, { tags: { action: 'api_list' } });
    else if (op === 2) res = http.get(`${BASE_URL}/posts/${randomInt(1, 100)}`, { tags: { action: 'api_get' } });
    else if (op === 3) res = http.post(`${BASE_URL}/posts`,
      JSON.stringify({ title: randomTitle(), body: randomBody(), userId: 1 }),
      { headers: JSON_HEADERS, tags: { action: 'api_create' } });
    else if (op === 4) res = http.put(`${BASE_URL}/posts/${randomInt(1, 100)}`,
      JSON.stringify({ title: randomTitle(), body: randomBody(), userId: 1, id: 1 }),
      { headers: JSON_HEADERS, tags: { action: 'api_update' } });
    else res = http.del(`${BASE_URL}/posts/${randomInt(1, 100)}`, null, { tags: { action: 'api_delete' } });

    track(res, apiTime, apiOps);
    check(res, { '[API] operação OK': (r) => r.status >= 200 && r.status < 300 });
  });
}

export function handleSummary(data) {
  return {
    'reports/multi-scenario-test-report.html': htmlReport(data, { title: 'Multi-Scenario Test' }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'reports/multi-scenario-test-summary.json': JSON.stringify(data, null, 2),
  };
}
