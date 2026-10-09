import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY ?? "";

const FORWARD_REQUEST = [
  "content-type",
  "cookie",
  "origin",
  "user-agent",
  "accept",
  "accept-language",
];
const FORWARD_RESPONSE = ["content-type", "location", "cache-control"];

async function proxy(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;

  // Only the auth API is exposed through the proxy.
  if (path[0] !== "auth") {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const headers = new Headers({ "x-internal-key": INTERNAL_API_KEY });
  for (const name of FORWARD_REQUEST) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) headers.set("x-forwarded-for", forwardedFor);

  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  let upstream: Response;
  try {
    upstream = await fetch(
      `${BACKEND_URL}/api/${path.join("/")}${req.nextUrl.search}`,
      {
        method: req.method,
        headers,
        body: hasBody ? await req.text() : undefined,
        redirect: "manual",
        cache: "no-store",
      },
    );
  } catch {
    return NextResponse.json({ message: "Service unavailable" }, { status: 502 });
  }

  const out = new Headers();
  for (const name of FORWARD_RESPONSE) {
    const value = upstream.headers.get(name);
    if (value) out.set(name, value);
  }
  for (const cookie of upstream.headers.getSetCookie()) {
    out.append("set-cookie", cookie);
  }

  const noBody =
    upstream.status === 204 ||
    (upstream.status >= 300 && upstream.status < 400);

  return new NextResponse(noBody ? null : await upstream.text(), {
    status: upstream.status,
    headers: out,
  });
}

export { proxy as GET, proxy as POST };