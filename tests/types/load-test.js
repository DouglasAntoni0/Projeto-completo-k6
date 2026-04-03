import { group, sleep } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

import { defaultThresholds } from '../../config/thresholds.js';
import { listarPosts, buscarPost, criarPost, filtrarPostsPorUsuario } from '../../modules/posts-api.js';
import { listarUsuarios, buscarUsuario, buscarPostsDoUsuario } from '../../modules/users-api.js';
import { filtrarComentariosPorPost, criarComentario } from '../../modules/comments-api.js';
import { login } from '../../modules/auth-api.js';
import { trackBusinessTransaction } from '../../helpers/custom-metrics.js';
import { mediumThinkTime, shortThinkTime, randomInt } from '../../helpers/utils.js';

export const options = {
  stages: [
    { duration: '3m', target: 50 },
    { duration: '7m', target: 50 },
    { duration: '5m', target: 100 },
    { duration: '3m', target: 100 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    ...defaultThresholds,
    'http_req_duration{endpoint:posts}': ['p(95)<700'],
    'http_req_duration{endpoint:users}': ['p(95)<700'],
  },
  tags: { test_type: 'load' },
};

export default function () {
  const startTime = Date.now();

  group('Navegação', () => {
    listarPosts();
    shortThinkTime();
    listarUsuarios();
    mediumThinkTime();
  });

  group('Leitura Detalhada', () => {
    const postId = randomInt(1, 100);
    buscarPost(postId);
    shortThinkTime();
    filtrarComentariosPorPost(postId);
    mediumThinkTime();
  });

  group('Perfil de Usuário', () => {
    const userId = randomInt(1, 10);
    buscarUsuario(userId);
    shortThinkTime();
    buscarPostsDoUsuario(userId);
    shortThinkTime();
    filtrarPostsPorUsuario(userId);
    mediumThinkTime();
  });

  group('Criação de Conteúdo', () => {
    criarPost();
    shortThinkTime();
    criarComentario();
    mediumThinkTime();
  });

  group('Autenticação', () => {
    login('usuario@email.com', 'senha123');
  });

  trackBusinessTransaction(Date.now() - startTime);
  sleep(1);
}

export function handleSummary(data) {
  return {
    'reports/load-test-report.html': htmlReport(data, { title: 'Load Test' }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'reports/load-test-summary.json': JSON.stringify(data, null, 2),
  };
}
