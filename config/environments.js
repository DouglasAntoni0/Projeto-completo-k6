// Selecione o ambiente: k6 run -e ENV=staging tests/types/load-test.js

const environments = {
  dev: {
    BASE_URL: 'https://jsonplaceholder.typicode.com',
    SITE_URL: 'https://test.k6.io',
    TIMEOUT: '30s',
    THINK_TIME_MIN: 1,
    THINK_TIME_MAX: 3,
  },
  staging: {
    BASE_URL: 'https://jsonplaceholder.typicode.com',
    SITE_URL: 'https://test.k6.io',
    TIMEOUT: '20s',
    THINK_TIME_MIN: 1,
    THINK_TIME_MAX: 5,
  },
  prod: {
    BASE_URL: 'https://jsonplaceholder.typicode.com',
    SITE_URL: 'https://test.k6.io',
    TIMEOUT: '10s',
    THINK_TIME_MIN: 2,
    THINK_TIME_MAX: 5,
  },
};

export function getEnvironment() {
  const envName = __ENV.ENV || 'dev';
  const env = environments[envName];

  if (!env) {
    throw new Error(
      `Ambiente "${envName}" não encontrado. Disponíveis: ${Object.keys(environments).join(', ')}`
    );
  }

  return env;
}

export function getBaseUrls() {
  const env = getEnvironment();
  return {
    baseUrl: env.BASE_URL,
    siteUrl: env.SITE_URL,
  };
}

export default environments;
