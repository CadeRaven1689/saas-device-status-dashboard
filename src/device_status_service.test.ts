import { publishDeviceStatus } from "./device_status_service.ts";

const calls: Array<{ kind: string; payload: unknown }> = [];
const fakeClient = {
  publish: async (_channel: string, _event: string, payload: unknown) => { calls.push({ kind: "publish", payload }); },
  report: async (name: string, value: number, type: string) => { calls.push({ kind: "report", payload: { name, value, type } }); }
};

const result = await publishDeviceStatus({ tenantId: "t1", deviceId: "d1", accountId: "a1", online: true, batteryPct: 50 }, fakeClient as never);
if (result.state !== "healthy" || calls[0]?.kind !== "publish") throw new Error("online, charged devices should publish healthy state");
if (JSON.stringify(calls[1]) !== JSON.stringify({ kind: "report", payload: { name: "device_status_events", value: 1, type: "counter" } })) throw new Error("metrics report must use the required name, value, and type fields");
console.log("device decision test passed");
