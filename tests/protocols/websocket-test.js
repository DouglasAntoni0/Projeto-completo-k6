import { check, sleep } from 'k6';
import ws from 'k6/ws';
import { Counter, Trend, Rate } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import { randomString, randomInt } from '../../helpers/utils.js';

const wsConnectionTime = new Trend('ws_custom_connection_time', true);
const wsMessageRoundTrip = new Trend('ws_custom_message_roundtrip', true);
const wsMessagesSent = new Counter('ws_custom_messages_sent');
const wsMessagesReceived = new Counter('ws_custom_messages_received');
const wsConnectionSuccess = new Rate('ws_custom_connection_success');
const wsEchoSuccess = new Rate('ws_custom_echo_success');

export const options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '2m', target: 10 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    ws_custom_connection_time: ['p(95)<2000'],
    ws_custom_message_roundtrip: ['p(95)<1000'],
    ws_custom_connection_success: ['rate>0.80'],
    ws_custom_echo_success: ['rate>0.80'],
    checks: ['rate>0.70'],
  },
  tags: { test_type: 'websocket' },
};

export default function () {
  const url = 'wss://ws.postman-echo.com/raw';
  const connectionStart = Date.now();

  const res = ws.connect(url, { tags: { protocol: 'websocket' } }, function (socket) {
    let messagesReceived = 0;
    const messagesToSend = randomInt(3, 5);

    socket.on('open', function () {
      wsConnectionTime.add(Date.now() - connectionStart);

      for (let i = 0; i < messagesToSend; i++) {
        socket.send(JSON.stringify({
          type: 'test_message',
          id: i + 1,
          timestamp: Date.now(),
          data: `Mensagem #${i + 1} - ${randomString(20)}`,
          vuId: __VU,
          iteration: __ITER,
        }));
        wsMessagesSent.add(1);
      }
    });

    socket.on('message', function (data) {
      const receiveTime = Date.now();
      messagesReceived++;
      wsMessagesReceived.add(1);

      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'test_message') {
          wsMessageRoundTrip.add(receiveTime - parsed.timestamp);
          wsEchoSuccess.add(true);
        }
      } catch (e) {
        wsEchoSuccess.add(true);
      }

      if (messagesReceived >= messagesToSend) {
        socket.close();
      }
    });

    socket.on('close', function () {});

    socket.on('error', function (e) {
      if (e.error() !== 'websocket: close sent') {
        wsEchoSuccess.add(false);
      }
    });

    socket.setTimeout(function () {
      socket.close();
    }, 10000);
  });

  wsConnectionSuccess.add(res && res.status === 101);
  check(res, { 'WebSocket status 101': (r) => r && r.status === 101 });
  sleep(1);
}

export function handleSummary(data) {
  return {
    'reports/websocket-test-report.html': htmlReport(data, { title: 'WebSocket Test' }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'reports/websocket-test-summary.json': JSON.stringify(data, null, 2),
  };
}
