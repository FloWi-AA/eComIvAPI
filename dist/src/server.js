import Fastify from "fastify";
import { Pool } from "pg";
import { basicAuth } from "./auth.js";
import { loadConfig } from "./config.js";
import { PostgresInboxRepository } from "./database/inbox-repository.js";
import { InvoiceConflictError, InvoiceInputError, InvoiceService } from "./services/invoice-service.js";
import { PdfKitInvoiceGenerator } from "./services/pdf-generator.js";
import { ReportingClient } from "./services/reporting-client.js";
import { InvoiceWorker } from "./workers/invoice-worker.js";
export function buildServer() {
    const config = loadConfig();
    const pool = new Pool({ connectionString: config.databaseUrl });
    const inbox = new PostgresInboxRepository(pool);
    const invoices = new InvoiceService(inbox);
    const app = Fastify({ logger: true });
    const prefix = config.basePath.replace(/\/$/, "");
    app.get(`${prefix}/healthz`, async (_request, reply) => {
        try {
            await inbox.isReady();
            return reply.code(204).send();
        }
        catch {
            return reply.code(503).type("text/plain").send("Service unavailable");
        }
    });
    app.register(async (scope) => {
        scope.addHook("preHandler", basicAuth(config.skidataAuthUser, config.skidataAuthPassword));
        scope.post(`${prefix}/v1/invoices/invoice`, async (request, reply) => {
            try {
                const documentId = await invoices.accept(request.body);
                return reply.code(201).type("application/json").send(documentId);
            }
            catch (error) {
                if (error instanceof InvoiceInputError || error instanceof InvoiceConflictError) {
                    return reply.code(400).type("application/json").send({
                        errorCode: error instanceof InvoiceConflictError ? 15 : 8,
                        message: error.message,
                        errorType: "BUSINESS",
                        httpStatus: "400"
                    });
                }
                request.log.error(error);
                return reply.code(500).type("application/text").send("Failure");
            }
        });
        scope.get(`${prefix}/v1/vat/regex`, async (_request, reply) => reply.code(200).type("application/json").send(config.vatRegex));
        scope.get(`${prefix}/v1/vat/validate`, async (request, reply) => {
            const vatNumber = request.query.vatNumber;
            if (!vatNumber || !new RegExp(config.vatRegex).test(vatNumber)) {
                return reply.code(400).type("application/json").send("Invalid VAT number");
            }
            return reply.code(204).send();
        });
        scope.get(`${prefix}/v1/invoices/health`, async (_request, reply) => {
            try {
                await inbox.isReady();
                return reply.code(204).send();
            }
            catch {
                return reply.code(500).type("application/json").send("Failure");
            }
        });
    });
    app.addHook("onClose", async () => {
        await pool.end();
    });
    return app;
}
if (import.meta.url === `file://${process.argv[1]}`) {
    const config = loadConfig();
    const app = buildServer();
    const pool = new Pool({ connectionString: config.databaseUrl });
    const repository = new PostgresInboxRepository(pool);
    const worker = new InvoiceWorker(repository, new PdfKitInvoiceGenerator(), new ReportingClient({
        baseUrl: config.invoiceReportBaseUrl,
        username: config.invoiceReportAuthUser,
        password: config.invoiceReportAuthPassword
    }));
    const poll = async () => {
        try {
            while (await worker.processNext()) {
                // Drain available work before waiting for the next poll.
            }
        }
        catch (error) {
            app.log.error(error, "Invoice worker iteration failed");
        }
        setTimeout(() => void poll(), 1_000);
    };
    app.listen({ port: config.port, host: config.host }).then(() => {
        void poll();
    }).catch((error) => {
        app.log.error(error);
        process.exit(1);
    });
}
//# sourceMappingURL=server.js.map