# SKIDATA eCom Invoice Endpoint

Render deployment for the SKIDATA Invoice API. Inbound invoices are protected by HTTP Basic Auth, persisted in PostgreSQL, converted to PDF asynchronously, and reported to SKIDATA using a separate Basic-Auth credential pair.

## Authentication

Set these Render secret environment variables:

```text
SKIDATA_BASIC_AUTH_USER
SKIDATA_BASIC_AUTH_PASSWORD
INVOICEREPORT_AUTH_USER
INVOICEREPORT_AUTH_PASSWORD
DATABASE_URL
INVOICEREPORT_BASE_URL
```

Use [render.env.example](render.env.example) as the bulk-import template. Enter the Internal Database URL from Render Postgres for `DATABASE_URL`; do not commit a filled-in copy.

### Required Render database binding

In Render, open the **Web Service** (not the Postgres instance), choose **Environment**, and add `DATABASE_URL` as a secret. Use **Add from Database** and select `InvoiceDatabase`, or paste its **Internal Database URL**. Save the setting and manually redeploy the Web Service. `DATABASE_URL` must be visible in the Web Service environment; creating a database alone does not automatically expose it to a service.

The service intentionally stops at startup when this variable is absent, because accepting invoices without durable storage would violate the idempotency requirement.

SKIDATA authenticates to every `/v1/...` endpoint with `SKIDATA_BASIC_AUTH_USER` and `SKIDATA_BASIC_AUTH_PASSWORD`. The service uses the `INVOICEREPORT_*` pair only when uploading a generated PDF to SKIDATA.

`GET /healthz` is intentionally public for Render. `GET /v1/invoices/checkConnectivity` is also public because SKIDATA's connectivity probe does not send Basic Auth. All other `/v1/...` routes require Basic Auth.

`GET /v1/invoices/health` requires Basic Auth. Both connectivity endpoints return `204` when PostgreSQL is reachable.

## Render configuration

- Build command: `npm ci`
- Start command: `npm start`
- Health check path: `/healthz`
- Node.js: 20 or later

`npm start` applies the database migration before starting the Fastify server and the durable PDF/reporting worker.

Use `BASE_PATH` only if SKIDATA requires a prefix such as `/bei/SSP/invoice`; it defaults to an empty string.
