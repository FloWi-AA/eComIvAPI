const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../src/server');

let server;
let baseUrl;
const auth = { username: 'test-client', password: 'change-me' };

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const request = http.request(`${baseUrl}${path}`, {
      method: options.method || 'GET',
      headers: { ...(options.headers || {}) },
      auth: options.auth === false ? undefined : `${auth.username}:${auth.password}`,
    }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({
        status: response.statusCode,
        headers: response.headers,
        body: Buffer.concat(chunks),
      }));
    });
    request.on('error', reject);
    if (options.body) request.write(options.body);
    request.end();
  });
}

test.before(() => new Promise(resolve => {
  server = app.listen(0, '127.0.0.1', () => {
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    resolve();
  });
}));

test.after(() => new Promise(resolve => server.close(resolve)));

test('healthz is public and returns ok', async () => {
  const response = await request('/healthz', { auth: false });
  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(response.body), { status: 'ok' });
});

test('API rejects missing credentials', async () => {
  const response = await request('/bei/SSP/invoice/v1/invoices/health', { auth: false });
  assert.equal(response.status, 401);
  assert.match(response.headers['www-authenticate'], /Basic/);
});

test('valid invoice can be reported as PDF', async () => {
  const invoice = JSON.stringify({
    invoiceNumber: 'TEST-001',
    invoiceDate: '2026-08-24T10:30:00Z',
    customer: { email: 'test@example.com', vatNumber: '123456789' },
    invoiceLines: [{ productName: 'Test', quantity: 1, price: 10 }],
  });
  const created = await request('/bei/SSP/invoice/v1/invoices/invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(invoice) },
    body: invoice,
  });
  assert.equal(created.status, 201);
  const invoiceId = JSON.parse(created.body);
  assert.match(invoiceId, /^[0-9a-f-]{36}$/i);

  const pdf = Buffer.from('%PDF-test');
  const report = await request(`/bei/SSP/invoicereport/v1/invoicereports/invoice/${invoiceId}/reportpdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/pdf', 'Content-Length': pdf.length },
    body: pdf,
  });
  assert.equal(report.status, 201);
});

test('invalid invoice returns documented error response', async () => {
  const invoice = JSON.stringify({ invoiceLines: [] });
  const response = await request('/bei/SSP/invoice/v1/invoices/invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(invoice) },
    body: invoice,
  });
  assert.equal(response.status, 400);
  assert.equal(JSON.parse(response.body).errorCode, 5);
});
