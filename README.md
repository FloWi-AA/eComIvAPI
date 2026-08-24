# eCom Invoice Test Endpoint

Render-ready test service for the Invoice and Invoice Reporting APIs in `Kontext/api/invoice/v1`.

## Local run

```powershell
npm install
$env:TEST_USERNAME = 'test-client'
$env:TEST_PASSWORD = 'use-a-long-random-password'
npm start
```

The service listens on `http://localhost:10000` by default. Render supplies `PORT` automatically.

## Endpoints

All API-compatible endpoints use HTTP Basic Auth:

- `GET /healthz` - public Render health check
- `GET /bei/SSP/invoice/v1/invoices/health`
- `GET /bei/SSP/invoice/v1/vat/regex`
- `GET /bei/SSP/invoice/v1/vat/validate?vatNumber=123456789`
- `POST /bei/SSP/invoice/v1/invoices/invoice`
- `GET /bei/SSP/invoicereport/v1/invoicereports/health`
- `POST /bei/SSP/invoicereport/v1/invoicereports/invoice/{externalInvoiceId}/reportpdf`
- `GET /test/summary` - protected test evaluation

Invoice data must contain at least one `invoiceLines` item. Valid invoices receive a generated UUID with status `201`. A PDF report is accepted only for a UUID created by this service.

## Render Free Tier

Create a Render Web Service from this directory or repository:

- Build command: `npm ci`
- Start command: `npm start`
- Health check path: `/healthz`
- Environment variables: `TEST_USERNAME`, `TEST_PASSWORD`

Render provides HTTPS and a public URL. The Free Tier may sleep and its local memory is ephemeral. This service intentionally keeps test data in memory; invoices and reports disappear after a restart or redeploy. Use test data only, never production credentials, invoices, or personal data.

## Test

```powershell
npm test
```
