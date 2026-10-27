# Phase 2.6 — official brand analysis

Inspected 27 October 2026. Sources: [official English website](https://www.vsolutions.co/) and [official Arabic website](https://www.vsolutions.co/ar). Inspection was read-only. The company's website was not modified.

## Observed corporate identity

| Element                | Extracted evidence                                                                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Logo                   | Header HTML/CSS renders a skewed VS tile with a cyan-to-blue gradient, white border, rounded corners and a bold wordmark. A matching official PNG is linked as the favicon. |
| Primary                | Inline `:root` variable `--primary: #00d4ff`                                                                                                                                |
| Secondary              | Inline `--primary-dark: #007bff`                                                                                                                                            |
| Dark surfaces          | Inline `--dark-bg: #0a0a0a`, `--darker-bg: #050505`; body background `#000`                                                                                                 |
| Supporting neutral     | Inline `--text-gray: #b3b3b3`; white text on dark backgrounds                                                                                                               |
| English typography     | Montserrat; linked weights 400, 600, 800 and 900; bold uppercase company wordmark                                                                                           |
| Arabic typography/name | Cairo; linked weights 400, 600, 800 and 900; header name **رؤى وحلول**                                                                                                      |
| Buttons                | Cyan background, black bold text, 5px corners; outlined rounded language control; brighter hover states and marketing glow                                                  |
| Visual language        | Strong contrast, cyan rules/accents, charcoal backgrounds, white headings and the blue VS identity                                                                          |

The site's styles are embedded in the page. Linked stylesheets supply Google Fonts and Font Awesome. No additional company CSS file was linked by the inspected homepages. The wordmark is HTML, not a downloadable lockup image.

## Asset provenance

The linked [official PNG](https://www.vsolutions.co/vison/new/favicon.png) returned HTTP 200 with `image/png`, 26,251 bytes. It is copied **without alteration** to `public/brand/vs-official.png`, used by the reusable `BrandMark` component and the browser favicon. Original and local SHA-256 hashes both equal:

`BC66997B128C2BB81ABCF6BD4D909333E3C7EB4AD91E403D239147545295A4D5`

The public header is reproduced with the official PNG mark, company name, corporate descriptor and matching local fonts. No separate vector master or brand manual was exposed in the inspected page references. The previously provisional application V mark is removed.

Read-only source observations, logo markup, complete inline styles, font URLs and a reference screenshot are saved under `artifacts/phase2-6/official-*-evidence.json` and `official-site.jpg`. `public/brand/README.md` records asset provenance.

## Product integration decisions

The approved entry folio, separate role experiences, compact employee dashboard, admin priority desk and navigation remain intact. Marketing photography, full-page heroes, navigation structure and hover animation are not copied into the operational product.

`src/styles/tokens.css` distinguishes exact source colors (`--brand-primary`, `--brand-secondary`, `--brand-dark`, `--brand-darker`, `--brand-gray`) from product-specific surfaces, borders and accessible text variants. Cyan buttons use dark text. Light-surface links use a darker cyan-derived foreground, `#006a80`, for readability; this is an application adaptation, not a claimed official source color. Pending/completed/overdue retain their distinct yellow/green/red labels and icons.

Montserrat replaces Inter and is bundled locally alongside Cairo. The logo and fonts require no runtime requests to the company site, Google Fonts or a font CDN. Shared tokens/components cover entry, both dashboards, sidebar, registration, details, reports, daily preview and settings. The report's printable header also uses the shared official brand component.
