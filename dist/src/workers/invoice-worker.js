export class InvoiceWorker {
    jobs;
    generator;
    reporting;
    constructor(jobs, generator, reporting) {
        this.jobs = jobs;
        this.generator = generator;
        this.reporting = reporting;
    }
    async processNext() {
        const job = await this.jobs.claimNext();
        if (!job)
            return false;
        let pdf = job.pdf;
        try {
            pdf ??= await this.generator.generate(job.invoice);
            await this.jobs.markGenerated(job.documentId, pdf);
        }
        catch (error) {
            await this.jobs.markGenerationFailed(job.documentId, error instanceof Error ? error.message : "Unknown generation failure");
            return true;
        }
        const result = await this.reporting.reportPdf(job.documentId, pdf);
        if (result.kind === "reported") {
            await this.jobs.markReported(job.documentId);
        }
        else {
            await this.jobs.markReportingFailed(job.documentId, result.kind === "not-found"
                ? "SKIDATA invoice not found"
                : result.kind === "failed"
                    ? `SKIDATA rejected report with HTTP ${result.status ?? "unknown"}`
                    : "Retryable reporting failure", result.kind === "retryable");
        }
        return true;
    }
}
//# sourceMappingURL=invoice-worker.js.map