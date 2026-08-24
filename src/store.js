const crypto = require('node:crypto');

const invoices = new Map();
const reports = new Map();
const validationErrors = [];

function addInvoice(invoice) {
  const id = invoice.invoiceId || crypto.randomUUID();
  const record = {
    id,
    receivedAt: new Date().toISOString(),
    invoice: { ...invoice, invoiceId: id },
  };
  invoices.set(id, record);
  return record;
}

function hasInvoice(id) {
  return invoices.has(id);
}

function addReport(id, byteLength) {
  const report = { externalInvoiceId: id, byteLength, receivedAt: new Date().toISOString() };
  reports.set(id, report);
  return report;
}

function addValidationError(error) {
  validationErrors.push({ ...error, occurredAt: new Date().toISOString() });
  if (validationErrors.length > 100) validationErrors.shift();
}

function summary() {
  return {
    invoicesReceived: invoices.size,
    reportsReceived: reports.size,
    recentInvoices: [...invoices.values()].slice(-20).map(({ id, receivedAt, invoice }) => ({
      id,
      receivedAt,
      invoiceNumber: invoice.invoiceNumber,
      currency: invoice.currency,
      invoiceAmount: invoice.invoiceAmount,
    })),
    recentReports: [...reports.values()].slice(-20),
    recentValidationErrors: validationErrors.slice(-20),
  };
}

module.exports = { addInvoice, hasInvoice, addReport, addValidationError, summary };
