import http from "k6/http";
import { sleep } from "k6";

import { randomString } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

function getRandomUserInfo() {
  const first_name = randomString(8);
  const last_name = randomString(8);
  const username = `${first_name}.${last_name}`;
  const me = {
    username,
    first_name,
    last_name,
    email: `${username}@domain.com`,
    password: randomString(12),
  };
  return me;
}

// Run test-api.k6.io locally for better reliability: https://github.com/grafana/test-api.k6.io
const BASE_URL = "http://localhost:8000";

export default function () {
  const me = getRandomUserInfo();

  http.post(`${BASE_URL}/user/register/`, me);
  sleep(1);

  http.post(`${BASE_URL}/auth/cookie/login/`, {
    username: me.username,
    password: me.password,
  });
  sleep(1);

  http.post(`${BASE_URL}/my/crocodiles/`, {
    name: "Cyril",
    sex: "M",
    date_of_birth: "2021-09-26",
  });
  sleep(1);

  http.get(`${BASE_URL}/my/crocodiles/`);
  sleep(1);
}
