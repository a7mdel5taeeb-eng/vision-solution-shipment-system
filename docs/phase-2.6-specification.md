# VISION & SOLUTION — PHASE 2.6

## Official Brand Integration & Operational Improvements

The Phase 2.5 UI/UX refinement has been completed.

I am satisfied with the current interface, navigation, and overall user experience.

Before starting Phase 3 (Production Backend & Database), I want to make two important improvements.

## TASK 1 — UNIFY THE APPLICATION WITH THE OFFICIAL COMPANY BRAND

Official company website:

https://www.vsolutions.co/

Future application URL:

https://system.vsolutions.co/

The shipment management application must look and feel like an official product belonging to Vision & Solution.

### Step 1 — Brand Analysis

Inspect the existing company's public website.

Identify and document:

- Official company logo
- Primary brand colors
- Secondary brand colors
- Typography
- Button styles
- General visual language
- Corporate identity elements

Inspect existing public CSS files and website assets where accessible.

Do not guess brand colors if they can be extracted accurately.

If the official logo or assets are inaccessible, clearly report this rather than inventing replacements.

### Step 2 — Application Brand Integration

Apply the official corporate identity to the existing application.

Update:

1. Role-selection landing page.
2. Administrator dashboard.
3. Employee dashboard.
4. Shipment registration form.
5. Shipment details.
6. Reports.
7. Settings.
8. Sidebar and navigation.
9. Buttons and interactive elements.

Create reusable design tokens for brand colors, typography, and component styling.

Maintain:

- Modern SaaS appearance.
- Professional UI/UX.
- Excellent Arabic RTL support.
- Full English localization.
- Mobile responsiveness.
- Clear shipment status colors.

IMPORTANT:

The application must share the same identity as the company website, but it should NOT copy the marketing website's page structure.

Keep the currently approved application layout and workflows.

Preserve the excellent role-selection landing page.

Do not redesign the entire project again.

## TASK 2 — ADD DRIVER PHONE NUMBER

Add a new shipment field:

**Driver Phone Number**

Arabic label:

"رقم هاتف السائق"

English label:

"Driver Phone Number"

### Requirements

1. Place the field directly below or beside Driver Name in the shipment registration form.
2. Use an appropriate telephone input.
3. Support Saudi and international phone formats.
4. Allow values such as +9665XXXXXXXX.
5. Keep the field optional.
6. Validate supplied phone numbers without unnecessarily restricting legitimate international formats.
7. Store phone numbers as strings.
8. Display the phone number in shipment details.
9. Allow the employee who created the shipment to edit the phone number.
10. Allow administrators to view and edit phone numbers for all shipments.
11. Make the number clickable using a `tel:` link where appropriate.
12. Ensure the field works in Arabic and English.
13. Add the field to demo data and TypeScript shipment models.
14. Preserve compatibility with existing demo shipments that have no driver phone number.
15. Ensure browser-local persistence works after refreshing.

Do not implement SMS, WhatsApp messaging, or phone verification.

The phone number is intended for operational reference only.

Do not expose driver phone numbers to unauthorized employees.

## TASK 3 — PRESERVE ROLE SEPARATION

The system must continue supporting two distinct user experiences.

### ADMINISTRATOR

Can access:

- All shipments.
- Shipment management.
- Overdue alerts.
- Full operational reports.
- User management.
- System settings.
- Daily report configuration.
- Deleted shipment recovery.

### EMPLOYEE

Can access:

- Their own dashboard.
- Their own shipments.
- Add new shipment.
- Edit their own shipment.
- Update shipment status.
- View their own shipment details.

Employees must not access other employees' records or administrator functions.

Preserve the existing Admin/Employee selection screen for the demonstration environment.

IMPORTANT:

When production authentication is implemented in Phase 3, user roles must be verified by the backend rather than trusted from the frontend role selector.

## TASK 4 — PRESERVE ALL EXISTING FUNCTIONALITY

Do not break:

- Automatic shipment numbering.
- Automatic start timestamps.
- Manual completion dates.
- Pending status.
- Completed status.
- Automatic overdue status after 96 hours.
- Shipment reopening.
- Modification history.
- Admin-only soft deletion.
- Daily email report preview.
- Reports and exports.
- Arabic and English translations.
- Existing demo data.
- Responsive layouts.

## TASK 5 — QUALITY ASSURANCE

After implementing these changes:

1. Test the landing page.
2. Test both user roles.
3. Create a shipment containing a driver phone number.
4. Edit the phone number.
5. Verify phone number visibility.
6. Verify older shipments still work.
7. Test Arabic and English.
8. Verify mobile layouts.
9. Verify dashboard calculations.
10. Run TypeScript, lint, and production build checks.

Fix any regressions.

## TASK 6 — PREPARE FOR PHASE 3

After completing the improvements, inspect the project and prepare a short technical readiness report for production backend integration.

Recommend:

- Database schema.
- Authentication architecture.
- Role-based access control.
- Row-level security.
- Shipment persistence.
- Optional invoice storage.
- Audit logging.
- Daily email scheduling.

Do not begin connecting real production services yet.

Do not deploy.

Do not modify the company's public website.

Do not change DNS.

Do not push to GitHub without authorization.

### FINAL DELIVERABLE

Provide:

1. Updated branded interface.
2. Working driver phone field.
3. Screenshots of the improvements.
4. Test results.
5. Summary of changed files.
6. Phase 3 technical readiness recommendations.

Stop after completing Phase 2.6.

The objective is to finalize the user experience and prepare the application for a secure production backend.
