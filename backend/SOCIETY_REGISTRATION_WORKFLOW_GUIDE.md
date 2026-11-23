# Society Registration Workflow - Step by Step Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Workflow Setup](#workflow-setup)
3. [API Endpoints](#api-endpoints)
4. [Complete Flow](#complete-flow)
5. [Examples](#examples)

---

## 1. Prerequisites

### 1.1 Statuses Setup
Ensure these statuses exist in your database (already seeded via `20240101000018-default-statuses.js`):

- `application_submitted` - Initial status when application is submitted
- `drcs_district_forwarded` - DRCS district level approval
- `drcs_district_rejected` - DRCS district level rejection
- `sics_district_forwarded` - SICS district level approval
- `sics_district_rejected` - SICS district level rejection
- `registrar_approved` - Final approval by registrar
- `registrar_rejected` - Final rejection by registrar
- `approved` - Final approved status
- `rejected` - Final rejected status

### 1.2 Roles Setup
Ensure these roles exist (already seeded via `20240101000001-default-roles.js`):

- `applicant` - Society applicant
- `field_inspector` - Field inspector
- `senior_inspector` - Senior inspector
- `arcs` - ARCS role
- `deputy_registrar` - Deputy Registrar
- `joint_registrar` - Joint Registrar
- `registrar` - Registrar

### 1.3 Module Setup
Create a module for society registration:

**API Call:**
```bash
POST /api/v1/master-data/modules
{
  "name": "Society Registration",
  "key": "society_registration",
  "description": "Society registration workflow module",
  "active": true
}
```

**Or via Database:**
```sql
INSERT INTO modules (id, name, key, description, active, created_at, updated_at)
VALUES (UUID(), 'Society Registration', 'society_registration', 'Society registration workflow', true, NOW(), NOW());
```

---

## 2. Workflow Setup

### 2.1 Create Module Workflows

You need to create workflow steps in sequence. Each step defines:
- **Sequence**: Order of approval (1, 2, 3...)
- **Allowed Role**: Which role can approve this step
- **Approval Status**: Status after approval
- **Reject Status**: Status after rejection
- **Notification Settings**: Who gets notified

**Example Workflow Configuration:**

#### Step 1: Field Inspector Review
```json
{
  "module_id": "<society_registration_module_id>",
  "sequence": 1,
  "allowed_role_id": "<field_inspector_role_id>",
  "approval_status_id": "<drcs_district_forwarded_status_id>",
  "reject_status_id": "<drcs_district_rejected_status_id>",
  "approval_send_to": "single",
  "reject_send_to": "single",
  "is_hq": false,
  "active": true
}
```

#### Step 2: DRCS District Approval
```json
{
  "module_id": "<society_registration_module_id>",
  "sequence": 2,
  "allowed_role_id": "<arcs_role_id>",
  "approval_status_id": "<sics_district_forwarded_status_id>",
  "reject_status_id": "<drcs_district_rejected_status_id>",
  "approval_send_to": "single",
  "reject_send_to": "single",
  "is_hq": false,
  "active": true
}
```

#### Step 3: SICS District Approval
```json
{
  "module_id": "<society_registration_module_id>",
  "sequence": 3,
  "allowed_role_id": "<deputy_registrar_role_id>",
  "approval_status_id": "<registrar_approved_status_id>",
  "reject_status_id": "<sics_district_rejected_status_id>",
  "approval_send_to": "single",
  "reject_send_to": "single",
  "is_hq": false,
  "active": true
}
```

#### Step 4: Registrar Final Approval
```json
{
  "module_id": "<society_registration_module_id>",
  "sequence": 4,
  "allowed_role_id": "<registrar_role_id>",
  "approval_status_id": "<approved_status_id>",
  "reject_status_id": "<registrar_rejected_status_id>",
  "approval_send_to": "all",
  "reject_send_to": "single",
  "is_hq": false,
  "active": true
}
```

**API to Create Workflow:**
```bash
POST /api/v1/master-data/module-workflows
Authorization: Bearer <token>
Content-Type: application/json

{
  "module_id": "uuid",
  "sequence": 1,
  "allowed_role_id": "uuid",
  "approval_status_id": "uuid",
  "reject_status_id": "uuid",
  "approval_send_to": "single",
  "reject_send_to": "single",
  "is_hq": false,
  "active": true
}
```

---

## 3. API Endpoints

### 3.1 Update Workflow Status
**Endpoint:** `POST /api/v1/workflows/update`

**Request Body:**
```json
{
  "societyId": "society-123",
  "moduleName": "society_registration",
  "action": "approve",  // or "reject" or "back"
  "comments": "Approved by field inspector",
  "districtId": "optional-district-uuid",
  "stateId": "optional-state-uuid",
  "isHq": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Workflow status updated successfully",
  "data": {
    "success": true,
    "message": "Workflow approve completed successfully",
    "currentStatus": "drcs_district_forwarded",
    "nextWorkflowId": "workflow-uuid",
    "nextStatus": "sics_district_forwarded",
    "notificationSent": true,
    "historyRecordId": "history-uuid"
  }
}
```

### 3.2 Get Workflow Status
**Endpoint:** `GET /api/v1/workflows/:societyId/status?moduleName=society_registration&isHq=false`

**Response:**
```json
{
  "success": true,
  "message": "Workflow status retrieved successfully",
  "data": {
    "currentWorkflow": {
      "id": "uuid",
      "sequence": 1,
      "allowedRole": { "name": "field_inspector" },
      "approvalStatus": { "key": "drcs_district_forwarded" }
    },
    "nextWorkflow": { ... },
    "previousWorkflow": null,
    "currentStatus": { "key": "application_submitted" }
  }
}
```

---

## 4. Complete Flow

### Step-by-Step Society Registration Workflow

#### **Step 1: Create Society Registration**
```bash
POST /api/v1/society-registrations
{
  "society_id": "society-123",
  "cooperative_society_name": "ABC Cooperative Society",
  "district_id": "district-uuid",
  "status": "<application_submitted_status_id>",
  ...
}
```

**What happens:**
- Society record created with status `application_submitted`
- Society is ready for workflow processing

---

#### **Step 2: Field Inspector Reviews (Sequence 1)**

**Get Current Status:**
```bash
GET /api/v1/workflows/society-123/status?moduleName=society_registration
```

**Approve:**
```bash
POST /api/v1/workflows/update
{
  "societyId": "society-123",
  "moduleName": "society_registration",
  "action": "approve",
  "comments": "Documents verified, approved by field inspector"
}
```

**What happens:**
- Status changes to `drcs_district_forwarded`
- Moves to next workflow step (Sequence 2)
- Notification sent to DRCS (ARCS role) user
- History record created

**Reject:**
```bash
POST /api/v1/workflows/update
{
  "societyId": "society-123",
  "moduleName": "society_registration",
  "action": "reject",
  "comments": "Incomplete documents, please resubmit"
}
```

**What happens:**
- Status changes to `drcs_district_rejected`
- Notification sent back to applicant
- History record created

---

#### **Step 3: DRCS District Approval (Sequence 2)**

**Approve:**
```bash
POST /api/v1/workflows/update
{
  "societyId": "society-123",
  "moduleName": "society_registration",
  "action": "approve",
  "comments": "Approved by DRCS district officer"
}
```

**What happens:**
- Status changes to `sics_district_forwarded`
- Moves to next workflow step (Sequence 3)
- Notification sent to SICS (Deputy Registrar) user
- History record created

---

#### **Step 4: SICS District Approval (Sequence 3)**

**Approve:**
```bash
POST /api/v1/workflows/update
{
  "societyId": "society-123",
  "moduleName": "society_registration",
  "action": "approve",
  "comments": "Approved by SICS district officer"
}
```

**What happens:**
- Status changes to `registrar_approved`
- Moves to next workflow step (Sequence 4)
- Notification sent to Registrar user
- History record created

---

#### **Step 5: Registrar Final Approval (Sequence 4)**

**Approve:**
```bash
POST /api/v1/workflows/update
{
  "societyId": "society-123",
  "moduleName": "society_registration",
  "action": "approve",
  "comments": "Final approval granted by Registrar"
}
```

**What happens:**
- Status changes to `approved` (final status)
- Workflow completed (no next step)
- Notification sent to all relevant users
- History record created

---

## 5. Examples

### Example 1: Complete Approval Flow

```bash
# 1. Create Society
POST /api/v1/society-registrations
{
  "society_id": "society-123",
  "cooperative_society_name": "Test Society",
  "status": "<application_submitted_status_id>"
}

# 2. Field Inspector Approves
POST /api/v1/workflows/update
{
  "societyId": "society-123",
  "moduleName": "society_registration",
  "action": "approve",
  "comments": "Field inspection completed"
}

# 3. DRCS Approves
POST /api/v1/workflows/update
{
  "societyId": "society-123",
  "moduleName": "society_registration",
  "action": "approve",
  "comments": "DRCS approval granted"
}

# 4. SICS Approves
POST /api/v1/workflows/update
{
  "societyId": "society-123",
  "moduleName": "society_registration",
  "action": "approve",
  "comments": "SICS approval granted"
}

# 5. Registrar Final Approval
POST /api/v1/workflows/update
{
  "societyId": "society-123",
  "moduleName": "society_registration",
  "action": "approve",
  "comments": "Final approval granted"
}
```

### Example 2: Rejection Flow

```bash
# Field Inspector Rejects
POST /api/v1/workflows/update
{
  "societyId": "society-123",
  "moduleName": "society_registration",
  "action": "reject",
  "comments": "Missing required documents"
}

# Status becomes: drcs_district_rejected
# Notification sent to applicant
# Applicant can resubmit and start again
```

### Example 3: Move Back (Back Action)

```bash
# Move back to previous step
POST /api/v1/workflows/update
{
  "societyId": "society-123",
  "moduleName": "society_registration",
  "action": "back",
  "comments": "Need to review previous step"
}

# Status moves back to previous workflow step
```

---

## 6. Workflow Status Flow Diagram

```
[Application Submitted]
        ↓
[Field Inspector Review] (Sequence 1)
        ↓
    Approve? → [DRCS District Forwarded]
        ↓
[DRCS District Approval] (Sequence 2)
        ↓
    Approve? → [SICS District Forwarded]
        ↓
[SICS District Approval] (Sequence 3)
        ↓
    Approve? → [Registrar Approved]
        ↓
[Registrar Final Approval] (Sequence 4)
        ↓
    Approve? → [APPROVED] ✅
    
    Reject? → [Rejected Status] ❌
```

---

## 7. Important Notes

### 7.1 Status Matching
- The workflow system matches society's current `status` with workflow's `approval_status_id`
- Make sure status IDs match correctly in workflow configuration

### 7.2 Notifications
- `approval_send_to: "single"` - Sends to first user of next step's role
- `approval_send_to: "all"` - Sends to all users with next step's role
- Notifications are sent based on district/state filters

### 7.3 History Tracking
- All workflow actions are tracked in `history` table
- History includes: action type, comments, user, timestamp

### 7.4 Module Name
- Use module `key` (e.g., `"society_registration"`) in API calls
- Module must be active in database

### 7.5 District/State Filtering
- If `districtId` or `stateId` provided, notifications filtered by location
- If not provided, uses society's district/state automatically

---

## 8. Troubleshooting

### Issue: "Current workflow step not found"
**Solution:** 
- Check if society has a valid status
- Verify workflow configuration exists for that status
- Ensure module workflows are properly configured

### Issue: "Module not found"
**Solution:**
- Verify module exists with correct `key`
- Check if module is active

### Issue: "No users found for notification"
**Solution:**
- Verify users exist with required roles
- Check district/state matching
- Ensure users are active

---

## 9. Testing Checklist

- [ ] Module created and active
- [ ] Statuses exist in database
- [ ] Roles exist in database
- [ ] Workflow steps configured (Sequence 1, 2, 3, 4...)
- [ ] Users exist with required roles
- [ ] Society created with initial status
- [ ] Workflow API endpoints accessible
- [ ] Notifications working
- [ ] History tracking working

---

## 10. Quick Reference

**Update Workflow:**
```bash
POST /api/v1/workflows/update
{
  "societyId": "society-id",
  "moduleName": "society_registration",
  "action": "approve|reject|back",
  "comments": "Optional comments"
}
```

**Get Workflow Status:**
```bash
GET /api/v1/workflows/{societyId}/status?moduleName=society_registration
```

**Create Society:**
```bash
POST /api/v1/society-registrations
{
  "society_id": "unique-id",
  "status": "<initial_status_id>",
  ...
}
```

---

**End of Guide**
