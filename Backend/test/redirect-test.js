
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '30s',
};

const SHORT_URL = 'https://url-shortener-7806.onrender.com/custom';

export default function () {
  const response = http.get(SHORT_URL, {
    redirects: 0,
  });

  check(response, {
    'redirect status received': (r) =>
      r.status >= 300 && r.status < 400,
    'location header exists': (r) =>
      !!r.headers.Location,
  });

  sleep(1);
}
