import { useCallback, useEffect, useState } from "react";
import { getAgmCalendarYearEligibility } from "../../lib/data/annualGeneralMeetings/api";

export type AgmCalendarYearEligibilityState = {
  calendarYear: number;
  canCreate: boolean;
  existingAgm: { id: string; meeting_date: string } | null;
  loading: boolean;
};

export const useAgmCalendarYearEligibility = (
  societyId: string | null | undefined,
  year?: number,
) => {
  const calendarYear = year ?? new Date().getFullYear();
  const [state, setState] = useState<AgmCalendarYearEligibilityState>({
    calendarYear,
    canCreate: true,
    existingAgm: null,
    loading: Boolean(societyId),
  });

  const load = useCallback(async () => {
    if (!societyId) {
      setState({
        calendarYear,
        canCreate: true,
        existingAgm: null,
        loading: false,
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    try {
      const response = await getAgmCalendarYearEligibility(societyId, calendarYear);
      const data = response.data;

      setState({
        calendarYear: data?.calendarYear ?? calendarYear,
        canCreate: data?.canCreate ?? true,
        existingAgm: data?.existingAgm ?? null,
        loading: false,
      });
    } catch {
      setState({
        calendarYear,
        canCreate: true,
        existingAgm: null,
        loading: false,
      });
    }
  }, [societyId, calendarYear]);

  useEffect(() => {
    load();
  }, [load]);

  return state;
};
