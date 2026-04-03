import { group, check, sleep } from 'k6';
import http from 'k6/http';
import { Counter, Gauge, Rate, Trend } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import { randomInt } from '../../helpers/utils.js';

// Counters
const reqSuccess = new Counter('metric_requests_success');
const reqErrors = new Counter('metric_requests_errors');
const bytesReceived = new Counter('metric_bytes_received');
const readOps = new Counter('metric_read_operations');
const writeOps = new Counter('metric_write_operations');

// Gauges
const lastResponseTime = new Gauge('metric_last_response_time');
const lastResponseSize = new Gauge('metric_last_response_size');
const successfulVUs = new Gauge('metric_successful_vus');

// Rates
const successRate = new Rate('metric_success_rate');
const fastResponses = new Rate('metric_fast_responses');
const validResponses = new Rate('metric_valid_responses');
const slaCompliance = new Rate('metric_sla_compliance');

// Trends
const getResponseTime = new Trend('metric_get_response_time', true);
const postResponseTime = new Trend('metric_post_response_time', true);
const ttfbTrend = new Trend('metric_ttfb', true);
const transactionTime = new Trend('metric_transaction_time', true);
const responseSizeTrend = new Trend('metric_response_size_bytes');

export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '3m', target: 15 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    metric_success_rate: ['rate>0.95'],
    metric_fast_responses: ['rate>0.50'],
    metric_sla_compliance: ['rate>0.90'],
    metric_get_response_time: ['p(95)<800', 'avg<400'],
    metric_post_response_time: ['p(95)<1000'],
    metric_ttfb: ['p(95)<500'],
    metric_transaction_time: ['p(95)<5000'],
    metric_requests_success: ['count>100'],
  },
  tags: { test_type: 'custom_metrics_demo' },
};

export default function () {
  const transactionStart = Date.now();
  let allChecksPass = true;

  group('Métricas de Leitura (GET)', () => {
    const res = http.get(`https://jsonplaceholder.typicode.com/posts/${randomInt(1, 100)}`, {
      tags: { operation: 'read' },
    });

    if (res.status === 200) { reqSuccess.add(1); } else { reqErrors.add(1); }
    if (res.body) { bytesReceived.add(res.body.length); }
    readOps.add(1);

    lastResponseTime.add(res.timings.duration);
    lastResponseSize.add(res.body ? res.body.length : 0);

    successRate.add(res.status === 200);
    fastResponses.add(res.timings.duration < 300);
    slaCompliance.add(res.timings.duration < 500);

    getResponseTime.add(res.timings.duration);
    ttfbTrend.add(res.timings.waiting);
    responseSizeTrend.add(res.body ? res.body.length : 0);

    if (!check(res, {
      'GET - status 200': (r) => r.status === 200,
      'GET - tem body': (r) => r.body && r.body.length > 0,
    })) allChecksPass = false;

    sleep(0.5);
  });

  group('Métricas de Escrita (POST)', () => {
    const payload = JSON.stringify({
      title: `Teste ${Date.now()}`,
      body: 'Demonstração de métricas customizadas.',
      userId: randomInt(1, 10),
    });

    const res = http.post('https://jsonplaceholder.typicode.com/posts', payload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { operation: 'write' },
    });

    if (res.status === 201) { reqSuccess.add(1); } else { reqErrors.add(1); }
    if (res.body) { bytesReceived.add(res.body.length); }
    writeOps.add(1);

    lastResponseTime.add(res.timings.duration);
    lastResponseSize.add(res.body ? res.body.length : 0);
    successRate.add(res.status === 201);
    fastResponses.add(res.timings.duration < 300);
    slaCompliance.add(res.timings.duration < 500);

    postResponseTime.add(res.timings.duration);
    ttfbTrend.add(res.timings.waiting);
    responseSizeTrend.add(res.body ? res.body.length : 0);

    if (!check(res, {
      'POST - status 201': (r) => r.status === 201,
      'POST - retorna id': (r) => {
        try { return JSON.parse(r.body).id !== undefined; } catch (e) { return false; }
      },
    })) allChecksPass = false;

    sleep(0.5);
  });

  group('Métricas de Estado (Gauge)', () => {
    const res = http.get('https://jsonplaceholder.typicode.com/users', {
      tags: { operation: 'read' },
    });

    successfulVUs.add(res.status === 200 ? 1 : 0);
    lastResponseTime.add(res.timings.duration);

    if (!check(res, { 'GAUGE - status 200': (r) => r.status === 200 })) allChecksPass = false;

    readOps.add(1);
    if (res.status === 200) { reqSuccess.add(1); } else { reqErrors.add(1); }
    successRate.add(res.status === 200);
  });

  validResponses.add(allChecksPass);
  transactionTime.add(Date.now() - transactionStart);
  sleep(1);
}

export function handleSummary(data) {
  return {
    'reports/custom-metrics-test-report.html': htmlReport(data, { title: 'Custom Metrics Test' }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'reports/custom-metrics-test-summary.json': JSON.stringify(data, null, 2),
  };
}
