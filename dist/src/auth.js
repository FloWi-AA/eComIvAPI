import { timingSafeEqual } from "node:crypto";
function equalSecret(actual, expected) {
    const actualBuffer = Buffer.from(actual);
    const expectedBuffer = Buffer.from(expected);
    return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}
export function basicAuth(user, password) {
    return async function authenticate(request, reply) {
        const header = request.headers.authorization;
        if (!header?.startsWith("Basic ")) {
            await reply.code(401).type("application/json").send("Not authorized");
            return;
        }
        let credentials;
        try {
            credentials = Buffer.from(header.slice(6), "base64").toString("utf8");
        }
        catch {
            await reply.code(401).type("application/json").send("Not authorized");
            return;
        }
        const separator = credentials.indexOf(":");
        const actualUser = separator >= 0 ? credentials.slice(0, separator) : credentials;
        const actualPassword = separator >= 0 ? credentials.slice(separator + 1) : "";
        if (!equalSecret(actualUser, user) || !equalSecret(actualPassword, password)) {
            await reply.code(401).type("application/json").send("Not authorized");
        }
    };
}
//# sourceMappingURL=auth.js.map