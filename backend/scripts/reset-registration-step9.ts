/**
 * Reset a society registration to workflow step 9 (applicant challan) for E2E testing.
 * Usage: npx ts-node --transpile-only scripts/reset-registration-step9.ts [registrationId]
 */
import dotenv from 'dotenv';
dotenv.config();

import SocietyRegistration from '../src/models/SocietyRegistration';
import { findStatusByKey } from '../src/services/StatusService';
import { getWorkflowIdByModuleAndSequence } from '../src/services/WorkflowUtilService';

const REG_ID = process.argv[2] || '58ffe477-c381-4007-81da-9f4dbb42789f';

(async () => {
  const challanPending = await findStatusByKey('challan_pending');
  const wf9 = await getWorkflowIdByModuleAndSequence('SOCIETY_REGISTRATION', 9);
  if (!challanPending?.id || !wf9) {
    throw new Error('challan_pending status or workflow step 9 not found');
  }

  const reg = await SocietyRegistration.findByPk(REG_ID);
  if (!reg) {
    throw new Error(`Registration not found: ${REG_ID}`);
  }

  const applicantId = reg.created_by;
  if (!applicantId) {
    throw new Error('Registration has no created_by (applicant)');
  }

  await reg.update({
    status: challanPending.id,
    workflow_status: wf9,
    assigned_to_user_id: applicantId,
  });

  console.log('Reset OK:', {
    registrationId: REG_ID,
    status: 'challan_pending',
    workflow_sequence: 9,
    assigned_to_user_id: applicantId,
  });
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
