# BOD + AGM Test Scenarios (Step-wise)

## Pre-Setup

1. Start backend on `http://localhost:3000`.
2. Start frontend on `http://localhost:5173`.
3. Ensure migrations are applied.
4. Ensure BOD workflow seeder is executed.
5. Keep one valid test user for login (applicant/admin).

---

## TC-01: AGM Create With Elected BOD Members (Happy Path)

### Steps
1. Login to frontend.
2. Open AGM module and click Create/New.
3. Fill required AGM details.
4. In elected BOD members section, select 7 to 21 members.
5. Ensure at least 2 women are selected.
6. Ensure co-opted members are maximum 2.
7. Submit AGM.

### Expected
- AGM created successfully.
- Success toast/message is shown.
- AGM list/detail shows elected BOD members.

---

## TC-02: AGM Validation - Member Count Below 7

### Steps
1. Open AGM form.
2. Select only 6 elected BOD members.
3. Try to submit.

### Expected
- Form submission blocked.
- Validation message for min member count appears.

---

## TC-03: AGM Validation - Member Count Above 21

### Steps
1. Open AGM form.
2. Select 22 elected BOD members.
3. Try to submit.

### Expected
- Form submission blocked.
- Validation message for max member count appears.

---

## TC-04: AGM Validation - Women Seats Rule

### Steps
1. Open AGM form.
2. Select valid total members but less than 2 women.
3. Try to submit.

### Expected
- Submission blocked.
- Validation message for minimum 2 women appears.

---

## TC-05: AGM Validation - Co-opted Limit

### Steps
1. Open AGM form.
2. Select valid total members.
3. Mark more than 2 as co-opted.
4. Try to submit.

### Expected
- Submission blocked.
- Validation message for co-opted limit appears.

---

## TC-06: BOD Meeting Create (Happy Path)

### Steps
1. Open BOD Meetings module.
2. Click Create/New meeting.
3. Fill society and meeting details.
4. Attach required documents:
   - Meeting Notice
   - Meeting Minutes
   - Attendance Sheet
5. Submit.

### Expected
- BOD meeting created successfully.
- Record visible in BOD list.
- Initial status should be Submitted.

---

## TC-07: BOD Validation - Missing Required Documents

### Steps
1. Open BOD create form.
2. Fill all text fields.
3. Skip one or more required documents.
4. Submit.

### Expected
- Submission blocked.
- Field-level/document validation errors displayed.

---

## TC-08: BOD Validation - Invalid Board Count

### Steps
1. Open BOD create form.
2. Enter board count < 7 or > 21.
3. Submit.

### Expected
- Submission blocked.
- Proper count validation message appears.

---

## TC-09: BOD List Chronological Order

### Steps
1. Create at least 2 BOD meetings at different times.
2. Open BOD list.

### Expected
- Latest meeting appears first.
- Meeting data in list matches submitted data.

---

## TC-10: BOD Detail + Workflow Metadata

### Steps
1. Open created BOD meeting detail page.
2. Observe workflow information section.
3. Verify attached documents are visible/openable.

### Expected
- Workflow current/next step visible.
- Status badge shown correctly.
- All uploaded docs accessible.

---

## TC-11: BOD Workflow Approve Action

### Steps
1. Login with role allowed to approve current step.
2. Open BOD detail.
3. Click Approve and add comment.

### Expected
- Workflow moves to next step.
- Status changes from Submitted to Forwarded (or as configured).
- Action reflected in history/comments.

---

## TC-12: BOD Workflow Reject Action

### Steps
1. Login with role allowed to reject current step.
2. Open BOD detail.
3. Click Reject and add comment.

### Expected
- Status changes to Rejected.
- Record remains visible as per role access.
- Reject comment stored and displayed.

---

## TC-13: Role-Based Access Check

### Steps
1. Login as Applicant.
2. Check own records and other users' records.
3. Repeat with district-level role.
4. Repeat with admin role.

### Expected
- Applicant sees only own records.
- District role sees district-allowed records.
- Admin sees all records.

---

## TC-14: Regression Smoke

### Steps
1. Run AGM create flow.
2. Run BOD create flow.
3. Open AGM and BOD lists/details.
4. Run one workflow action.

### Expected
- No crash or API 500.
- Data integrity remains correct.
- Status color/badge rendering is correct.

---

## Result Template (for each test case)

- Test Case ID:
- Date/Time:
- Tester:
- Preconditions:
- Steps Executed:
- Actual Result:
- Expected Result:
- Status: Pass/Fail
- Remarks/Screenshot:
