import { describe, expect, it } from "vitest";
import { isSafeReturnPath, isShareToken, shareTokenFromReturnPath } from "./share-links";

const TOKEN = "AbCdEfGhIjKlMnOpQrSt_-";

describe("isShareToken", () => {
    it("aceita 22 caracteres base64url", () => {
        expect(isShareToken(TOKEN)).toBe(true);
    });

    it.each([
        ["curto", "abc"],
        ["longo", `${TOKEN}a`],
        ["com caractere fora do alfabeto", "AbCdEfGhIjKlMnOpQrSt/+"],
        ["com quebra de linha no fim", `${TOKEN}\n`],
        ["vazio", ""],
        ["que não é texto", 123],
    ])("recusa token %s", (_label, value) => {
        expect(isShareToken(value)).toBe(false);
    });
});

describe("isSafeReturnPath", () => {
    it.each([
        [`/s/${TOKEN}`],
        [`/s/${TOKEN}?add=1`],
        ["/suggested"],
    ])("aceita %s", (value) => {
        expect(isSafeReturnPath(value)).toBe(true);
    });

    it.each([
        ["https://evil.com"],
        ["//evil.com"],
        ["/\\evil.com"],
        ["/workouts"],
        ["/s/curto"],
        [`/s/${TOKEN}/../../evil`],
        [`/s/${TOKEN}?add=1&next=//evil.com`],
        [`/s/${TOKEN}#//evil.com`],
        [`/suggested/../evil`],
        ["javascript:alert(1)"],
        [""],
        [null],
        [undefined],
    ])("recusa %s", (value) => {
        expect(isSafeReturnPath(value)).toBe(false);
    });
});

describe("shareTokenFromReturnPath", () => {
    it("extrai o token com ou sem add=1", () => {
        expect(shareTokenFromReturnPath(`/s/${TOKEN}`)).toBe(TOKEN);
        expect(shareTokenFromReturnPath(`/s/${TOKEN}?add=1`)).toBe(TOKEN);
    });

    it("devolve null fora do formato de link", () => {
        expect(shareTokenFromReturnPath("/suggested")).toBeNull();
        expect(shareTokenFromReturnPath("//evil.com")).toBeNull();
        expect(shareTokenFromReturnPath(null)).toBeNull();
    });
});
