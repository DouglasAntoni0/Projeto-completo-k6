// Thresholds padrão (SLOs)
export const defaultThresholds = {
  http_req_duration: [
    { threshold: 'p(95)<500', abortOnFail: false },
    { threshold: 'p(99)<1500', abortOnFail: false },
  ],
  http_req_failed: [
    { threshold: 'rate<0.01', abortOnFail: false },
  ],
  checks: ['rate>0.95'],
};

// Smoke — critérios mais leves para validação rápida
export const smokeThresholds = {
  http_req_duration: ['p(95)<800', 'p(99)<1500', 'avg<500'],
  http_req_failed: ['rate<0.05'],
  checks: ['rate>0.95'],
};

// Stress/Spike — aceita degradação controlada
export const stressThresholds = {
  http_req_duration: [
    { threshold: 'p(95)<2000', abortOnFail: false },
    { threshold: 'p(99)<5000', abortOnFail: false },
  ],
  http_req_failed: [
    { threshold: 'rate<0.10', abortOnFail: false },
  ],
  checks: ['rate>0.80'],
};

// Soak — verifica degradação ao longo do tempo
export const soakThresholds = {
  http_req_duration: [
    { threshold: 'p(95)<800', abortOnFail: false },
    { threshold: 'p(99)<2000', abortOnFail: false },
    { threshold: 'avg<400', abortOnFail: false },
  ],
  http_req_failed: [
    { threshold: 'rate<0.02', abortOnFail: false },
  ],
  checks: ['rate>0.95'],
};

// Thresholds por tag — para endpoints específicos
// Uso: thresholds: { ...taggedThresholds.critical }
export const taggedThresholds = {
  critical: {
    'http_req_duration{criticality:critical}': ['p(95)<300'],
    'http_req_failed{criticality:critical}': ['rate<0.001'],
  },
  normal: {
    'http_req_duration{criticality:normal}': ['p(95)<800'],
    'http_req_failed{criticality:normal}': ['rate<0.01'],
  },
  background: {
    'http_req_duration{criticality:background}': ['p(95)<2000'],
    'http_req_failed{criticality:background}': ['rate<0.05'],
  },
};

export default {
  defaultThresholds,
  smokeThresholds,
  stressThresholds,
  soakThresholds,
  taggedThresholds,
};
