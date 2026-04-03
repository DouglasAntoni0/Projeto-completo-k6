import { group, check, sleep } from 'k6';
import http from 'k6/http';
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

const users = new SharedArray('users-json', function () {
  return JSON.parse(open('../../data/users.json')).users;
});

const loginCredentials = new SharedArray('login-credentials', function () {
  return JSON.parse(open('../../data/users.json')).loginCredentials;
});

const postsCSV = new SharedArray('posts-csv', function () {
  return papaparse.parse(open('../../data/posts.csv'), { header: true, skipEmptyLines: true }).data;
});

const inlineData = new SharedArray('inline-data', function () {
  return [
    { endpoint: '/posts', method: 'GET', expected: 200 },
    { endpoint: '/users', method: 'GET', expected: 200 },
    { endpoint: '/comments', method: 'GET', expected: 200 },
    { endpoint: '/albums', method: 'GET', expected: 200 },
    { endpoint: '/todos', method: 'GET', expected: 200 },
    { endpoint: '/photos', method: 'GET', expected: 200 },
  ];
});

export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '3m', target: 15 },
    { duration: '1m', target: 0 },
  ],
  thresholds: { http_req_duration: ['p(95)<1000'], http_req_failed: ['rate<0.05'], checks: ['rate>0.90'] },
  tags: { test_type: 'data_parameterization' },
};

export default function () {
  const BASE_URL = 'https://jsonplaceholder.typicode.com';

  group('JSON - Seleção Aleatória', () => {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const payload = JSON.stringify({
      title: `Post de ${randomUser.username}`,
      body: `Post criado pelo usuário ${randomUser.email} com papel ${randomUser.role}`,
      userId: randomUser.id,
    });

    const res = http.post(`${BASE_URL}/posts`, payload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { data_source: 'json_random', user_role: randomUser.role },
    });
    check(res, {
      '[JSON Random] status 201': (r) => r.status === 201,
      '[JSON Random] userId correto': (r) => {
        try { return JSON.parse(r.body).userId === randomUser.id; } catch (e) { return false; }
      },
    });
    sleep(0.3);
  });

  group('JSON - Seleção Sequencial', () => {
    const index = (__VU - 1) % users.length;
    const user = users[index];

    const res = http.get(`${BASE_URL}/users/${(user.id % 10) + 1}`, {
      tags: { data_source: 'json_sequential' },
    });
    check(res, { '[JSON Seq] status 200': (r) => r.status === 200 });
    sleep(0.3);
  });

  group('CSV - Dados de Posts', () => {
    const csvPost = postsCSV[Math.floor(Math.random() * postsCSV.length)];
    const payload = JSON.stringify({
      title: csvPost.title,
      body: csvPost.body,
      userId: parseInt(csvPost.userId) || 1,
    });

    const res = http.post(`${BASE_URL}/posts`, payload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { data_source: 'csv' },
    });
    check(res, {
      '[CSV] status 201': (r) => r.status === 201,
      '[CSV] título correto': (r) => {
        try { return JSON.parse(r.body).title === csvPost.title; } catch (e) { return false; }
      },
    });
    sleep(0.3);
  });

  group('CSV - Iteração Sequencial', () => {
    const csvPost = postsCSV[__ITER % postsCSV.length];
    const res = http.get(`${BASE_URL}/posts/${parseInt(csvPost.id) || 1}`, {
      tags: { data_source: 'csv_sequential' },
    });
    check(res, { '[CSV Seq] status 200': (r) => r.status === 200 });
    sleep(0.3);
  });

  group('Inline - Endpoints Dinâmicos', () => {
    const endpointData = inlineData[Math.floor(Math.random() * inlineData.length)];
    const res = http.get(`${BASE_URL}${endpointData.endpoint}`, {
      tags: { data_source: 'inline', endpoint: endpointData.endpoint },
    });
    check(res, {
      [`[Inline] ${endpointData.endpoint} → ${endpointData.expected}`]: (r) => r.status === endpointData.expected,
    });
    sleep(0.3);
  });

  group('Login Parametrizado', () => {
    const creds = loginCredentials[Math.floor(Math.random() * loginCredentials.length)];
    const payload = JSON.stringify({ title: 'Login', body: JSON.stringify(creds), userId: 1 });

    const res = http.post(`${BASE_URL}/posts`, payload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { data_source: 'json_credentials' },
    });
    check(res, {
      '[Login Param] status 201': (r) => r.status === 201,
      '[Login Param] retorna id': (r) => {
        try { return JSON.parse(r.body).id !== undefined; } catch (e) { return false; }
      },
    });
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'reports/data-parameterization-report.html': htmlReport(data, { title: 'Data Parameterization Test' }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'reports/data-parameterization-summary.json': JSON.stringify(data, null, 2),
  };
}
