import { group, check, sleep } from 'k6';
import http from 'k6/http';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import { randomInt } from '../../helpers/utils.js';

export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '3m', target: 15 },
    { duration: '1m', target: 0 },
  ],
  tags: { test_type: 'groups_tags_demo', project: 'projeto-completo-k6', team: 'qa-performance' },
  thresholds: {
    'http_req_duration{page:home}': ['p(95)<700'],
    'http_req_duration{page:post_detail}': ['p(95)<600'],
    'http_req_duration{page:user_profile}': ['p(95)<600'],
    'http_req_duration{priority:high}': ['p(95)<500'],
    'http_req_duration{priority:medium}': ['p(95)<800'],
    'http_req_duration{priority:low}': ['p(95)<1500'],
    'group_duration{group:::Página Inicial}': ['p(95)<4000'],
    'group_duration{group:::Página do Post}': ['p(95)<3000'],
    'group_duration{group:::Perfil do Usuário}': ['p(95)<5000'],
    'group_duration{group:::Fluxo de Login}': ['p(95)<2000'],
  },
};

export default function () {
  group('Página Inicial', () => {
    const resPosts = http.get('https://jsonplaceholder.typicode.com/posts', {
      tags: { page: 'home', priority: 'high', component: 'feed' },
    });
    check(resPosts, { '[Home] posts carregados': (r) => r.status === 200 });
    sleep(0.3);

    const resUsers = http.get('https://jsonplaceholder.typicode.com/users', {
      tags: { page: 'home', priority: 'medium', component: 'sidebar' },
    });
    check(resUsers, { '[Home] usuários carregados': (r) => r.status === 200 });
    sleep(0.5);
  });

  group('Página do Post', () => {
    const postId = randomInt(1, 100);

    group('Conteúdo Principal', () => {
      const res = http.get(`https://jsonplaceholder.typicode.com/posts/${postId}`, {
        tags: { page: 'post_detail', priority: 'high', component: 'content' },
      });
      check(res, {
        '[Post] conteúdo carregado': (r) => r.status === 200,
        '[Post] tem título': (r) => {
          try { return JSON.parse(r.body).title !== undefined; } catch (e) { return false; }
        },
      });
      sleep(0.3);
    });

    group('Comentários', () => {
      const res = http.get(`https://jsonplaceholder.typicode.com/posts/${postId}/comments`, {
        tags: { page: 'post_detail', priority: 'medium', component: 'comments' },
      });
      check(res, {
        '[Post] comentários carregados': (r) => r.status === 200,
        '[Post] tem comentários': (r) => {
          try { return JSON.parse(r.body).length > 0; } catch (e) { return false; }
        },
      });
      sleep(0.3);
    });

    group('Dados do Autor', () => {
      const res = http.get(`https://jsonplaceholder.typicode.com/users/${randomInt(1, 10)}`, {
        tags: { page: 'post_detail', priority: 'low', component: 'author_info' },
      });
      check(res, { '[Post] autor carregado': (r) => r.status === 200 });
    });
    sleep(0.5);
  });

  group('Perfil do Usuário', () => {
    const userId = randomInt(1, 10);

    group('Informações Pessoais', () => {
      const res = http.get(`https://jsonplaceholder.typicode.com/users/${userId}`, {
        tags: { page: 'user_profile', priority: 'high', component: 'profile' },
      });
      check(res, {
        '[Perfil] dados carregados': (r) => r.status === 200,
        '[Perfil] tem endereço': (r) => {
          try { return JSON.parse(r.body).address !== undefined; } catch (e) { return false; }
        },
      });
      sleep(0.3);
    });

    group('Posts do Usuário', () => {
      const res = http.get(`https://jsonplaceholder.typicode.com/users/${userId}/posts`, {
        tags: { page: 'user_profile', priority: 'medium', component: 'user_posts' },
      });
      check(res, { '[Perfil] posts carregados': (r) => r.status === 200 });
      sleep(0.3);
    });

    group('Albums do Usuário', () => {
      const res = http.get(`https://jsonplaceholder.typicode.com/users/${userId}/albums`, {
        tags: { page: 'user_profile', priority: 'low', component: 'user_albums' },
      });
      check(res, { '[Perfil] albums carregados': (r) => r.status === 200 });
      sleep(0.3);
    });

    group('Todos do Usuário', () => {
      const res = http.get(`https://jsonplaceholder.typicode.com/users/${userId}/todos`, {
        tags: { page: 'user_profile', priority: 'low', component: 'user_todos' },
      });
      check(res, { '[Perfil] todos carregados': (r) => r.status === 200 });
    });
  });

  group('Fluxo de Login', () => {
    const payload = JSON.stringify({ title: 'Login', body: 'auth', userId: 1 });
    const res = http.post('https://jsonplaceholder.typicode.com/posts', payload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { page: 'login', priority: 'high', component: 'auth', flow: 'authentication' },
    });
    check(res, {
      '[Login] autenticação OK': (r) => r.status === 201,
      '[Login] retorna id': (r) => {
        try { return JSON.parse(r.body).id !== undefined; } catch (e) { return false; }
      },
    });
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'reports/groups-tags-test-report.html': htmlReport(data, { title: 'Groups & Tags Test' }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'reports/groups-tags-test-summary.json': JSON.stringify(data, null, 2),
  };
}
