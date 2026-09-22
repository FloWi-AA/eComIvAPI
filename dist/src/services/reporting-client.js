export class ReportingClient {
    config;
    constructor(config) {
        this.config = config;
    }
    async reportPdf(externalInvoiceId, pdf) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 10_000);
        try {
            const response = await fetch(`${this.config.baseUrl}/v1/invoicereports/invoice/${encodeURIComponent(externalInvoiceId)}/reportpdf`, {
                method: "POST",
                headers: {
                    Authorization: `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString("base64")}`,
                    "Content-Type": "application/pdf"
                },
                body: Buffer.from(pdf),
                signal: controller.signal
            });
            if (response.status === 201)
                return { kind: "reported" };
            if (response.status === 404)
                return { kind: "not-found" };
            if (response.status >= 500)
                return { kind: "retryable", status: response.status };
            return { kind: "failed", status: response.status };
        }
        catch {
            return { kind: "retryable" };
        }
        finally {
            clearTimeout(timeout);
        }
    }
}
//# sourceMappingURL=reporting-client.js.map