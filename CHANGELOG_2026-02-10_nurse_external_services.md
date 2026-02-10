# Nurse Lab Schedule - Hide Actions for External Services - 2026-02-10

## Change Summary
**Hide "Start", "Assign to me", "Upload Result", and "Complete" buttons for external lab orders in the Nurse Lab Schedule page**

### Problem
The nurse lab schedule was showing action buttons (Start, Assign to me, Upload Result, Complete) for ALL lab orders, including external services from the `medical_services` table. These external services are performed outside the hospital, so nurses should not be able to start, assign, or complete them in the system.

### Solution
Updated the frontend to conditionally show action buttons based on the `is_external` field:
- **In-House Services** (`is_external = FALSE`): Show all action buttons
- **External Services** (`is_external = TRUE`): Hide action buttons and show a badge instead

### Changes Made

#### 1. Frontend Updates
**File**: `frontend/app/nurse/lab-schedule/page.tsx`

**Changes**:

1. **Added `is_external` field to `LabOrder` interface** (Line 73):
   ```typescript
   interface LabOrder {
       // ... other fields
       is_external: boolean; // TRUE = external (medical_services), FALSE = in-house (billing_master)
   }
   ```

2. **Updated "Ordered" status actions** (Lines 478-509):
   - Only show "Start" and "Assign to me" buttons if `!order.is_external`
   - Show "External Service" badge for external orders
   ```typescript
   {order.status === 'Ordered' && !order.is_external && (
       <>
           <button onClick={() => updateStatus(order.order_id, 'In-Progress')}>
               Start
           </button>
           {!order.nurse_name && (
               <button onClick={() => assignToMe(order.order_id)}>
                   Assign to me
               </button>
           )}
       </>
   )}
   {order.status === 'Ordered' && order.is_external && (
       <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold border border-amber-200">
           External Service
       </span>
   )}
   ```

3. **Updated "In-Progress" status actions** (Lines 510-537):
   - Only show "Upload Result" and "Complete" buttons if `!order.is_external`
   - Show "External Service - In Progress" badge for external orders
   ```typescript
   {order.status === 'In-Progress' && !order.is_external && (
       <>
           <button onClick={() => setShowUploadModal(order)}>
               Upload Result
           </button>
           <button onClick={() => updateStatus(order.order_id, 'Completed')}>
               Complete
           </button>
       </>
   )}
   {order.status === 'In-Progress' && order.is_external && (
       <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold border border-amber-200">
           External Service - In Progress
       </span>
   )}
   ```

#### 2. Backend (Already Updated)
The backend was already updated in the previous migration:
- `lab_orders` table now has `is_external` boolean column
- `consultationController.js` sets `is_external` correctly when creating lab orders
- `LabOrder.findByBranch()` automatically includes `is_external` in the query results

### User Experience

#### For In-House Services (is_external = FALSE):
- **Pending Tab**: Shows "Start" button and "Assign to me" button
- **In Progress Tab**: Shows "Upload Result" and "Complete" buttons
- Nurses can fully manage these orders

#### For External Services (is_external = TRUE):
- **Pending Tab**: Shows "External Service" badge (amber/yellow)
- **In Progress Tab**: Shows "External Service - In Progress" badge
- No action buttons available
- Nurses can view but not interact with these orders

### Benefits
1. ✅ **Prevents Errors**: Nurses can't accidentally start/complete external services
2. ✅ **Clear Visual Distinction**: Badges clearly identify external services
3. ✅ **Workflow Accuracy**: Only in-house services can be managed by nurses
4. ✅ **Data Integrity**: Prevents incorrect status updates for external orders
5. ✅ **Better UX**: Clear indication of which services are external

### Testing Checklist
- [ ] Verify in-house lab orders show action buttons
- [ ] Verify external lab orders show badges instead of buttons
- [ ] Test "All Orders" tab
- [ ] Test "Pending" tab
- [ ] Test "In Progress" tab
- [ ] Verify badges display correctly for external services
- [ ] Ensure completed external orders display properly

### Screenshots Reference
See user-provided screenshot showing the lab schedule with Start/Assign buttons that should be hidden for external services.

---
**Date**: 2026-02-10
**Author**: Antigravity AI
**Priority**: High (Workflow Critical)
**Status**: ✅ Completed
**Related**: CHANGELOG_2026-02-10_lab_orders_is_external.md
