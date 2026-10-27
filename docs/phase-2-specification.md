# PHASE 2 — VISION & SOLUTION SHIPMENT MANAGEMENT SYSTEM

## Objective

Phase 1 has been completed successfully.

Now proceed with **Phase 2: Premium Interactive Frontend Prototype**.

You must preserve the existing project foundation, design system, localization, navigation, and architecture.

Do not rebuild the project from scratch.

The goal is to transform the current static application shell into a beautiful, realistic, and interactive shipment management system.

Company: **Vision & Solution**

Website: https://www.vsolutions.co/

Future application URL: system.vsolutions.co

## 1. IMPORTANT DESIGN IMPROVEMENTS

Improve the existing UI with the following priorities:

- Keep the premium corporate visual identity.
- Maintain the existing dark teal, cyan, and white design direction.
- Reduce the size of the large dashboard hero banner.
- Prioritize operational statistics over decorative elements.
- Give overdue shipments prominent visibility.
- Use elegant status badges with colors and icons.
- Improve table readability and information density.
- Ensure excellent responsiveness on desktop, tablet, and mobile.
- Maintain complete Arabic and English localization.
- Ensure proper RTL layout when Arabic is selected.

The final appearance should resemble a polished commercial SaaS logistics application.

Avoid generic admin templates.

## 2. USER ROLES

Implement two prototype experiences:

### Administrator

Administrator can:

- View all shipments.
- Create shipments.
- Edit all shipments.
- Change shipment statuses.
- Delete and restore shipments using soft deletion.
- View reports.
- View overdue alerts.
- Manage demo users.
- Configure daily email report recipients.

### Employee

Employee can:

- View their own shipments only.
- Create shipments.
- Edit their own shipments.
- Change their own shipment statuses.
- Mark shipments as completed.
- Reopen completed shipments.
- Enter invoice information.

Employees cannot delete shipments or access administrator-only features.

Create a demo role selector so both experiences can be tested easily.

This is prototype authorization only, not production security.

## 3. EMPLOYEE DASHBOARD

Create a clean, easy-to-use employee dashboard.

Display:

- My total shipments
- Pending shipments
- Completed shipments
- Overdue shipments
- A prominent "Add New Shipment" button
- Searchable shipment list
- Colored status badges

Mobile usability is extremely important.

Employees must be able to create shipments quickly with minimal clicks.

## 4. ADD NEW SHIPMENT

Create an interactive shipment registration form.

Fields:

1. Customer Name — Required
2. Loading Location — Required
3. Unloading Location — Required
4. Truck Number — Required
5. Driver Name — Required
6. Cargo Description — Required
7. Invoice Number — Optional
8. Invoice Image — Optional
9. Notes — Optional

The invoice image is a low-priority convenience feature.

Do not build a complex document management system.

When saving:

- Generate a unique shipment ID (TR-0001, TR-0002, etc.).
- Automatically record the shipment start date and time.
- Automatically associate the record with the current demo user.
- Set its initial workflow status to Pending.
- Display a success message.
- Update the dashboard immediately.

Do not request a manually entered start date from the employee.

## 5. SHIPMENT STATUS SYSTEM

Implement the following logic:

### Pending — Yellow

Arabic: في الانتظار

The shipment is open and has not exceeded 96 hours.

### Completed — Green

Arabic: تمت النقلة

The employee manually marks the shipment as completed.

Require a completion date and time.

Allow the employee to edit that date and time.

Validate that the completion timestamp is not before shipment start or in the future.

### Overdue — Red

Arabic: متأخرة

Automatically displayed when more than 96 hours have elapsed since the shipment started and the shipment is still open.

Overdue must be calculated automatically.

The employee does not manually select the Overdue status.

Allow completed shipments to be reopened.

Reopening must retain the original start timestamp and recalculate overdue status.

Store the underlying workflow status separately from the automatically calculated overdue indicator.

## 6. ADMIN DASHBOARD

