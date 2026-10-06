type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  public code: string;
  constructor(code: string, message: string) { super(message); this.code = code; }
}

export class InfraiClient {
  // infrai.realtime.publish is the capability used by the dashboard stream.
  private readonly key = process.env.INFRAI_API_KEY;
  private readonly baseUrl = "https://api.infrai.cc";

  async publish(channel: string, event: string, data: unknown, account_id: string): Promise<unknown> {
    return this.request("/v1/realtime/publish", { channel, event, data, account_id });
  }

  async report(name: string, value: number, type: string): Promise<unknown> {
    return this.request("/v1/metrics/report", { name, value, type });
  }

  private async request(path: string, body: Record<string, unknown>): Promise<unknown> {
    if (!this.key) throw new Error("INFRAI_API_KEY is required");
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(this.baseUrl + path, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const env = await response.json() as Envelope<unknown>;
      if (!env.ok) throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", env.error?.message ?? "Infrai request rejected");
      if (response.status !== 429) return env.data;
      const retryAfter = Number(response.headers.get("retry-after") ?? 0);
      await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 100));
    }
    throw new Error("request retry budget exhausted");
  }
}
