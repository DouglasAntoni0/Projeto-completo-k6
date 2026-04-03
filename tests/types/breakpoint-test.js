import { group, sleep } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

import { listarPosts, buscarPost, criarPost } from '../../modules/posts-api.js';
import { listarUsuarios, buscarUsuario } from '../../modules/users-api.js';
import { login } from '../../modules/auth-api.js';
import { randomInt } from '../../helpers/utils.js';

export const options = {
  scenarios: {
    breakpoint: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 2000,
      stages: [
        { duration: '5m', target: 20 },
        { duration: '5m', target: 50 },
        { duration: '5m', target: 100 },
        { duration: '5m', target: 200 },
        { duration: '5m', target: 500 },
        { duration: '5m', target: 1000 },
      ],
    },
  },
  thresholds: {
    http_req_failed: [{
      threshold: 'rate<0.30',
      abortOnFail: true,
      delayAbortEval: '1m',
    }],
    http_req_duration: [{
      threshold: 'p(95)<10000',
      abortOnFail: true,
      delayAbortEval: '1m',
    }],
  },
  tags: { test_type: 'breakpoint' },
};

export default function () {
  group('Carga Progressiva', () => {
    const operation = randomInt(1, 10);

    if (operation <= 4) {
      buscarPost(randomInt(1, 100));
    } else if (operation <= 7) {
      listarPosts();
    } else if (operation <= 8) {
      buscarUsuario(randomInt(1, 10));
    } else if (operation <= 9) {
      criarPost();
    } else {
      login('usuario@email.com', 'senha123');
    }
  });

  sleep(0.1);
}

export function handleSummary(data) {
  return {
    'reports/breakpoint-test-report.html': htmlReport(data, { title: 'Breakpoint Test' }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'reports/breakpoint-test-summary.json': JSON.stringify(data, null, 2),
  };
}
