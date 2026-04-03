import { sleep } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

import { listarPosts, buscarPost, criarPost } from '../../modules/posts-api.js';
import { listarUsuarios, buscarUsuario } from '../../modules/users-api.js';
import { login } from '../../modules/auth-api.js';
import { randomInt, shortThinkTime } from '../../helpers/utils.js';

export const options = {
  scenarios: {
    shared_iterations: {
      executor: 'shared-iterations',
      vus: 5, iterations: 100, maxDuration: '5m',
      exec: 'sharedIterationsScenario',
      tags: { executor: 'shared-iterations' },
    },
    per_vu_iterations: {
      executor: 'per-vu-iterations',
      vus: 5, iterations: 10, maxDuration: '5m',
      exec: 'perVuIterationsScenario',
      tags: { executor: 'per-vu-iterations' },
    },
    constant_vus: {
      executor: 'constant-vus',
      vus: 10, duration: '3m',
      exec: 'constantVusScenario',
      tags: { executor: 'constant-vus' },
    },
    ramping_vus: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '2m', target: 20 },
        { duration: '1m', target: 10 },
        { duration: '1m', target: 0 },
      ],
      exec: 'rampingVusScenario',
      tags: { executor: 'ramping-vus' },
    },
    constant_arrival_rate: {
      executor: 'constant-arrival-rate',
      rate: 10, timeUnit: '1s', duration: '3m',
      preAllocatedVUs: 20, maxVUs: 50,
      exec: 'constantArrivalRateScenario',
      tags: { executor: 'constant-arrival-rate' },
    },
    ramping_arrival_rate: {
      executor: 'ramping-arrival-rate',
      startRate: 2, timeUnit: '1s',
      preAllocatedVUs: 20, maxVUs: 50,
      stages: [
        { duration: '1m', target: 5 },
        { duration: '2m', target: 15 },
        { duration: '1m', target: 5 },
        { duration: '1m', target: 2 },
      ],
      exec: 'rampingArrivalRateScenario',
      tags: { executor: 'ramping-arrival-rate' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],
    checks: ['rate>0.90'],
    'http_req_duration{executor:shared-iterations}': ['p(95)<800'],
    'http_req_duration{executor:constant-arrival-rate}': ['p(95)<1200'],
    'http_req_duration{executor:ramping-arrival-rate}': ['p(95)<1200'],
  },
  tags: { test_type: 'scenarios_demo' },
};

export function sharedIterationsScenario() {
  listarPosts();
  sleep(0.5);
}

export function perVuIterationsScenario() {
  buscarPost(randomInt(1, 100));
  sleep(0.5);
}

export function constantVusScenario() {
  listarUsuarios();
  shortThinkTime();
  buscarUsuario(randomInt(1, 10));
  sleep(1);
}

export function rampingVusScenario() {
  listarPosts();
  shortThinkTime();
  buscarPost(randomInt(1, 100));
  shortThinkTime();
  criarPost();
  sleep(1);
}

export function constantArrivalRateScenario() {
  login('usuario@email.com', 'senha123');
  sleep(0.3);
}

export function rampingArrivalRateScenario() {
  const op = randomInt(1, 3);
  if (op === 1) buscarPost(randomInt(1, 100));
  else if (op === 2) buscarUsuario(randomInt(1, 10));
  else criarPost();
  sleep(0.3);
}

export function handleSummary(data) {
  return {
    'reports/scenarios-test-report.html': htmlReport(data, { title: 'Scenarios Test — 6 Executors' }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'reports/scenarios-test-summary.json': JSON.stringify(data, null, 2),
  };
}
