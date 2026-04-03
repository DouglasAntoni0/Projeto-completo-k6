import { Counter, Gauge, Rate, Trend } from 'k6/metrics';

// Counters
export const successfulRequests = new Counter('custom_successful_requests');
export const failedRequests = new Counter('custom_failed_requests');
export const timeoutErrors = new Counter('custom_timeout_errors');
export const crudOperations = new Counter('custom_crud_operations');
export const dataTransferred = new Counter('custom_data_transferred_bytes');

// Gauges
export const responseSizeGauge = new Gauge('custom_response_size_bytes');
export const activeVUsGauge = new Gauge('custom_active_vus');
export const lastLatencyGauge = new Gauge('custom_last_latency_ms');

// Rates
export const successRate = new Rate('custom_success_rate');
export const failureRate = new Rate('custom_failure_rate');
export const slaComplianceRate = new Rate('custom_sla_compliance_rate');
export const validContentRate = new Rate('custom_valid_content_rate');

// Trends
export const readResponseTime = new Trend('custom_read_response_time', true);
export const writeResponseTime = new Trend('custom_write_response_time', true);
export const deleteResponseTime = new Trend('custom_delete_response_time', true);
export const waitingTimeTrend = new Trend('custom_waiting_time', true);
export const businessTransactionTime = new Trend('custom_business_transaction_time', true);

export function trackResponse(response, operationType = 'read') {
  const isSuccess = response.status >= 200 && response.status < 400;
  const duration = response.timings.duration;

  if (isSuccess) { successfulRequests.add(1); } else { failedRequests.add(1); }
  if (response.body) { dataTransferred.add(response.body.length); }

  if (response.body) { responseSizeGauge.add(response.body.length); }
  lastLatencyGauge.add(duration);

  successRate.add(isSuccess);
  failureRate.add(!isSuccess);
  slaComplianceRate.add(duration < 500);
  validContentRate.add(response.body && response.body.length > 0);

  switch (operationType) {
    case 'read': readResponseTime.add(duration); break;
    case 'write': writeResponseTime.add(duration); break;
    case 'delete': deleteResponseTime.add(duration); break;
  }

  waitingTimeTrend.add(response.timings.waiting);
  crudOperations.add(1);
}

export function trackBusinessTransaction(durationMs) {
  businessTransactionTime.add(durationMs);
}

export default {
  successfulRequests, failedRequests, timeoutErrors, crudOperations, dataTransferred,
  responseSizeGauge, activeVUsGauge, lastLatencyGauge,
  successRate, failureRate, slaComplianceRate, validContentRate,
  readResponseTime, writeResponseTime, deleteResponseTime, waitingTimeTrend, businessTransactionTime,
  trackResponse, trackBusinessTransaction,
};
