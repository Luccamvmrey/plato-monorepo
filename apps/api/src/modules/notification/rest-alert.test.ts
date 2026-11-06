import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { sendPushToUser } = vi.hoisted(() => ({ sendPushToUser: vi.fn(async () => 1) }));

vi.mock("../../shared/push/push", () => ({ sendPushToUser }));

import { cancelRestAlert, scheduleRestAlert } from "./rest-alert";

const ENDPOINT = "https://fcm.googleapis.com/fcm/send/abc";

describe("rest alert", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        sendPushToUser.mockClear();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("envia só quando o descanso termina, para aquele aparelho e com prioridade alta", () => {
        scheduleRestAlert(1, ENDPOINT, 90_000, 123);

        vi.advanceTimersByTime(89_999);
        expect(sendPushToUser).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(sendPushToUser).toHaveBeenCalledTimes(1);
        expect(sendPushToUser).toHaveBeenCalledWith(
            1,
            expect.objectContaining({ tag: "rest-alert", measureFrom: 123 }),
            { endpoint: ENDPOINT, ttlSeconds: 60, urgency: "high" }
        );
    });

    it("reagendar substitui o aviso anterior", () => {
        scheduleRestAlert(1, ENDPOINT, 90_000, 123);
        scheduleRestAlert(1, ENDPOINT, 105_000, 456);

        vi.advanceTimersByTime(105_000);

        expect(sendPushToUser).toHaveBeenCalledTimes(1);
        expect(sendPushToUser).toHaveBeenCalledWith(1, expect.objectContaining({ measureFrom: 456 }), expect.anything());
    });

    it("cancelar impede o envio", () => {
        scheduleRestAlert(1, ENDPOINT, 90_000, 123);
        cancelRestAlert(1);

        vi.advanceTimersByTime(90_000);

        expect(sendPushToUser).not.toHaveBeenCalled();
    });

    it("cancelar sem aviso pendente não falha, e uma pessoa não afeta a outra", () => {
        expect(() => cancelRestAlert(99)).not.toThrow();

        scheduleRestAlert(1, ENDPOINT, 1_000, 1);
        scheduleRestAlert(2, ENDPOINT, 1_000, 2);
        cancelRestAlert(1);

        vi.advanceTimersByTime(1_000);

        expect(sendPushToUser).toHaveBeenCalledTimes(1);
        expect(sendPushToUser).toHaveBeenCalledWith(2, expect.anything(), expect.anything());
    });
});
