# Decision: Protect static special messages with browser-side encryption

- Status: accepted
- Date (UTC): 2026-07-25
- Scope: Product privacy and static application architecture

## Context

The temporary VH special-message page needs a password gate, while the production frontend remains
a static Cloudflare Pages deployment with no app-owned authentication service. The password and
future personal message must not be committed as plaintext.

## Constraints and requirements

- Keep the existing static Vue/Vite deployment and make no hidden network calls.
- Store neither the supplied password nor decrypted message content in source or browser storage.
- Make the privacy limitation explicit rather than presenting client-side logic as server
  authorization.
- Preserve a path to replace the placeholder with the real message without changing the route or
  presentation structure.

## Options considered

1. **Store a plaintext password and message in the client bundle** — rejected because both would be
   immediately recoverable and would violate the repository's no-secrets rule.
2. **Add a server-side authentication boundary** — deferred because no frontend runtime or
   credential-management access is available for this temporary static feature.
3. **Encrypt the message for browser-side decryption** — accepted because it keeps the password and
   message plaintext out of the repository while preserving the static deployment.

## Decision

Store the message payload as AES-256-GCM ciphertext. Derive its key from the user-entered password
with PBKDF2-SHA-256 and a per-message random salt, decrypt only in memory, and treat authenticated
decryption failure as a rejected password. Do not persist access or decrypted copy. Keep the route
out of the sitemap and request crawler exclusion.

## Rationale and supporting evidence

Authenticated encryption means bypassing the visual gate does not reveal the message without the
password-derived key. The current implementation completes locally through the browser Web Crypto
API and introduces no backend, secret variable, or network request.

## Consequences and tradeoffs

- The password and plaintext message are absent from tracked source.
- The real message can later replace the placeholder by regenerating only the encrypted payload.
- Anyone with the public bundle can attempt password guesses offline; this is a private sharing
  mechanism, not identity-aware authorization.
- A stronger confidentiality requirement must move decryption behind authenticated server-side
  access.

## Implementation or migration implications

- Future edits to the VH body must be encrypted offline with the existing password and a fresh salt
  and IV before committing.
- A supplied music file remains a local static asset; its controls must show unavailable until the
  licensed file exists.

## Verification criteria

- The supplied password decrypts the placeholder payload and an incorrect password does not.
- Repository scans do not find the supplied plaintext password or plaintext message.
- The production build contains no runtime request for an absent music file.

## Supersedes

None.

## Superseded by

None.

## Related files, issues, handoffs, and commits

- [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md)
- [`../../../src/features/special-messages/security.ts`](../../../src/features/special-messages/security.ts)
- [`../../../src/features/special-messages/views/SpecialMessageView.vue`](../../../src/features/special-messages/views/SpecialMessageView.vue)
