const VAT_REGEX = /^[0-9]{9}$/;

function errorResponse(errorCode, message, status = 400, errorType = 'BUSINESS') {
  return { errorCode, message, errorType, httpStatus: `${status} - ${statusText(status)}` };
}

function statusText(status) {
  return { 400: 'bad request', 401: 'unauthorized', 404: 'not found', 413: 'payload too large' }[status] || 'error';
}

function validateInvoice(invoice) {
  if (!invoice || typeof invoice !== 'object' || Array.isArray(invoice)) {
    return errorResponse(19, 'Request body must be a JSON object.');
  }
  if (invoice.invoiceId !== undefined && !isUuid(invoice.invoiceId)) {
    return errorResponse(8, 'invoiceId must be a UUID.');
  }
  if (invoice.sspTenantId !== undefined && !isUuid(invoice.sspTenantId)) {
    return errorResponse(8, 'sspTenantId must be a UUID.');
  }
  if (invoice.invoiceDate !== undefined && Number.isNaN(Date.parse(invoice.invoiceDate))) {
    return errorResponse(21, 'invoiceDate must be a valid ISO date-time.');
  }
  if (invoice.customer?.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invoice.customer.email)) {
    return errorResponse(10, 'customer.email must be a valid email address.');
  }
  if (invoice.customer?.vatNumber !== undefined && !VAT_REGEX.test(invoice.customer.vatNumber)) {
    return errorResponse(7, 'customer.vatNumber does not match the local VAT format.');
  }
  if (!Array.isArray(invoice.invoiceLines) || invoice.invoiceLines.length === 0) {
    return errorResponse(5, 'At least one invoice line is required.');
  }
  for (const line of invoice.invoiceLines) {
    if (line.quantity !== undefined && (!Number.isInteger(line.quantity) || line.quantity <= 0)) {
      return errorResponse(18, 'Invoice line quantity must be a positive integer.');
    }
    for (const field of ['price', 'netPrice', 'grossPrice', 'taxPercentage', 'taxAmount']) {
      if (line[field] !== undefined && (typeof line[field] !== 'number' || !Number.isFinite(line[field]))) {
        return errorResponse(19, `Invoice line ${field} must be a finite number.`);
      }
    }
  }
  return null;
}

function isUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

module.exports = { VAT_REGEX, errorResponse, validateInvoice };
