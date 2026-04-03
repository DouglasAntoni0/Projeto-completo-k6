import { group, check, sleep } from 'k6';
import http from 'k6/http';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import { randomInt } from '../../helpers/utils.js';

export const options = {
  stages: [
    { duration: '1m', target: 5 },
    { duration: '3m', target: 10 },
    { duration: '1m', target: 0 },
  ],
  thresholds: { checks: ['rate>0.95'], http_req_duration: ['p(95)<1000'] },
  tags: { test_type: 'checks_demo' },
};

export default function () {
  group('Checks de Status Code', () => {
    const res200 = http.get('https://jsonplaceholder.typicode.com/posts/1');
    check(res200, {
      'GET /posts/1 → status é 200': (r) => r.status === 200,
      'GET /posts/1 → status é 2xx': (r) => r.status >= 200 && r.status < 300,
      'GET /posts/1 → não é erro do servidor': (r) => r.status < 500,
    });

    const res201 = http.post(
      'https://jsonplaceholder.typicode.com/posts',
      JSON.stringify({ title: 'Test', body: 'Test', userId: 1 }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    check(res201, { 'POST /posts → status é 201': (r) => r.status === 201 });

    const res404 = http.get('https://jsonplaceholder.typicode.com/posts/9999');
    check(res404, { 'GET /posts/9999 → status é 404': (r) => r.status === 404 });
    sleep(0.5);
  });

  group('Checks de Body', () => {
    const res = http.get('https://jsonplaceholder.typicode.com/posts/1');
    check(res, {
      'body não está vazio': (r) => r.body !== null && r.body !== '',
      'body tem conteúdo': (r) => r.body.length > 0,
      'body contém "userId"': (r) => r.body.includes('userId'),
      'body contém "title"': (r) => r.body.includes('title'),
      'body NÃO contém "error"': (r) => !r.body.includes('error'),
    });
    sleep(0.5);
  });

  group('Checks de Headers', () => {
    const res = http.get('https://jsonplaceholder.typicode.com/posts');
    check(res, {
      'Content-Type existe': (r) => r.headers['Content-Type'] !== undefined,
      'Content-Type contém application/json': (r) => r.headers['Content-Type'].includes('application/json'),
      'tem header Cache-Control': (r) => r.headers['Cache-Control'] !== undefined,
    });
    sleep(0.5);
  });

  group('Checks de JSON', () => {
    const postId = randomInt(1, 100);
    const res = http.get(`https://jsonplaceholder.typicode.com/posts/${postId}`);
    check(res, {
      'JSON é parseável': (r) => { try { JSON.parse(r.body); return true; } catch (e) { return false; } },
      'JSON tem campo "id"': (r) => { try { return JSON.parse(r.body).id !== undefined; } catch (e) { return false; } },
      'JSON tem campo "title"': (r) => { try { return JSON.parse(r.body).title !== undefined; } catch (e) { return false; } },
      'id é número': (r) => { try { return typeof JSON.parse(r.body).id === 'number'; } catch (e) { return false; } },
      'title é string': (r) => { try { return typeof JSON.parse(r.body).title === 'string'; } catch (e) { return false; } },
      [`id é ${postId}`]: (r) => { try { return JSON.parse(r.body).id === postId; } catch (e) { return false; } },
      'userId está entre 1-10': (r) => {
        try { const u = JSON.parse(r.body).userId; return u >= 1 && u <= 10; } catch (e) { return false; }
      },
    });
    sleep(0.5);
  });

  group('Checks de Array', () => {
    const res = http.get('https://jsonplaceholder.typicode.com/posts');
    check(res, {
      'resposta é um array': (r) => { try { return Array.isArray(JSON.parse(r.body)); } catch (e) { return false; } },
      'array tem 100 itens': (r) => { try { return JSON.parse(r.body).length === 100; } catch (e) { return false; } },
      'primeiro item tem id=1': (r) => { try { return JSON.parse(r.body)[0].id === 1; } catch (e) { return false; } },
      'último item tem id=100': (r) => {
        try { const a = JSON.parse(r.body); return a[a.length - 1].id === 100; } catch (e) { return false; }
      },
      'todos os itens têm id': (r) => {
        try { return JSON.parse(r.body).every(item => item.id !== undefined); } catch (e) { return false; }
      },
    });
    sleep(0.5);
  });

  group('Checks de Tempo de Resposta', () => {
    const res = http.get('https://jsonplaceholder.typicode.com/posts/1');
    check(res, {
      'tempo de resposta < 1000ms': (r) => r.timings.duration < 1000,
      'tempo de resposta < 500ms': (r) => r.timings.duration < 500,
      'TTFB (waiting) < 500ms': (r) => r.timings.waiting < 500,
      'DNS lookup < 100ms': (r) => r.timings.dns_lookup < 100,
      'TLS handshake < 200ms': (r) => r.timings.tls_handshaking < 200,
    });
    sleep(0.5);
  });

  group('Checks de Erros Esperados', () => {
    // POST sem body válido retorna 201 no JSONPlaceholder (mock), testar com recurso inexistente
    const res404 = http.get('https://jsonplaceholder.typicode.com/posts/0');
    check(res404, {
      'recurso inexistente - resposta recebida': (r) => r.status !== 0,
    });
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'reports/checks-test-report.html': htmlReport(data, { title: 'Checks Test' }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'reports/checks-test-summary.json': JSON.stringify(data, null, 2),
  };
}
