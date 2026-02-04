# Changelog - 2026-02-03

## Miscellaneous Updates

### Modified Files

#### Frontend
1. **`frontend/app/doctor/patients/[id]/page.tsx`**
   - **Change**: Renamed "AI Clinical Scribe" to "Clinical Scribe" (Removed "AI").
   - **Author**: User (Manual Edit)

2. **`frontend/app/doctor/appointments/page.tsx`**
   - **Change**: Enhanced "Live Patient Stream" to prioritize MLC (Medical Legal Case) patients.
   - **Details**:
     - Auto-sorting MLC cases to the top of the queue.
     - Distinct "High Priority" UI styling for MLC cards (Red theme, pulsing indicators, Priority badges).
     - Futuristic glassmorphism retained with alert accents.
     - Updated "Upcoming Schedule" list:
       - Displays specific date alongside time.
       - Highlights "Missed" appointments (past time today) with red styling and alerts.
       - Enforced strict database date usage for all appointments (no random dates).
       - Fixed timezone offset issue where dates were shifting back by 1 day (e.g., Feb 5 becoming Feb 4) by using local date interpretation instead of UTC.

3. **`frontend/app/doctor/dashboard/page.tsx`**
   - **Change**: Enhanced "Patient Queue" widget to prioritize MLC patients.
   - **Details**:
     - Applied MLC priority sorting logic (MLC cases appear first).
     - Added visual highlights for MLC cases: Red background tint, pulsing status dot, and "PRIORITY" badge.
     - Updated wait time display to highlight urgency for MLC cases.
     - Changed default text from "No complaint" to "Emergency" for MLC cases without a specific complaint.

4. **`frontend/app/doctor/patients/[id]/page.tsx`**
   - **Feature**: Lab Orders Search "Auto-Fill"
     - **Details**: Clicking a search result now auto-fills the search input for verification before adding.
     - **Fix**: Resolved issue where clicking a result didn't populate the input (switched `onClick` to `onMouseDown` to prevent focus loss).
   - **Feature**: Prescription Pad "Before/After Food" Toggle
     - **Details**: Added a toggle switch (A/F | B/F) to allow prescribing medication "Before Food".
   - **Fix**: Resolved "uncontrolled input" console error in prescription checkboxes.
   - **UI Upgrade**: "Patient Referral" Section
     - **Details**: Completely redesigned with a futuristic, glassmorphism UI.
     - **Style**: Gradient glow effects, custom-styled dropdowns, and cleaner typography.
     - **Update**: Changed background to solid white (removed pink gradient) for a cleaner aesthetic.
   - **UI Refinement**: "Next Visit" Section
     - **style**: Overhauled design with improved spacing, rounded `bg-slate-50` inputs, and custom dropdowns.
     - **Cleanup**: Removed redundant "Save Draft" and "Complete Consultation" buttons from this section.
   - **Fix**: Resolved build errors (syntax issues) in the Doctor Patient page.
   - **Feature Update**: "Next Visit" Date Picker
     - **Validation**: Restricted date selection to allow only future dates (tomorrow onwards).
   - **UI Standardization**: Typography & Inputs
     - **Font**: Unified all section headers ("Referral", "Deceased", etc.) to a consistent `text-sm font-bold uppercase` style.
     - **Inputs**: Applied consistent rounded styling and focus states to Clinical Notes, Diagnosis, and Lab search inputs.
   - **UI Redesign**: Patient Card Footer
     - **Style**: Redesigned Contact/Address/Blood Group section with a clean grey background, icon boxes, and improved spacing.
   - **UI Enhancement**: Death Intimation Section
     - **Style**: Updated "Cause of Death" and "History/Circumstances" fields with premium styling (uppercase labels, rounded inputs with focus rings).
   - **Feature**: Collapsible Patient Referral Section
     - **Behavior**: Added checkbox control - referral fields now only expand when checkbox is checked.
     - **UX**: Matches the "Patient Deceased?" section pattern for consistency.
   - **Enhancement**: Death Intimation Auto-Fill
     - **Feature**: "Declared Dead By" field now auto-fills with logged-in doctor's name AND registration number.
     - **Format**: "Dr. [First Name] [Last Name] (Reg. No: [Registration Number])"
   - **UI Enhancement**: Custom Alert Modal
     - **Feature**: Replaced browser's default alert() with a beautiful, modern custom modal.
     - **Design**: Glassmorphism with gradient headers, smooth animations (fadeIn, slideUp), and color-coded states.
     - **States**: Success (green), Error (red), Info (blue) with corresponding icons and styling.
     - **UX**: Backdrop blur, centered layout, responsive design, and hover/active button effects.
   - **Bug Fix**: Death Details Update Error
     - **Issue**: Fixed 500 error when completing consultation with patient deceased checkbox checked.
     - **Solution**: Filtered out empty fields and properly formatted datetime values before sending to backend.
     - **Impact**: Death intimation data now saves correctly without errors.
