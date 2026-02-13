# UI Color Update - Beige/Sandal Layouts - 2026-02-11

## Objective
Change the background color of all major layout containers on the Doctor Consultation Page from White (`bg-white`) to Beige/Sandal (`bg-amber-50`) as requested by the user.

## Changes Implemented
- **Patient Identity Card (Top)**: Changed `bg-white` to `bg-amber-50`, updated shadows and borders to match (`amber-100`, `amber-200`). Updated internal gradient to `amber-100/50` to `orange-100/50`.
- **Patient Summary Grid (Middle)**: Changed `bg-white` to `bg-amber-50`, updated shadows.
- **Quick History Panel (Left)**: Changed `glass-panel` (white-ish) to `bg-amber-50`.
- **Consultation Workspace (Right)**: Changed `glass-panel`/`bg-white/40` to `bg-amber-50`, updated shadows and borders.

## Rationale
User requested a "sandal or beige color" for the layout backgrounds instead of the standard white, to create a warmer aesthetic.

## Files Modified
- `frontend/app/doctor/patients/[id]/page.tsx`
