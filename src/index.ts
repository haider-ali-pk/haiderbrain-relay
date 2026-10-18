import { DurableObject } from "cloudflare:workers";
import { DASHBOARD_HTML } from "./dashboard";

export interface Env {
  RELAY: DurableObjectNamespace<Relay>;
  RELAY_TOKEN: string;
}

type Role = "phone" | "laptop";
type Device = { role: Role; id: string; name: string };

function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  if (x.byteLength !== y.byteLength) return false;
  return crypto.subtle.timingSafeEqual(x, y);
}

function parseDevice(url: URL): Device | null {
  const role = url.searchParams.get("role");
  if (role !== "phone" && role !== "laptop") return null;
  const id = (url.searchParams.get("id") ?? "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  if (!id) return null;
  const rawName = url.searchParams.get("name") ?? "";
  const name = rawName.replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 40) || role;
  return { role, id, name };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response(DASHBOARD_HTML, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      });
    }

    if (url.pathname === "/ws") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected WebSocket", { status: 426 });
      }
      const token = url.searchParams.get("token") ?? "";
      if (!env.RELAY_TOKEN || !safeEqual(token, env.RELAY_TOKEN.trim())) {
        return new Response("Unauthorized", { status: 401 });
      }
      if (!parseDevice(url)) {
        return new Response("Bad device", { status: 400 });
      }
      const stub = env.RELAY.get(env.RELAY.idFromName("main"));
      return stub.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  },
};

export class Relay extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // Keepalive pings are answered without waking the object
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  private phones(exclude?: WebSocket): { id: string; name: string }[] {
    return this.ctx
      .getWebSockets("phone")
      .filter((s) => s !== exclude && s.readyState === 1)
      .map((s) => s.deserializeAttachment() as Device)
      .filter((a) => a && a.id)
      .map((a) => ({ id: a.id, name: a.name }));
  }

  private broadcastDevices(exclude?: WebSocket) {
    const msg = JSON.stringify({ type: "devices", phones: this.phones(exclude) });
    for (const s of this.ctx.getWebSockets("laptop")) {
      if (s === exclude || s.readyState !== 1) continue;
      try {
        s.send(msg);
      } catch {}
    }
  }

  private targets(role: Role, id: string): WebSocket[] {
    return this.ctx
      .getWebSockets(`id:${id}`)
      .filter((s) => s.readyState === 1 && this.ctx.getTags(s).includes(role));
  }

  async fetch(request: Request): Promise<Response> {
    const dev = parseDevice(new URL(request.url));
    if (!dev) return new Response("Bad device", { status: 400 });

    // A reconnect from the same device replaces its older connection
    for (const old of this.ctx.getWebSockets(`id:${dev.id}`)) {
      try {
        old.close(1000, "replaced");
      } catch {}
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server, [dev.role, `id:${dev.id}`]);
    server.serializeAttachment(dev);

    if (dev.role === "laptop") {
      server.send(JSON.stringify({ type: "devices", phones: this.phones() }));
    } else {
      this.broadcastDevices();
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== "string") return;
    const me = ws.deserializeAttachment() as Device | null;
    if (!me) return;

    let obj: Record<string, unknown>;
    try {
      obj = JSON.parse(message);
    } catch {
      return;
    }
    obj.from = me.id;
    const out = JSON.stringify(obj);

    if (me.role === "laptop") {
      const to = String(obj.to ?? "");
      const targets = to ? this.targets("phone", to) : [];
      if (targets.length === 0) {
        try {
          ws.send(JSON.stringify({ type: "error", error: "phone_offline", to }));
        } catch {}
        return;
      }
      for (const t of targets) {
        try {
          t.send(out);
        } catch {}
      }
    } else {
      const to = String(obj.to ?? "");
      const targets = to
        ? this.targets("laptop", to)
        : this.ctx.getWebSockets("laptop").filter((s) => s.readyState === 1);
      for (const t of targets) {
        try {
          t.send(out);
        } catch {}
      }
    }
  }

  private afterGone(ws: WebSocket) {
    const me = ws.deserializeAttachment() as Device | null;
    if (me?.role === "phone") this.broadcastDevices(ws);
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string) {
    try {
      ws.close(code >= 1000 && code < 5000 && code !== 1005 && code !== 1006 ? code : 1000, reason);
    } catch {}
    this.afterGone(ws);
  }

  async webSocketError(ws: WebSocket) {
    this.afterGone(ws);
  }
}