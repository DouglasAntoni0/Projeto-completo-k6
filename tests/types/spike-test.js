import { group, sleep } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

import { stressThresholds } from '../../config/thresholds.js';
import { listarPosts, buscarPost, criarPost } from '../../modules/posts-api.js';
import { listarUsuarios, buscarUsuario } from '../../modules/users-api.js';
import { login } from '../../modules/auth-api.js';
import { shortThinkTime, randomInt } from '../../helpers/utils.js';

export const options = {
  stages: [
    { duration: '2m', target: 5 },
    { duration: '30s', target: 500 },  // spike
    { duration: '1m', target: 500 },
    { duration: '30s', target: 5 },    // recuperação
    { duration: '2m', target: 5 },
    { duration: '30s', target: 500 },  // segundo spike
    { duration: '1m', target: 500 },
    { duration: '30s', target: 5 },
    { duration: '2m', target: 5 },
    { duration: '5m', target: 0 },
  ],
  thresholds: stressThresholds,
  tags: { test_type: 'spike' },
};

export default function () {
  group('Operações durante Spike', () => {
    listarPosts();
    shortThinkTime();
    buscarPost(randomInt(1, 100));
    shortThinkTime();
    listarUsuarios();
    shortThinkTime();
    buscarUsuario(randomInt(1, 10));
    shortThinkTime();
    criarPost();
  });

  login('usuario@email.com', 'senha123');
  sleep(0.5);
}

export function handleSummary(data) {
  return {
    'reports/spike-test-report.html': htmlReport(data, { title: 'Spike Test' }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'reports/spike-test-summary.json': JSON.stringify(data, null, 2),
  };
}
