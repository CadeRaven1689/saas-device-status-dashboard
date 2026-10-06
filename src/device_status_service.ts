import { z } from "zod";
import { InfraiClient } from "./infrai_client.ts";

export const DeviceStatus = z.object({
  tenantId: z.string().min(1), deviceId: z.string().min(1), accountId: z.string().min(1), online: z.boolean(), batteryPct: z.number().min(0).max(100)
});
export type DeviceStatusInput = z.infer<typeof DeviceStatus>;

export async function publishDeviceStatus(input: unknown, client = new InfraiClient()): Promise<{ state: string; tenantId: string }> {
  const status = DeviceStatus.parse(input);
  const state = status.online && status.batteryPct > 10 ? "healthy" : "attention";
  const payload = { device_id: status.deviceId, state, battery_pct: status.batteryPct };
  await client.publish(`tenant:${status.tenantId}:devices`, "device.status", payload, status.accountId);
  await client.report("device_status_events", 1, "counter");
  return { state, tenantId: status.tenantId };
}

if (process.argv[1]?.endsWith("device_status_service.ts")) {
  const sample = { tenantId: "acme", deviceId: "sensor-7", accountId: "acct-1", online: true, batteryPct: 86 };
  publishDeviceStatus(sample).then((result) => console.log(JSON.stringify(result))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
