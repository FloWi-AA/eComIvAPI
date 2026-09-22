import PDFDocument from "pdfkit";
export class PdfKitInvoiceGenerator {
    generate(invoice) {
        return new Promise((resolve, reject) => {
            const document = new PDFDocument({ margin: 50 });
            const chunks = [];
            document.on("data", (chunk) => chunks.push(chunk));
            document.on("end", () => resolve(Buffer.concat(chunks)));
            document.on("error", reject);
            document.fontSize(20).text("Invoice");
            document.moveDown();
            document.fontSize(11).text(`Invoice ID: ${invoice.invoiceId ?? "-"}`);
            document.text(`Invoice number: ${invoice.invoiceNumber ?? "-"}`);
            document.text(`Invoice date: ${invoice.invoiceDate ?? "-"}`);
            document.text(`Currency: ${invoice.currency ?? "-"}`);
            document.moveDown();
            if (invoice.customer) {
                document.fontSize(13).text("Customer");
                document.fontSize(11).text(invoice.customer.name ?? "-");
                document.text(invoice.customer.email ?? "");
                const address = invoice.customer.address;
                if (address) {
                    document.text([address.street, address.postalCode, address.city, address.country].filter(Boolean).join(", "));
                }
                document.moveDown();
            }
            document.fontSize(13).text("Lines");
            document.fontSize(11);
            for (const line of invoice.invoiceLines ?? []) {
                const description = line.productName ?? line.description ?? "Item";
                const quantity = line.quantity ?? 1;
                const amount = line.grossPrice ?? line.netPrice ?? line.price ?? 0;
                document.text(`${description} | quantity: ${quantity} | amount: ${amount}`);
            }
            document.moveDown();
            document.text(`Total net: ${invoice.totalAmounts?.totalNet ?? "-"}`);
            document.text(`Total gross: ${invoice.totalAmounts?.totalGross ?? invoice.invoiceAmount ?? "-"}`);
            document.end();
        });
    }
}
//# sourceMappingURL=pdf-generator.js.map