"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeHost = normalizeHost;
exports.normalizeOptionalHost = normalizeOptionalHost;
const HOST_PATTERN = /^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?(:[0-9]{1,5})?$/;
/**
 * Validates and normalises a host setting to a bare, lower-case `hostname[:port]`.
 *
 * Accepts `offers.example.com` or `https://offers.example.com/`. Rejects blank
 * values, other schemes (cleartext `http` included), paths, queries and
 * whitespace. The native SDKs apply the same rules; checking here makes a wrong
 * host fail at the call site.
 *
 * @throws Error naming `setting` when the value is not usable.
 */
function normalizeHost(raw, setting = "host") {
    const trimmed = (raw !== null && raw !== void 0 ? raw : "").trim();
    if (trimmed.length === 0) {
        throw new Error(`${setting} is required`);
    }
    let withoutScheme;
    if (trimmed.toLowerCase().startsWith("https://")) {
        withoutScheme = trimmed.substring("https://".length);
    }
    else if (trimmed.includes("://")) {
        throw new Error(`${setting} must be a host name or an https:// URL`);
    }
    else {
        withoutScheme = trimmed;
    }
    withoutScheme = withoutScheme.replace(/\/+$/, "");
    if (!HOST_PATTERN.test(withoutScheme)) {
        throw new Error(`${setting} must be a plain host name such as example.com`);
    }
    return withoutScheme.toLowerCase();
}
/** Like `normalizeHost` for an optional setting: blank means "not set". */
function normalizeOptionalHost(raw, setting) {
    if (raw === null || raw === undefined || raw.trim().length === 0) {
        return undefined;
    }
    return normalizeHost(raw, setting);
}
