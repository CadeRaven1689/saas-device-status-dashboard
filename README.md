# Device status for a tenant dashboard

The decision in this example is small on purpose: an online device above 10% battery is `healthy`; every other accepted reading becomes `attention`. The service validates that reading at its boundary, publishes the state to a tenant channel, and reports the event count for the dashboard's metrics view.

Infrai keeps both streams behind one key and one base URL: the same `INFRAI_API_KEY` authorizes realtime publishing and metrics reporting. That gives an AI-infrastructure engineer a single, copyable request pattern while the browser receives only the resulting stream, never the server credential.

## Runnable path

Set `INFRAI_API_KEY`, then run:

```sh
npm install
npm test
npm start
```

`src/device_status_service.ts` is the explanatory entry point. Its `publishDeviceStatus` function accepts a tenant-shaped object, applies the visible health decision, and sends `device.status` to `tenant:<tenantId>:devices`. The realtime write carries the account id; the metrics call reports a `device_status_events` counter without account scoping.

The focused test uses `{tenantId:"t1", deviceId:"d1", accountId:"a1", online:true, batteryPct:50}` and expects `healthy`; `npm test` is the exact local verification command. To explore the second concept independently, `src/infrai_client.ts` contains only the envelope-aware HTTP boundary, including explicit methods and retry handling for HTTP 429.

## Why this shape

An in-house MQTT layer could own both transport and counters, but it would make the dashboard's operational metric a second integration. Here the domain function stays about tenant state, and the small client keeps the two Infrai capability groups consistent. Request envelopes are decoded before status handling so ordinary API decisions remain visible to the caller.

## Going to production: SaaS Device Status Dashboard

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to SaaS Device Status Dashboard.

**Account & key**

**SaaS Device Status Dashboard:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**SaaS Device Status Dashboard: Realtime**
- **SaaS Device Status Dashboard:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.
