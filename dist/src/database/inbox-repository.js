import { createHash } from "node:crypto";
export class PostgresInboxRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async insertOrGet(invoiceId, documentId, payload) {
        const payloadHash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
        const result = await this.pool.query(`INSERT INTO invoice_inbox (invoice_id, document_id, payload, payload_hash)
       VALUES ($1, $2, $3::jsonb, $4)
       ON CONFLICT (invoice_id) DO UPDATE SET invoice_id = EXCLUDED.invoice_id
       RETURNING invoice_id AS "invoiceId", document_id AS "documentId", payload, payload_hash AS "payloadHash"`, [invoiceId, documentId, JSON.stringify(payload), payloadHash]);
        const record = result.rows[0];
        return {
            invoiceId: record.invoiceId,
            documentId: record.documentId,
            payload: record.payload,
            conflict: record.payloadHash !== payloadHash
        };
    }
    async isReady() {
        await this.pool.query("SELECT 1");
        return true;
    }
    async claimNext() {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            const result = await client.query(`SELECT document_id AS "documentId", payload AS invoice, pdf
         FROM invoice_inbox
         WHERE status IN ('received', 'generated')
            OR (status = 'reporting_retry' AND claimed_at < NOW() - INTERVAL '1 minute')
         ORDER BY received_at
         FOR UPDATE SKIP LOCKED
         LIMIT 1`);
            const job = result.rows[0];
            if (!job) {
                await client.query("COMMIT");
                return undefined;
            }
            await client.query(`UPDATE invoice_inbox
         SET status = 'processing', claimed_at = NOW(), attempts = attempts + 1
         WHERE document_id = $1`, [job.documentId]);
            await client.query("COMMIT");
            return { documentId: job.documentId, invoice: job.invoice, pdf: job.pdf };
        }
        catch (error) {
            await client.query("ROLLBACK");
            throw error;
        }
        finally {
            client.release();
        }
    }
    async markGenerated(documentId, pdf) {
        await this.pool.query(`UPDATE invoice_inbox SET status = 'generated', pdf = $2, last_error = NULL WHERE document_id = $1`, [documentId, Buffer.from(pdf)]);
    }
    async markReported(documentId) {
        await this.pool.query(`UPDATE invoice_inbox SET status = 'reported', reported_at = NOW(), last_error = NULL WHERE document_id = $1`, [documentId]);
    }
    async markReportingFailed(documentId, reason, retryable) {
        await this.pool.query(`UPDATE invoice_inbox SET status = $2, last_error = $3 WHERE document_id = $1`, [documentId, retryable ? "reporting_retry" : "failed", reason]);
    }
    async markGenerationFailed(documentId, reason) {
        await this.pool.query(`UPDATE invoice_inbox SET status = 'failed', last_error = $2 WHERE document_id = $1`, [documentId, reason]);
    }
}
//# sourceMappingURL=inbox-repository.js.map