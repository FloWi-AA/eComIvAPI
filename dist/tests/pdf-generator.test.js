import { describe, expect, it } from "vitest";
import { PdfKitInvoiceGenerator } from "../src/services/pdf-generator.js";
describe("PdfKitInvoiceGenerator", () => {
    it("produces a non-empty PDF", async () => {
        const pdf = await new PdfKitInvoiceGenerator().generate({
            invoiceId: "123e4567-e89b-12d3-a456-426614174000",
            invoiceLines: [{ productName: "Test item", quantity: 1, grossPrice: 10 }],
            totalAmounts: { totalGross: 10 }
        });
        expect(Buffer.from(pdf).subarray(0, 5).toString()).toBe("%PDF-");
        expect(pdf.length).toBeGreaterThan(500);
    });
});
//# sourceMappingURL=pdf-generator.test.js.map