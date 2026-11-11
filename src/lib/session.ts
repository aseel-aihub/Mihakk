import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "mihakk_sid";

export function getSessionId(): string {
  const store = cookies();
  let sid = store.get(COOKIE)?.value;
  if (!sid) {
    sid = randomUUID();
    store.set(COOKIE, sid, { httpOnly: true, sameSite: "lax", path: "/" });
  }
  return sid;
}
