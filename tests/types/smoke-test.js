import { group, sleep } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

import { smokeThresholds } from '../../config/thresholds.js';
import { listarPosts, buscarPost, criarPost } from '../../modules/posts-api.js';
import { listarUsuarios, buscarUsuario } from '../../modules/users-api.js';
import { login } from '../../modules/auth-api.js';
import { shortThinkTime, randomInt } from '../../helpers/utils.js';

export const options = {
  vus: 3,
  duration: '2m',
  thresholds: smokeThresholds,
  tags: { test_type: 'smoke' },
};

export default function () {
  group('Listar Recursos', () => {
    listarPosts();
    shortThinkTime();
    listarUsuarios();
    shortThinkTime();
  });

  group('Buscar Recurso', () => {
    buscarPost(randomInt(1, 100));
    shortThinkTime();
    buscarUsuario(randomInt(1, 10));
    shortThinkTime();
  });

  group('Criar Recurso', () => {
    criarPost();
    shortThinkTime();
  });

  login('usuario@email.com', 'senha123');
  sleep(1);
}

export function handleSummary(data) {
  return {
    'reports/smoke-test-report.html': htmlReport(data, { title: 'Smoke Test' }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'reports/smoke-test-summary.json': JSON.stringify(data, null, 2),
  };
}
