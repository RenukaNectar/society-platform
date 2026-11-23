import { useCallback, useEffect, useState } from "react";
import { getAnnualGeneralMeetings } from "../../lib/data/annualGeneralMeetings/api";
import { getSpecialAnnualGeneralMeetings } from "../../lib/data/specialAnnualGeneralMeetings/api";
import { getMySociety } from "../../lib/data/users/api";

export type ConversionMeetingEligibility = {
  hasApprovedAgm: boolean;
  hasApprovedSgbm: boolean;
  isEligible: boolean;
  societyId: string | null;
  loading: boolean;
};

const isApprovedMeeting = (meeting: any): boolean =>
  meeting?.statusDetails?.key === "approved";

export const useConversionMeetingEligibility = (
  enabled = true,
): ConversionMeetingEligibility => {
  const [state, setState] = useState<ConversionMeetingEligibility>({
    hasApprovedAgm: false,
    hasApprovedSgbm: false,
    isEligible: false,
    societyId: null,
    loading: Boolean(enabled),
  });

  const load = useCallback(async () => {
    if (!enabled) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    try {
      const societyRes = await getMySociety();
      const societyId = societyRes?.data?.society?.id ?? null;

      if (!societyId) {
        setState({
          hasApprovedAgm: false,
          hasApprovedSgbm: false,
          isEligible: false,
          societyId: null,
          loading: false,
        });
        return;
      }

      const [agmRes, sgbmRes] = await Promise.all([
        getAnnualGeneralMeetings({ page: 1, limit: 100, society_id: societyId }),
        getSpecialAnnualGeneralMeetings({
          page: 1,
          limit: 100,
          society_id: societyId,
        }),
      ]);

      const agmMeetings = agmRes?.data?.meetings || [];
      const sgbmMeetings = sgbmRes?.data?.meetings || [];

      const hasApprovedAgm = agmMeetings.some(isApprovedMeeting);
      const hasApprovedSgbm = sgbmMeetings.some(isApprovedMeeting);

      setState({
        hasApprovedAgm,
        hasApprovedSgbm,
        isEligible: hasApprovedAgm || hasApprovedSgbm,
        societyId,
        loading: false,
      });
    } catch {
      setState({
        hasApprovedAgm: false,
        hasApprovedSgbm: false,
        isEligible: false,
        societyId: null,
        loading: false,
      });
    }
  }, [enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return state;
};
