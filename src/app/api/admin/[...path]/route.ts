import { NextResponse, type NextRequest } from "next/server";
import { API_BASE, withAdminToken } from "@/lib/auth/server-session";

/**
 * Same-origin proxy: /api/admin/<path> → {API}/api/v1/admin/<path>.
 * Attaches the admin Bearer token from the httpOnly cookie, refreshes once on
 * 401, and streams the backend response (JSON envelopes and CSV exports) back
 * unchanged. Authorization stays entirely on the backend.
 */

type Params = { params: Promise<{ path: string[] }> };

// content-length / content-encoding are deliberately NOT forwarded: fetch() transparently
// decompresses gzip/br bodies, so the upstream (compressed) length would truncate the JSON.
const FORWARDED_RESPONSE_HEADERS = ["content-type", "content-disposition"];

async function proxy(req: NextRequest, { params }: Params) {
  const { path } = await params;
  // Role isolation: never let a crafted segment ("..", "%2e%2e") climb out of /api/v1/admin.
  if (path.some((segment) => segment === "" || segment === "." || segment === ".." || /[\\/]/.test(segment))) {
    return NextResponse.json({ success: false, statusCode: 400, message: "Invalid admin API path." }, { status: 400 });
  }
  const target = `${API_BASE}/api/v1/admin/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`;
  const hasBody = !["GET", "HEAD"].includes(req.method);
  const body = hasBody ? await req.text() : undefined;

  const forwardedFor = req.headers.get("x-forwarded-for");
  const userAgent = req.headers.get("user-agent");

  let res: Response | null;
  try {
    res = await withAdminToken((token) =>
      fetch(target, {
        method: req.method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(hasBody ? { "Content-Type": req.headers.get("content-type") || "application/json" } : {}),
          ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
          ...(userAgent ? { "User-Agent": userAgent } : {}),
        },
        body: body || undefined,
        cache: "no-store",
      }),
    );
  } catch {
    return NextResponse.json(
      { success: false, statusCode: 502, message: `Cannot reach the SynQ API at ${API_BASE}.` },
      { status: 502 },
    );
  }

  if (!res) {
    return NextResponse.json(
      { success: false, statusCode: 401, message: "Your session expired. Please sign in again." },
      { status: 401 },
    );
  }

  const headers = new Headers({ "Cache-Control": "no-store" });
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = res.headers.get(name);
    if (value) headers.set(name, value);
  }
  const bodyless = res.status === 204 || res.status === 304;
  return new NextResponse(bodyless ? null : res.body, { status: res.status, headers });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
