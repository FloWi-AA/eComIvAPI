const express = require('express');
const crypto = require('node:crypto');
const { addInvoice, hasInvoice, addReport, addValidationError, summary } = require('./store');
const { VAT_REGEX, errorResponse, validateInvoice } = require('./validation');

const app = express();
const port = Number(process.env.PORT || 10000);
const username = process.env.TEST_USERNAME || 'test-client';
const password = process.env.TEST_PASSWORD || 'change-me';
const maxJsonBytes = 1024 * 1024;
const maxPdfBytes = 10 * 1024 * 1024;

app.disable('x-powered-by');

// The external test system uses this unauthenticated connectivity probe.
app.get('/v1/invoices/checkConnectivity', (_request, response) => response.sendStatus(204));

function basicAuth(request, response, next) {
  const header = request.get('authorization') || '';
  const [scheme, encoded] = header.split(' ');
  let valid = false;
  if (scheme?.toLowerCase() === 'basic' && encoded) {
    try {
      const decoded = Buffer.from(encoded, 'base64').toString('utf8');
      const separator = decoded.indexOf(':');
      const suppliedUser = separator >= 0 ? decoded.slice(0, separator) : '';
      const suppliedPassword = separator >= 0 ? decoded.slice(separator + 1) : '';
      valid = suppliedUser === username && suppliedPassword === password;
    } catch {}
  }
  if (!valid) {
    return response.status(401).set('WWW-Authenticate', 'Basic realm="eCom test endpoint"').json('Not authorized');
  }
  return next();
}

function sendValidationError(response, error) {
  addValidationError({ errorCode: error.errorCode, message: error.message, path: response.req.path });
  return response.status(Number(error.httpStatus.split(' ')[0])).json(error);
}

app.get('/healthz', (_request, response) => response.status(200).json({ status: 'ok' }));

app.use('/bei/SSP/invoice', basicAuth);
app.use('/bei/SSP/invoicereport', basicAuth);
app.use('/v1', basicAuth);
app.use('/test/summary', basicAuth);

app.use('/bei/SSP/invoice', express.json({ limit: maxJsonBytes, type: 'application/json' }));
app.use('/v1', express.json({ limit: maxJsonBytes, type: 'application/json' }));

app.get('/bei/SSP/invoice/v1/invoices/health', (_request, response) => response.sendStatus(204));
app.get('/bei/SSP/invoice/v1/invoices/checkConnectivity', (_request, response) => response.sendStatus(204));
app.get('/v1/invoices/health', (_request, response) => response.sendStatus(204));
app.get('/bei/SSP/invoice/v1/vat/regex', (_request, response) => response.json(VAT_REGEX.source));
app.get('/v1/vat/regex', (_request, response) => response.json(VAT_REGEX.source));
app.get('/bei/SSP/invoice/v1/vat/validate', (request, response) => {
  const vatNumber = request.query.vatNumber;
  if (typeof vatNumber !== 'string' || !VAT_REGEX.test(vatNumber)) {
    return response.status(400).json(errorResponse(7, 'vatNumber is invalid.'));
  }
  return response.sendStatus(204);
});
app.get('/v1/vat/validate', (request, response) => {
  const vatNumber = request.query.vatNumber;
  if (typeof vatNumber !== 'string' || !VAT_REGEX.test(vatNumber)) {
    return response.status(400).json(errorResponse(7, 'vatNumber is invalid.'));
  }
  return response.sendStatus(204);
});
app.post('/bei/SSP/invoice/v1/invoices/invoice', (request, response) => {
  const validationError = validateInvoice(request.body);
  if (validationError) return sendValidationError(response, validationError);
  const record = addInvoice(request.body);
  return response.status(201).json(record.id);
});
app.post('/v1/invoices/invoice', (request, response) => {
  const validationError = validateInvoice(request.body);
  if (validationError) return sendValidationError(response, validationError);
  const record = addInvoice(request.body);
  return response.status(201).json(record.id);
});

app.get('/bei/SSP/invoicereport/v1/invoicereports/health', (_request, response) => response.sendStatus(204));
app.get('/v1/invoicereports/health', (_request, response) => response.sendStatus(204));
app.post('/bei/SSP/invoicereport/v1/invoicereports/invoice/:externalInvoiceId/reportpdf', express.raw({ type: 'application/pdf', limit: maxPdfBytes }), (request, response) => {
  if (!request.is('application/pdf') || !Buffer.isBuffer(request.body) || request.body.length === 0) {
    return response.status(400).json(errorResponse(6, 'A non-empty application/pdf body is required.'));
  }
  const { externalInvoiceId } = request.params;
  if (!hasInvoice(externalInvoiceId)) return response.sendStatus(404);
  addReport(externalInvoiceId, request.body.length);
  return response.sendStatus(201);
});
app.post('/v1/invoicereports/invoice/:externalInvoiceId/reportpdf', express.raw({ type: 'application/pdf', limit: maxPdfBytes }), (request, response) => {
  if (!request.is('application/pdf') || !Buffer.isBuffer(request.body) || request.body.length === 0) {
    return response.status(400).json(errorResponse(6, 'A non-empty application/pdf body is required.'));
  }
  const { externalInvoiceId } = request.params;
  if (!hasInvoice(externalInvoiceId)) return response.sendStatus(404);
  addReport(externalInvoiceId, request.body.length);
  return response.sendStatus(201);
});

app.get('/test/summary', (_request, response) => response.json(summary()));

app.use((error, _request, response, _next) => {
  if (error.type === 'entity.too.large') return response.status(413).json(errorResponse(19, 'Request payload is too large.', 413));
  if (error instanceof SyntaxError) return response.status(400).json(errorResponse(19, 'Request body contains invalid JSON.'));
  console.error(error);
  return response.status(500).json(errorResponse(99, 'Unknown server error.', 500, 'TECHNICAL'));
});

if (require.main === module) {
  const server = app.listen(port, '0.0.0.0', () => console.log(`eCom test endpoint listening on port ${port}`));
  const shutdown = () => server.close(() => process.exit(0));
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = app;
