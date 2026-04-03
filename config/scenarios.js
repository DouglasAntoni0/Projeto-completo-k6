// Cenários reutilizáveis — todos os 6 executors do k6

export const sharedIterationsScenario = {
  executor: 'shared-iterations',
  vus: 10,
  iterations: 200,
  maxDuration: '5m',
  gracefulStop: '30s',
  tags: { scenario_type: 'shared-iterations' },
};

export const perVuIterationsScenario = {
  executor: 'per-vu-iterations',
  vus: 10,
  iterations: 20,
  maxDuration: '5m',
  gracefulStop: '30s',
  tags: { scenario_type: 'per-vu-iterations' },
};

export const constantVusScenario = {
  executor: 'constant-vus',
  vus: 50,
  duration: '10m',
  gracefulStop: '30s',
  tags: { scenario_type: 'constant-vus' },
};

export const rampingVusScenario = {
  executor: 'ramping-vus',
  startVUs: 0,
  stages: [
    { duration: '3m', target: 50 },
    { duration: '5m', target: 50 },
    { duration: '3m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '3m', target: 0 },
  ],
  gracefulRampDown: '1m',
  gracefulStop: '30s',
  tags: { scenario_type: 'ramping-vus' },
};

export const constantArrivalRateScenario = {
  executor: 'constant-arrival-rate',
  rate: 30,
  timeUnit: '1s',
  duration: '10m',
  preAllocatedVUs: 50,
  maxVUs: 100,
  gracefulStop: '30s',
  tags: { scenario_type: 'constant-arrival-rate' },
};

export const rampingArrivalRateScenario = {
  executor: 'ramping-arrival-rate',
  startRate: 5,
  timeUnit: '1s',
  preAllocatedVUs: 50,
  maxVUs: 200,
  stages: [
    { duration: '2m', target: 10 },
    { duration: '3m', target: 30 },
    { duration: '3m', target: 50 },
    { duration: '2m', target: 10 },
  ],
  gracefulStop: '30s',
  tags: { scenario_type: 'ramping-arrival-rate' },
};

// Combinação de perfis de usuário simultâneos
export const multiScenarioConfig = {
  leitores_casuais: {
    ...constantVusScenario,
    vus: 20,
    duration: '8m',
    exec: 'browsing',
    tags: { user_type: 'casual', scenario_type: 'constant-vus' },
  },
  criadores_conteudo: {
    ...rampingVusScenario,
    exec: 'creating',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 10 },
      { duration: '4m', target: 10 },
      { duration: '2m', target: 0 },
    ],
    tags: { user_type: 'creator', scenario_type: 'ramping-vus' },
  },
  api_consumers: {
    ...constantArrivalRateScenario,
    rate: 15,
    duration: '8m',
    preAllocatedVUs: 20,
    maxVUs: 50,
    exec: 'apiConsumer',
    tags: { user_type: 'api_consumer', scenario_type: 'constant-arrival-rate' },
  },
};

export default {
  sharedIterationsScenario,
  perVuIterationsScenario,
  constantVusScenario,
  rampingVusScenario,
  constantArrivalRateScenario,
  rampingArrivalRateScenario,
  multiScenarioConfig,
};
