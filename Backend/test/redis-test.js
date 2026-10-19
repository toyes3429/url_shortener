
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '30s',
};

const SHORT_URL = 'http://localhost:3000/google';

export default function () {
  const response = http.get(SHORT_URL, {
    redirects: 0,
    tags: { endpoint: 'short-url-redirect' },
  });

  check(response, {
    'redirect status received': (r) =>
      r.status >= 300 && r.status < 400,
    'location header exists': (r) =>
      Boolean(r.headers.Location),
  });

  sleep(1);
}
