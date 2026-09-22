import { randomUUID } from "node:crypto";
export class InvoiceService {
    inbox;
    constructor(inbox) {
        this.inbox = inbox;
    }
    async accept(invoice) {
        if (!invoice || typeof invoice !== "object" || typeof invoice.invoiceId !== "string" || !isUuid(invoice.invoiceId)) {
            throw new InvoiceInputError("invoiceId is required");
        }
        const record = await this.inbox.insertOrGet(invoice.invoiceId, randomUUID(), invoice);
        if (record.conflict) {
            throw new InvoiceConflictError("invoiceId was received with a different payload");
        }
        return record.documentId;
    }
}
function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
export class InvoiceInputError extends Error {
}
export class InvoiceConflictError extends Error {
}
//# sourceMappingURL=invoice-service.js.map