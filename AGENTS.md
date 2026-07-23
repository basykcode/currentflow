# Current engineering rules

- Keep TypeScript in strict mode; do not use `any` unless unavoidable and documented.
- Never fabricate traditional calculations or source data.
- Keep domain calculations independent from presentation.
- Every displayed datum carries a provenance or availability status.
- Keep components focused; avoid giant `App.vue` or route components.
- Make no hidden network calls and store no secrets in source.
- Run `npm run check` before claiming completion.
- Update documentation when architecture or integration boundaries change.
- Preserve accessibility, responsive behavior, and the product principles in `docs/PRODUCT_PRINCIPLES.md`.
