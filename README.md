<p align="center">
  <img src="https://grafana.com/media/docs/k6/GrafanaLogo_k6_icon.svg" alt="k6 Logo" width="80"/>
</p>

<h1 align="center">Projeto Completo de Performance Testing com k6</h1>

<p align="center">
  <strong>Suíte profissional de testes de performance utilizando <a href="https://k6.io">Grafana k6</a></strong>
</p>

<p align="center">
  <a href="https://k6.io"><img src="https://img.shields.io/badge/k6-v0.54+-7D64FF?style=for-the-badge&logo=k6&logoColor=white" alt="k6"/></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License MIT"/></a>
</p>

---

## Sobre o Projeto

Suíte completa de testes de performance construída com [Grafana k6](https://k6.io), cobrindo todos os tipos de teste e funcionalidades da ferramenta. Serve como referência prática de **Performance Engineering** e **automação de testes**.

### Cobertura

| Categoria | Detalhes |
|-----------|----------|
| **Tipos de Teste** | Smoke, Load, Stress, Spike, Soak, Breakpoint |
| **Executors** | shared-iterations, per-vu-iterations, constant-vus, ramping-vus, constant-arrival-rate, ramping-arrival-rate |
| **Métricas** | Counter, Gauge, Rate, Trend (customizadas) + built-in |
| **Protocolos** | HTTP/REST (CRUD completo), WebSocket |
| **Organização** | Groups hierárquicos, Tags, Thresholds por tag |
| **Dados** | SharedArray com JSON e CSV, papaparse |
| **Lifecycle** | Init, setup(), default(), teardown(), handleSummary() |
| **Validações** | Status, Body, Headers, JSON, Response Time, Arrays |
| **Relatórios** | HTML (k6-reporter), JSON, Console |
| **CI/CD** | GitHub Actions |

### APIs Utilizadas

| API | URL | Uso |
|-----|-----|-----|
| **JSONPlaceholder** | `jsonplaceholder.typicode.com` | CRUD de posts, users, comments, albums, todos |
| **test.k6.io** | `test.k6.io` | Website estático para navegação |
| **Postman Echo WS** | `ws.postman-echo.com` | WebSocket |

---

## Tipos de Teste

```
VUs
│
│   SMOKE          LOAD           STRESS         SPIKE          SOAK           BREAKPOINT
│   ───            ┌──┐           ┌──┐           │▲│            ┌────────┐     /
│                  │  │        ┌──┤  │           │││            │        │    /
│   ┌─┐         ┌─┤  │     ┌──┤  │  │        ┌──┤││──┐         │        │   /
│   │ │      ┌──┤  │  │  ┌──┤  │  │  │        │  │││  │      ┌──┤        │──/
│   │ │   ┌──┤  │  │  └──┤  │  │  └──│     ┌──┤  │││  └──┐┌──┤  │        └──
│───┘ └───┘  └──┘  └─────┘  └──┘     └─────┘  └──┘└┘     └┘  └──┘
└──────────────────────────────────────────────────────────────────────────── Tempo
   1-3 VUs     50→100 VUs    50→400 VUs    5→500 VUs     50-80 VUs      10→1000+
   2 min        20 min        25 min        15 min        60 min         Até falha
```

| Tipo | Arquivo | VUs | Duração | Objetivo |
|------|---------|-----|---------|----------|
| **Smoke** | `tests/types/smoke-test.js` | 3 | 2 min | Validar funcionalidade básica sob carga mínima |
| **Load** | `tests/types/load-test.js` | 50→100 | 20 min | Avaliar performance sob tráfego normal |
| **Stress** | `tests/types/stress-test.js` | 50→400 | 25 min | Encontrar ponto de degradação |
| **Spike** | `tests/types/spike-test.js` | 5→500 | 15 min | Testar sobrevivência a picos repentinos |
| **Soak** | `tests/types/soak-test.js` | 50-80 | 60 min | Detectar memory leaks e degradação temporal |
| **Breakpoint** | `tests/types/breakpoint-test.js` | 10→1000+ | Até falha | Identificar limite de capacidade |

---

## Features

### Testes de Features

| Feature | Arquivo | Demonstra |
|---------|---------|-----------|
| **Scenarios** | `tests/features/scenarios-test.js` | Todos os 6 executors rodando simultaneamente |
| **Thresholds** | `tests/features/thresholds-test.js` | Thresholds globais, por tag, com abortOnFail |
| **Custom Metrics** | `tests/features/custom-metrics-test.js` | Counter, Gauge, Rate, Trend customizados |
| **Groups & Tags** | `tests/features/groups-tags-test.js` | Organização hierárquica e filtragem |
| **Checks** | `tests/features/checks-test.js` | Validações de status, body, headers, JSON, timing |
| **Data Param.** | `tests/features/data-parameterization.js` | SharedArray com JSON, CSV e dados inline |
| **Lifecycle** | `tests/features/lifecycle-test.js` | Init, setup, default, teardown, handleSummary |

### Testes de Protocolo

| Protocolo | Arquivo | Testa |
|-----------|---------|-------|
| **REST API** | `tests/protocols/rest-api-test.js` | CRUD completo + Batch + Filtros |
| **WebSocket** | `tests/protocols/websocket-test.js` | Conexão, mensagens, echo, timeout |

### Testes Avançados

| Teste | Arquivo | Demonstra |
|-------|---------|-----------|
| **Multi-Scenario** | `tests/advanced/multi-scenario-test.js` | 4 perfis de usuário simultâneos |
| **Hybrid** | `tests/advanced/hybrid-test.js` | Combina todas as técnicas |

---

## Como Executar

### Pré-requisitos

1. **Instalar o k6:**

```bash
# Windows (Chocolatey)
choco install k6

# Windows (winget)
winget install grafana.k6

# macOS (Homebrew)
brew install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Docker
docker pull grafana/k6
```

2. **Clonar o repositório:**

```bash
git clone https://github.com/seu-usuario/Projeto-completo-k6.git
cd Projeto-completo-k6
```

3. **(Opcional) Instalar dependências NPM para IntelliSense:**

```bash
npm install
```

### Executar Testes

#### Por Tipo

```bash
# Smoke Test (execute primeiro)
npm run smoke

# Load Test
npm run load

# Stress Test
npm run stress

# Spike Test
npm run spike

# Soak Test (longa duração)
npm run soak

# Breakpoint Test (alta carga)
npm run breakpoint
```

#### Por Feature

```bash
npm run scenarios       # Todos os 6 Executors
npm run thresholds      # Thresholds Avançados
npm run custom-metrics  # Métricas Customizadas
npm run groups-tags     # Groups e Tags
npm run checks          # Validações
npm run data-param      # Parametrização de Dados
npm run lifecycle       # Ciclo de Vida
```

#### Protocolos e Avançado

```bash
npm run rest-api        # REST API completa
npm run websocket       # WebSocket
npm run multi-scenario  # 4 perfis simultâneos
npm run hybrid          # Todas as técnicas combinadas
```

#### Opções Avançadas

```bash
# Especificar ambiente
k6 run -e ENV=staging tests/types/load-test.js

# Saída JSON detalhada
k6 run --out json=reports/results.json tests/types/smoke-test.js

# Web Dashboard em tempo real
K6_WEB_DASHBOARD=true k6 run tests/types/load-test.js

# Override de VUs
k6 run --vus 10 --duration 30s tests/types/smoke-test.js
```

---

## Arquitetura

```
Projeto-completo-k6/
│
├── .github/workflows/
│   └── k6-tests.yml
│
├── config/
│   ├── environments.js          # URLs e settings por ambiente
│   ├── thresholds.js            # SLOs e critérios de aprovação
│   └── scenarios.js             # Cenários reutilizáveis
│
├── data/
│   ├── users.json               # 25 usuários + credenciais
│   └── posts.csv                # 20 posts em CSV
│
├── helpers/
│   ├── checks.js                # Validações reutilizáveis
│   ├── custom-metrics.js        # Counter, Gauge, Rate, Trend
│   ├── request.js               # Wrapper HTTP
│   └── utils.js                 # Geradores e think time
│
├── modules/
│   ├── auth-api.js              # Login e registro
│   ├── posts-api.js             # CRUD de posts
│   ├── users-api.js             # Operações de usuário
│   └── comments-api.js          # Comentários com filtros
│
├── tests/
│   ├── types/                   # 6 tipos de teste
│   ├── features/                # Demonstração de features k6
│   ├── protocols/               # REST API e WebSocket
│   └── advanced/                # Multi-scenario e Hybrid
│
├── reports/                     # Relatórios HTML gerados
├── package.json
└── README.md
```

---

## CI/CD

Pipeline de **GitHub Actions** configurado:

| Evento | Teste Executado |
|--------|----------------|
| **Pull Request** | Smoke Test |
| **Push para main** | Smoke + Load + Features |
| **Manual (workflow_dispatch)** | Qualquer (escolha via dropdown) |

### Executar manualmente

1. Acesse **Actions** no repositório
2. Selecione **Performance Tests - k6**
3. Clique em **Run workflow**
4. Escolha o tipo de teste e execute

Os relatórios HTML ficam disponíveis como **Artifacts** por 30 dias.

---

## Métricas

### Built-in do k6

| Métrica | Tipo | Descrição |
|---------|------|-----------|
| `http_req_duration` | Trend | Tempo total da requisição |
| `http_req_failed` | Rate | Taxa de requisições com erro |
| `http_reqs` | Counter | Total de requisições |
| `http_req_waiting` | Trend | TTFB |
| `checks` | Rate | Taxa de checks aprovados |
| `vus` | Gauge | VUs ativos |
| `iterations` | Counter | Total de iterações |

### Customizadas

| Métrica | Tipo | Descrição |
|---------|------|-----------|
| `custom_successful_requests` | Counter | Requisições com sucesso |
| `custom_failed_requests` | Counter | Requisições com falha |
| `custom_response_size_bytes` | Gauge | Tamanho da resposta |
| `custom_success_rate` | Rate | Taxa de sucesso |
| `custom_sla_compliance_rate` | Rate | Conformidade com SLA |
| `custom_read_response_time` | Trend | Tempo de resposta (GET) |
| `custom_write_response_time` | Trend | Tempo de resposta (POST/PUT) |
| `custom_business_transaction_time` | Trend | Tempo da transação E2E |

---

## Tecnologias

| Ferramenta | Uso |
|------------|-----|
| [Grafana k6](https://k6.io) | Engine de testes de performance |
| [k6-reporter](https://github.com/benc-uk/k6-reporter) | Relatórios HTML |
| [papaparse](https://www.papaparse.com/) | Parse de CSV |
| [GitHub Actions](https://github.com/features/actions) | CI/CD |

---

## Executors

| Executor | Controla | Ideal Para |
|----------|----------|------------|
| `shared-iterations` | Iterações totais | Processamento em lote |
| `per-vu-iterations` | Iterações por VU | Cargas fixas |
| `constant-vus` | VUs constantes | Baseline |
| `ramping-vus` | VUs variáveis | Tráfego realista |
| `constant-arrival-rate` | RPS fixo | Throughput testing |
| `ramping-arrival-rate` | RPS variável | Breakpoint testing |

---

## Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'feat: adiciona nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

---

## Licença

Licenciado sob a [Licença MIT](https://opensource.org/licenses/MIT).

---

<p align="center">
  <a href="https://k6.io/docs/">Documentação k6</a> •
  <a href="https://community.grafana.com/c/grafana-k6/">Comunidade k6</a> •
  <a href="https://github.com/grafana/k6">k6 no GitHub</a>
</p>
