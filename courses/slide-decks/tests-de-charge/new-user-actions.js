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

export const REQUEST_GROUPS = {
  register: "01 – ✍️ Register",
  login: "02 – 👋 Login",
  createCrocodile: "03 – 🐊 Create crocodile",
  getMyCrocodiles: "04 – 📋 Get my crocodiles",
};

export const options = {
  thresholds: {
    [`http_req_duration{group: ${REQUEST_GROUPS.register}}`]: ["p(95) < 5000"],
    [`http_req_duration{group: ${REQUEST_GROUPS.login}}`]: ["p(95) < 5000"],
    [`http_req_duration{group: ${REQUEST_GROUPS.createCrocodile}}`]: [
      "p(95) < 1000",
    ],
    [`http_req_duration{group: ${REQUEST_GROUPS.getMyCrocodiles}}`]: [
      "p(95) < 10",
    ],

    ["http_req_failed"]: ["rate<0.1"],
    [`http_req_failed{group: ${REQUEST_GROUPS.register}}`]: [],
    [`http_req_failed{group: ${REQUEST_GROUPS.login}}`]: [],
    [`http_req_failed{group: ${REQUEST_GROUPS.createCrocodile}}`]: [],
    [`http_req_failed{group: ${REQUEST_GROUPS.getMyCrocodiles}}`]: [],
  },
};

// Run test-api.k6.io locally for better reliability: https://github.com/grafana/test-api.k6.io
const BASE_URL = "http://localhost:8000";

export default function () {
  const me = getRandomUserInfo();

  http.post(`${BASE_URL}/user/register/`, me, {
    tags: { group: REQUEST_GROUPS.register },
  });
  sleep(1);

  http.post(
    `${BASE_URL}/auth/cookie/login/`,
    {
      username: me.username,
      password: me.password,
    },
    {
      tags: { group: REQUEST_GROUPS.login },
    }
  );
  sleep(1);

  http.post(
    `${BASE_URL}/my/crocodiles/`,
    {
      name: "Cyril",
      sex: "M",
      date_of_birth: "2021-09-26",
    },
    {
      tags: { group: REQUEST_GROUPS.createCrocodile },
    }
  );
  sleep(1);

  http.get(`${BASE_URL}/my/crocodiles/`, {
    tags: { group: REQUEST_GROUPS.getMyCrocodiles },
  });
  sleep(1);
}
