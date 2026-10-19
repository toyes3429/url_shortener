
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '30s',
};

const BASE_URL = 'https://url-shortener-7806.onrender.com';

export default function () {
  const response = http.get(`${BASE_URL}/health`);

  check(response, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