The administrator dashboard should include:

### Statistics

- Total shipments
- Pending shipments
- Completed shipments
- Overdue shipments

### Shipment Management

A professional table containing:

- Shipment ID
- Customer
- Origin
- Destination
- Truck
- Driver
- Start Date
- Status
- Created By
- Actions

Include search, filtering, sorting, and pagination.

### Overdue Alerts

Create a prominent section showing overdue shipments.

Display the shipment ID, customer, truck, driver, start time, and overdue duration.

### Shipment Details

Allow the administrator to open and inspect each shipment.

Include a simple change-history view.

## 7. REPORTS

Create an interactive reporting page.

Include:

- Shipment totals
- Status distribution
- Completed shipments
- Pending shipments
- Overdue shipments
- Date filters
- Customer filters
- Employee filters

Add professional charts where useful.

Implement basic CSV export compatible with Excel.

Provide a print-friendly report layout that can be saved as PDF through the browser.

Do not introduce accounting or financial modules.

## 8. DAILY EMAIL REPORT PREVIEW

Create a page that demonstrates the future daily report.

Schedule for production:

08:00 AM — Asia/Riyadh.

The report must include:

- Vision & Solution branding.
- The previous calendar day's shipment activity.
- Shipments started yesterday.
- Shipments completed yesterday.
- All currently open overdue shipments.
- A summary of outstanding shipments.
- A link to the administrator dashboard.

Create a realistic email preview.

The administrator should be able to add or remove recipient email addresses in prototype settings.

Do not send actual emails.

## 9. DEMO DATA

Generate at least 25 realistic fictional shipment records.

Include:

- Different customers.
- Different employees.
- Different trucks.
- Different drivers.
- Saudi cities as origins and destinations.
- Pending shipments.
- Completed shipments.
- Overdue shipments.
- Some shipments completed late.

Use local browser persistence for prototype data.

Ensure created or edited shipments remain available after refreshing the browser.

Provide a demo reset option.

Do not connect any external database.

Do not use real customer information.

## 10. SIDEBAR NAVIGATION

Keep navigation focused on the approved project scope.

Recommended sections:

ADMIN:

- Dashboard
- All Shipments
- Overdue Alerts
- Reports
- User Management
- Settings

EMPLOYEE:

- Dashboard
- My Shipments
- Add Shipment

Do not implement full fleet-management, maintenance, accounting, or customer CRM modules.

Truck, driver, and customer names can remain simple shipment fields.

## 11. QUALITY AND TESTING

Ensure:

- All main navigation links work.
- Employee and administrator dashboards are accessible.
- Shipment creation works.
- Editing works.
- Status changes update dashboards correctly.
- Automatic overdue calculations work.
- Soft deletion and restoration work for administrators.
- Employee access is correctly limited within the demo.
- Arabic and English translations work.
- RTL/LTR layouts work.
- Mobile layouts are usable.
- No blank pages or runtime errors appear.

Run:

- TypeScript checks
- Lint
- Production build

If browser testing is available, test both languages and both user roles.

## 12. STRICT CONSTRAINTS

Do not:

- Modify the existing company website.
- Deploy the application.
- Change DNS records.
- Connect Supabase.
- Configure real authentication.
- Send real emails.
- Connect external production services.
- Implement payment or accounting features.
- Push changes to GitHub without approval.
- Start Phase 3.

Keep the project entirely local and prototype-based.

## 13. FINAL DELIVERABLE

At the end of Phase 2:

1. Provide a working interactive frontend prototype.
2. Explain how to open the application.
3. Provide screenshots of the employee and administrator dashboards.
4. Show Arabic and English previews.
5. Explain which features are functional and which remain simulated.
6. Report the results of available tests.
7. Identify any outstanding bugs or limitations.
8. Stop and wait for approval before proceeding to Phase 3.

Focus on premium UI/UX, operational simplicity, and reliable interactive behavior.
