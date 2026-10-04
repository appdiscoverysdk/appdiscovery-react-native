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
export declare function normalizeHost(raw: string | null | undefined, setting?: string): string;
/** Like `normalizeHost` for an optional setting: blank means "not set". */
export declare function normalizeOptionalHost(raw: string | null | undefined, setting: string): string | undefined;
