import { describe, expect, it } from "vitest";
import { InvoiceConflictError, InvoiceService } from "../src/services/invoice-service.js";
class FakeInbox {
    record;
    async insertOrGet(invoiceId, documentId, payload) {
        if (!this.record) {
            this.record = { invoiceId, documentId: "document-1", payload };
            return this.record;
        }
        return { ...this.record, conflict: JSON.stringify(this.record.payload) !== JSON.stringify(payload) };
    }
    async isReady() {
        return true;
    }
}
describe("InvoiceService", () => {
    it("returns the original document id on redelivery", async () => {
        const service = new InvoiceService(new FakeInbox());
        const invoice = { invoiceId: "123e4567-e89b-12d3-a456-426614174000", invoiceLines: [] };
        await expect(service.accept(invoice)).resolves.toBe("document-1");
        await expect(service.accept(invoice)).resolves.toBe("document-1");
    });
    it("rejects a changed payload for an existing invoice id", async () => {
        const service = new InvoiceService(new FakeInbox());
        await service.accept({ invoiceId: "123e4567-e89b-12d3-a456-426614174001", invoiceAmount: 10 });
        await expect(service.accept({ invoiceId: "123e4567-e89b-12d3-a456-426614174001", invoiceAmount: 11 })).rejects.toBeInstanceOf(InvoiceConflictError);
    });
});
//# sourceMappingURL=invoice-service.test.js.map