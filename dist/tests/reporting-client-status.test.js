import { describe, expect, it, vi } from "vitest";
import { ReportingClient } from "../src/services/reporting-client.js";
describe("ReportingClient status policy", () => {
    it("does not retry a 400 response", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 400 })));
        const result = await new ReportingClient({ baseUrl: "https://example.test", username: "u", password: "p" }).reportPdf("id", new Uint8Array([1]));
        expect(result).toEqual({ kind: "failed", status: 400 });
        vi.unstubAllGlobals();
    });
});
//# sourceMappingURL=reporting-client-status.test.js.map