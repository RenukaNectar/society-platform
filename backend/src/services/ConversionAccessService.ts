import GeneralBodyMeeting from '../models/GeneralBodyMeetings';
import SpecialGeneralBoardMeeting from '../models/SpecialGeneralBoardMeeting';
import { AppError } from '../utils/errors';
import { findStatusByKey } from './StatusService';

const AGM_MEETING_TYPE = 'AGM';

export type ConversionMeetingEligibility = {
  hasApprovedAgm: boolean;
  hasApprovedSgbm: boolean;
  isEligible: boolean;
};

export const getConversionMeetingEligibility = async (
  societyId: string
): Promise<ConversionMeetingEligibility> => {
  const approvedStatus = await findStatusByKey('approved');
  if (!approvedStatus) {
    return { hasApprovedAgm: false, hasApprovedSgbm: false, isEligible: false };
  }

  const approvedAgm = await GeneralBodyMeeting.findOne({
    where: {
      society_id: societyId,
      meeting_type: AGM_MEETING_TYPE,
      status: approvedStatus.id,
    },
    attributes: ['id'],
  });

  const approvedSgbm = await SpecialGeneralBoardMeeting.findOne({
    where: {
      society_id: societyId,
      status: approvedStatus.id,
      active: true,
    },
    attributes: ['id'],
  });

  const hasApprovedAgm = Boolean(approvedAgm);
  const hasApprovedSgbm = Boolean(approvedSgbm);

  return {
    hasApprovedAgm,
    hasApprovedSgbm,
    isEligible: hasApprovedAgm || hasApprovedSgbm,
  };
};

export const assertConversionMeetingEligibility = async (societyId: string): Promise<void> => {
  const { isEligible } = await getConversionMeetingEligibility(societyId);
  if (!isEligible) {
    throw new AppError(
      'Conversion is not available until an AGM or SGBM has been conducted and approved by the competent authority.',
      403
    );
  }
};
