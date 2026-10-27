# VISION & SOLUTION — PHASE 2 UI/UX REDESIGN

## OBJECTIVE

The current Phase 2 shipment management application is functional or nearing completion.

I want to significantly improve its user interface and user experience.

I have attached three screenshots from an alternative prototype created using Gemini.

**These screenshots represent my preferred design direction.**

Your task is to redesign the existing application to closely match the visual appearance, layout, navigation, colors, and simplicity of the provided reference screenshots.

IMPORTANT: Do not rebuild the application from scratch.

Preserve the current functionality, data models, business rules, and existing React architecture.

## 1. DESIGN DIRECTION

Use the attached Gemini screenshots as the primary visual reference.

I strongly prefer this design over the current Codex interface.

Key design characteristics:

- Premium modern SaaS appearance.
- Purple as the primary brand accent.
- Orange/amber for important actions.
- White and light gray backgrounds.
- Dark navy sections for dashboard headers.
- Rounded cards and elegant borders.
- Modern typography.
- Minimal visual clutter.
- Clear operational information.
- Excellent Arabic RTL layout.
- Fully responsive design.

Use Cairo or Tajawal for Arabic and Inter for English.

Maintain Vision & Solution company branding.

## 2. LANDING PAGE — TOP PRIORITY

Create a beautiful role-selection landing page closely matching the first Gemini screenshot.

This is the first screen users should see when opening the prototype.

### Layout

Header:

- Vision & Solution logo and company name.
- Arabic/English language toggle.
- Light/dark mode button.

Centered heading:

Arabic:
"حدد هويتك للدخول إلى النظام"

English:
"Choose Your Account to Continue"

Below the heading, create two large elegant cards.

### ADMIN CARD

Display:

- Administrator icon.
- "دخول كمدير نظام"
- Short description of administrator capabilities.
- One administrator demo account.
- Clear login button.

### EMPLOYEE CARD

Display:

- Employee icon.
- "دخول كموظف"
- Short description.
- List of available demo employees.
- Each employee has a name, avatar, and login button.

Users can select any demo account to preview the corresponding dashboard.

The landing page must closely resemble the provided Gemini reference.

For this prototype, this is a demo role selector, not real authentication.

Production authentication will be implemented separately.

## 3. ADMIN DASHBOARD

Redesign the admin dashboard using the second Gemini screenshot as the primary reference.

### Sidebar

Position the sidebar on the RIGHT when Arabic is selected.

Position it on the LEFT when English is selected.

Navigation:

- Dashboard
- All Shipments
- My Shipments (when appropriate)
- Overdue Alerts
- Reports
- Daily Email Report
- User Management
- Settings
- Deleted Shipments / Restore

### Main Dashboard

Use a compact dark navy welcome banner.

Avoid the current oversized decorative hero section.

The main dashboard must immediately display operational information.

### Statistics Cards

Create four cards:

1. Total Shipments
2. Pending Shipments — Yellow
3. Completed Shipments — Green
4. Overdue Shipments — Red

Use clear icons and prominent numbers.

### Shipment Table

Display:

- Shipment ID
- Customer
- Route
- Truck
- Driver
- Start Date
- Status
- Created By
- Actions

Include search, filters, and sorting.

The design should closely resemble the Gemini dashboard.

## 4. EMPLOYEE DASHBOARD

Use the third Gemini screenshot as the main design reference.

This dashboard must be extremely simple.

### Header

Display:

- Company logo.
- Employee name.
- Language switcher.
- Theme switcher.
- Logout button.

### Welcome Section

Create a compact dark navy welcome banner.

Display a prominent orange button:

"إضافة نقلة جديدة"

### Statistics

Display:

- Pending shipments
- Completed shipments
- Overdue shipments

### My Shipments

Show shipments as clean cards.

Each shipment card should include:

- Shipment ID
- Customer
- Loading location
- Unloading location
- Truck number
- Driver name
- Shipment start date
- Colored status

Actions:

- View details
- Edit
- Mark completed
- Reopen when applicable

Employees can only see and edit their own shipments.

Only administrators can delete shipments.

Ensure excellent usability on mobile devices.

## 5. PRESERVE ALL EXISTING BUSINESS LOGIC

Do not remove or break:

- Automatic shipment IDs.
- Automatic shipment start timestamp when saved.
- Manual completion timestamp.
- Pending status.
- Completed status.
- Automatic overdue calculation after more than 96 hours.
- Employee-specific shipment visibility.
- Administrator privileges.
- Soft deletion and restoration.
- Optional invoice number and attachment.
- Daily report preview.
- Reporting and exports.
- Browser-local demo persistence.
- Arabic and English localization.

Do not reset shipment start timestamps when shipments are reopened.

## 6. MOBILE RESPONSIVENESS

The application must work beautifully on:

- Desktop
- Laptop
- Tablet
- Mobile phone

On mobile:

- Use a compact navigation menu.
- Display shipment information as cards.
- Keep primary actions easy to reach.
- Avoid horizontal overflow.
- Maintain proper Arabic RTL layout.

## 7. STRICT REQUIREMENTS

- Use the Gemini screenshots as the primary UI design reference.
- Preserve the existing application and business logic.
- Do not modify the public company website.
- Do not deploy.
- Do not connect production services.
- Do not implement real authentication yet.
- Do not change DNS settings.
- Do not push to GitHub without approval.

This is a UI/UX redesign of the current Phase 2 prototype, not a new project.

## 8. TESTING

After completing the redesign:

1. Verify the landing page.
2. Test the administrator demo login.
3. Test employee demo logins.
4. Confirm correct role-based data visibility.
5. Test shipment creation.
6. Test editing and completing shipments.
7. Test overdue status calculations.
8. Verify Arabic and English layouts.
9. Test mobile responsiveness.
10. Run TypeScript, lint, and build checks.

Provide screenshots of:

- Landing page
- Arabic admin dashboard
- Arabic employee dashboard
- English dashboard
- Mobile layout

Keep the local preview server accessible.

Stop after completing this redesign and report the results.

### FINAL DESIGN PRIORITY

The final application should visually resemble the Gemini screenshots as closely as practical while retaining the reliability and functionality of the existing Codex project.

**Design simplicity is essential.**

A nontechnical employee must be able to log in and register a shipment without training.
