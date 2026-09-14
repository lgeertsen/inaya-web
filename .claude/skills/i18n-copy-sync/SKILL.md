---
name: i18n-copy-sync
description: Use when adding or editing any user-facing text in this project (new page copy, labels, buttons, error messages) — ensures fr.json and en.json stay structurally in sync and next-intl is used correctly.
---

# i18n copy sync (inaya-web)

This project uses `next-intl` with French as the default/primary locale. All user-facing text
lives in `i18n/messages/fr.json` and `i18n/messages/en.json` — never hardcode strings directly in
components.

## Steps

1. **Write the French copy first.** French is the primary audience (Association Inaya is a French
   sanctuary); treat English as the translation, not the other way around.

2. **Add the key to both files at the same nested path.** The messages are organized by
   namespace matching page/section names (`common`, `nav`, `home`, `announcement`, etc. — see
   `i18n/messages/en.json`). A new key must land under the same namespace and same key name in
   both `fr.json` and `en.json`.

3. **Use `useTranslations("<namespace>")`** in the component and reference the key — don't inline
   the string, and don't reference a namespace that doesn't exist in both files.

4. **Verify structural parity after editing.** Grep both files for the new key to confirm it
   exists in each with the same path:
   ```bash
   grep -n "<key>" i18n/messages/fr.json i18n/messages/en.json
   ```
   If you added or restructured a whole namespace, diff the key structure of both files (e.g. by
   comparing `jq 'keys'` output at the relevant path) rather than just checking the one key you
   added — it's easy to leave one locale with a stray or missing nested key.

5. **Don't add a key to only one locale.** If you're unsure of the translation, add a reasonable
   placeholder in the other locale rather than omitting the key — a missing key will surface as a
   runtime/build error from `next-intl`, not a silent fallback.
