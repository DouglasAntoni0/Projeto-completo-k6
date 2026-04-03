import { sleep } from 'k6';

// Think time — simula o tempo de espera entre ações do usuário
export function thinkTime(min = 1, max = 5) {
  sleep(Math.random() * (max - min) + min);
}

export function shortThinkTime() { thinkTime(0.5, 1.5); }
export function mediumThinkTime() { thinkTime(2, 5); }
export function longThinkTime() { thinkTime(5, 10); }

// Geradores de dados
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function randomString(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function randomEmail() {
  const domains = ['email.com', 'teste.com.br', 'exemplo.org', 'mail.com', 'test.io'];
  return `${randomString(8).toLowerCase()}@${randomItem(domains)}`;
}

export function randomTitle() {
  const adj = ['Incrível', 'Fantástico', 'Moderno', 'Eficiente', 'Robusto', 'Completo', 'Avançado', 'Profissional'];
  const nouns = ['Performance', 'Teste', 'Projeto', 'Sistema', 'Framework', 'Análise', 'Resultado', 'Métrica'];
  return `${randomItem(adj)} ${randomItem(nouns)} - ${randomString(5)}`;
}

export function randomBody() {
  const sentences = [
    'Este é um teste automatizado de performance.',
    'Validando a capacidade do sistema sob carga.',
    'Verificando tempos de resposta em cenário de estresse.',
    'Simulando comportamento real de usuários.',
    'Monitorando métricas de desempenho do sistema.',
    'Avaliando a estabilidade da aplicação.',
    'Testando limites de throughput da API.',
    'Coletando dados para análise de capacidade.',
  ];
  let body = '';
  for (let i = 0; i < randomInt(2, 4); i++) body += randomItem(sentences) + ' ';
  return body.trim();
}

export function generatePost(userId) {
  return {
    title: randomTitle(),
    body: randomBody(),
    userId: userId || randomInt(1, 10),
  };
}

export function generateComment(postId) {
  return {
    postId: postId || randomInt(1, 100),
    name: randomTitle(),
    email: randomEmail(),
    body: randomBody(),
  };
}

export function getCurrentTimestamp() {
  return new Date().toISOString();
}

export function calculateDuration(startTime, endTime) {
  return endTime - startTime;
}

export default {
  thinkTime, shortThinkTime, mediumThinkTime, longThinkTime,
  randomInt, randomItem, randomString, randomEmail, randomTitle, randomBody,
  generatePost, generateComment, getCurrentTimestamp, calculateDuration,
};
