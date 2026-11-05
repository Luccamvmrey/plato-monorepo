import { describe, expect, it, vi } from "vitest";

vi.mock("@plato/database", () => ({ default: {} }));

import { isAllowedPushEndpoint, shouldDropSubscription } from "./push";

describe("shouldDropSubscription", () => {
    const now = Date.parse("2026-11-05T12:00:00Z");
    const minutesAgo = (minutes: number) => new Date(now - minutes * 60_000);

    it.each([404, 410])("apaga inscrição antiga que recebe %i", (status) => {
        expect(shouldDropSubscription(status, minutesAgo(60), now)).toBe(true);
    });

    it.each([404, 410])("mantém inscrição recém-criada que recebe %i", (status) => {
        expect(shouldDropSubscription(status, minutesAgo(1), now)).toBe(false);
    });

    it.each([400, 403, 429, 500, undefined])("mantém a inscrição em outras falhas: %s", (status) => {
        expect(shouldDropSubscription(status, minutesAgo(60), now)).toBe(false);
    });
});

describe("isAllowedPushEndpoint", () => {
    it.each([
        "https://fcm.googleapis.com/fcm/send/abc",
        "https://web.push.apple.com/QOabc",
        "https://updates.push.services.mozilla.com/wpush/v2/abc",
        "https://wns2-par02p.notify.windows.com/w/?token=abc",
    ])("aceita o serviço de push real: %s", (endpoint) => {
        expect(isAllowedPushEndpoint(endpoint)).toBe(true);
    });

    it.each([
        "http://fcm.googleapis.com/fcm/send/abc",
        "https://localhost/x",
        "https://127.0.0.1/x",
        "https://169.254.169.254/latest/meta-data",
        "https://push.apple.com.evil.example/x",
        "https://evilpush.apple.com/x",
        "https://fcm.googleapis.com:8443/x",
        "https://user@fcm.googleapis.com/x",
        "file:///etc/passwd",
        "não é uma url",
    ])("recusa o que não é serviço de push: %s", (endpoint) => {
        expect(isAllowedPushEndpoint(endpoint)).toBe(false);
    });
});
