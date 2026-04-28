import { createHmac, randomUUID } from "crypto";

export const createHeaders = (token: string, secret: string) => {
  const timestamp = Date.now().toString();
  const nonce = randomUUID();
  const data = token + timestamp + nonce;
  const sign = createHmac("sha256", secret).update(data).digest("base64");

  return {
    Authorization: token,
    sign,
    nonce,
    t: timestamp,
    "Content-Type": "application/json; charset=utf8",
  };
};
