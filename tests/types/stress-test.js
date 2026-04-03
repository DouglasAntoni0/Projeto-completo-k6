import { group, sleep } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

import { stressThresholds } from '../../config/thresholds.js';
import { listarPosts, buscarPost, criarPost, atualizarPost, excluirPost } from '../../modules/posts-api.js';
import { listarUsuarios, buscarUsuario } from '../../modules/users-api.js';
import { login } from '../../modules/auth-api.js';
import { shortThinkTime, randomInt } from '../../helpers/utils.js';

export const options = {
  stages: [
    { duration: '3m', target: 50 },
    { duration: '5m', target: 100 },
    { duration: '5m', target: 200 },
    { duration: '5m', target: 400 },
    { duration: '3m', target: 400 },
    { duration: '4m', target: 0 },
  ],
  thresholds: stressThresholds,
  tags: { test_type: 'stress' },
};

export default function () {
  group('Carga de Leitura', () => {
    listarPosts();
    shortThinkTime();
    buscarPost(randomInt(1, 100));
    shortThinkTime();
    listarUsuarios();
    shortThinkTime();
    buscarUsuario(randomInt(1, 10));
  });

  group('Carga de Escrita', () => {
    criarPost();
    shortThinkTime();
    atualizarPost(randomInt(1, 100));
    shortThinkTime();
    excluirPost(randomInt(1, 100));
  });

  group('Autenticação sob Carga', () => {
    login('usuario@email.com', 'senha123');
  });

  sleep(0.5);
}

export function handleSummary(data) {
  return {
    'reports/stress-test-report.html': htmlReport(data, { title: 'Stress Test' }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'reports/stress-test-summary.json': JSON.stringify(data, null, 2),
  };
}
