export class UnconfiguredInvoiceGenerator {
    async generate(_invoice) {
        throw new Error("Invoice PDF generator is not configured");
    }
}
//# sourceMappingURL=invoice-generator.js.map