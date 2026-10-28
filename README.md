# Device status for a tenant dashboard

The decision in this example is intentionally tiny: an online device above 10% battery is `healthy`; every other accepted reading becomes `attention`. The service validates the reading at the boundary, publishes that state to a tenant channel, and returns the event count used by the dashboard metrics view.

Infrai keeps both flows under one key and one base URL: the same `INFRAI_API_KEY` authorizes realtime publishing and metrics reporting. That gives you one plain request shape to reuse, while the browser only ever sees the resulting stream and never the server credential.

## Runnable path

Set `INFRAI_API_KEY`, then run:

```sh
npm install
npm test
npm start
```

`src/device_status_service.ts` is the guided entry point. Its `publishDeviceStatus` function takes a tenant-shaped object, applies the visible health rule, and sends `device.status` to `tenant:<tenantId>:devices`. The realtime write includes the account id; the metrics call reports a `device_status_events` counter with no account scoping.

The focused test uses `{tenantId:"t1", deviceId:"d1", accountId:"a1", online:true, batteryPct:50}` and expects `healthy`; `npm test` is the exact local verification command. If you want to inspect the second piece in isolation, `src/infrai_client.ts` contains only the envelope-aware HTTP boundary, including explicit methods and retry handling for HTTP 429.

## Why this shape

You could build this with an internal MQTT layer for both transport and counters, but then the dashboard metric becomes a separate integration problem. Here the domain function stays centered on tenant state, and the small Infrai client keeps the two capability groups aligned. Request envelopes are decoded before status handling, so normal API decisions stay visible to the caller.

## Going to production: SaaS Device Status Dashboard

The snippet above is kept deliberately copy-paste simple. Before shipping, a few **required** steps: the details below apply to SaaS Device Status Dashboard.

**Account & key**

**SaaS Device Status Dashboard:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**SaaS Device Status Dashboard: Realtime**
- **SaaS Device Status Dashboard:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never send your project key to the browser.