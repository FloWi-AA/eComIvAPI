function required(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
export function loadConfig() {
    return {
        port: Number(process.env.PORT ?? 8080),
        host: process.env.HOST ?? "0.0.0.0",
        basePath: process.env.BASE_PATH ?? "",
        databaseUrl: required("DATABASE_URL"),
        skidataAuthUser: required("SKIDATA_BASIC_AUTH_USER"),
        skidataAuthPassword: required("SKIDATA_BASIC_AUTH_PASSWORD"),
        invoiceReportBaseUrl: required("INVOICEREPORT_BASE_URL").replace(/\/$/, ""),
        invoiceReportAuthUser: required("INVOICEREPORT_AUTH_USER"),
        invoiceReportAuthPassword: required("INVOICEREPORT_AUTH_PASSWORD"),
        vatRegex: process.env.VAT_REGEX ?? "^[0-9]{9}$"
    };
}
//# sourceMappingURL=config.js.map