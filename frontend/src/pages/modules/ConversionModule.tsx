import React, { useEffect, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import ConversionTableColumns from "../../hooks/conversion/useConversionTableColumns";
import { Pagination } from "../../components/layout/Pagination";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { getStatusColor } from "../../utils/getStatusByKey";
import { Input } from "../../components/ui/Input";
import { Search, X } from "lucide-react";
import { Select } from "../../components/ui/Select";
import { setConversions } from "../../store/slices/conversionSlice";
import { getConversionSocieties } from "../../lib/data/conversionSociety/api";
import { getMySociety } from "../../lib/data/users/api";
import { getBodList } from "../../lib/data/BOD/api";
import BodModule from "../../components/bod/BodModule";
import { useConversionMeetingEligibility } from "../../hooks/conversion/useConversionMeetingEligibility";
import { ConversionMeetingAccessBlock } from "../../components/conversion/ConversionMeetingAccessBlock";

export const ConversionSocietyModule: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { mode } = useSelector((state: RootState) => state.theme);
  const { user } = useSelector((state: RootState) => state.auth);
  const { conversions } = useSelector(
    (state: RootState) => state.conversionSocieties,
  );
  const { statuses } = useSelector((state: RootState) => state.statuses);

  const isApplicant = user?.role === "applicant";
  const meetingEligibility = useConversionMeetingEligibility(isApplicant);

  /* ================= STATE ================= */

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [registrationNumber, setRegistrationNumber] = useState("");

  const [filters, setFilters] = useState({
    reference_year: "",
    from: "",
    to: "",
    status: "",
  });

  const [paginationInfo, setPaginationInfo] = useState({
    total: 0,
    limit: 10,
    from: 0,
    to: 0,
  });

  const [societyId, setSocietyId] = useState<string>("");
  const [is_verified, setis_verified] = useState<number>(0);

  // useEffect(() => {
  //   if (isApplicant && is_verified === 1 && conversions.length > 0) {
  //     navigate(`/conversion-society/${conversions[0].id}`);
  //   }
  // }, [isApplicant, is_verified, conversions]);

  // Redirect applicant directly to first conversion details page
  // useEffect(() => {
  //   if (isApplicant && is_verified === 1 && conversions.length > 0) {
  //     navigate(`/conversion-society/${conversions[0].id}`);
  //   }
  // }, [isApplicant, is_verified, conversions, navigate]);

  /* ================= DEFAULT DATE RANGE ================= */

  useEffect(() => {
    if (user?.role === "admin") {
      const today = new Date();
      const fromDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

      setFilters((prev) => ({
        ...prev,
        from: fromDate.toISOString().split("T")[0],
        to: today.toISOString().split("T")[0],
      }));
    }
  }, [user?.role]);

  /* ================= FILTER HANDLERS ================= */

  const handleFilterChange = (key: string, value: string) => {
    if (key === "from" && filters.to && value > filters.to) return;
    if (key === "to" && filters.from && value < filters.from) return;

    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    const today = new Date();
    const fromDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

    setRegistrationNumber("");
    setFilters({
      reference_year: "",
      from: fromDate.toISOString().split("T")[0],
      to: today.toISOString().split("T")[0],
      status: "",
    });
    setPage(1);
  };

  /* ================= GET SOCIETY ID FOR APPLICANT ================= */

  useEffect(() => {
    const loadSociety = async () => {
      if (!isApplicant) return;

      try {
        const res = await getMySociety();
        const id = res?.data?.society?.id;

        if (id) {
          setSocietyId(id);
        }
      } catch (err) {
        console.log("ERROR LOADING SOCIETY", err);
      }
    };

    loadSociety();
  }, [isApplicant]);

  /* ================= CHECK BOD VERIFIED ================= */

  useEffect(() => {
    const handleBod = async () => {
      if (!meetingEligibility.isEligible) return;

      try {
        const res = await getBodList(societyId, "conversion");
        setis_verified(res?.data?.is_verified || 0);
      } catch (error) {
        console.log("Error fetching BOD:", error);
      }
    };

    if (societyId) {
      handleBod();
    }
  }, [societyId, meetingEligibility.isEligible]);

  /* ================= FETCH DATA ================= */

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const response: any = await getConversionSocieties({
          registration_number: registrationNumber || undefined,
          status: filters.status || undefined,
          reference_year: filters.reference_year || undefined,
          from: filters.from || undefined,
          to: filters.to || undefined,
          page,
        });

        const data = response?.data ?? response;

        dispatch(setConversions(data?.societyConversions || []));
        setPaginationInfo(data?.pagination || {});
      } catch (err) {
        console.error("Failed to fetch conversion societies", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    page,
    registrationNumber,
    filters.status,
    filters.reference_year,
    filters.from,
    filters.to,
  ]);

  // if (
  //   isApplicant &&
  //   is_verified === 1 &&
  //   conversions.length === 0 &&
  //   !loading
  // ) {
  //   return (
  //     <div className="flex justify-center items-center h-[90vh] bg-white rounded-lg p-4">
  //       <div className="flex flex-col items-center justify-center space-y-4">
  //         <h1 className="text-2xl font-bold">No conversion request found</h1>
  //         <h3 className="text-gray-600">
  //           Please submit conversion request first
  //         </h3>
  //       </div>
  //     </div>
  //   );
  // }

  /* ================= APPLICANT GUARD ================= */

  if (isApplicant && (meetingEligibility.loading || loading)) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="text-center text-gray-600">Loading conversion module…</div>
      </div>
    );
  }

  if (isApplicant && !meetingEligibility.isEligible) {
    return <ConversionMeetingAccessBlock />;
  }

  if (isApplicant && meetingEligibility.isEligible && is_verified !== 1) {
    return (
      <BodModule
        module_name="conversion"
        onVerified={() => {
          setis_verified(1);
        }}
      />
    );
  }

  /* ================= RENDER ================= */

  return (
    <div className="space-y-4 mt-4">
      {user?.role !== "applicant" && (
        <div className="flex justify-between items-start gap-4">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 flex-1">
            <Input
              label="Registration Number"
              placeholder="Enter registration number"
              icon={<Search className="h-4 w-4 text-gray-400" />}
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
            />

            <Select
              label="Reference Year"
              value={filters.reference_year}
              onChange={(e) =>
                handleFilterChange("reference_year", e.target.value)
              }
            >
              <option value="">All Years</option>
              {Array.from(
                { length: new Date().getFullYear() - 1969 },
                (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                },
              )}
            </Select>

            <Input
              label="From Date"
              type="date"
              value={filters.from}
              onChange={(e) => handleFilterChange("from", e.target.value)}
            />

            <Input
              label="To Date"
              type="date"
              value={filters.to}
              onChange={(e) => handleFilterChange("to", e.target.value)}
            />

            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
            >
              <option value="">All Status</option>
              {statuses.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </Select>

            <Button
              variant="outline"
              className="mt-5 flex items-center gap-2"
              onClick={clearFilters}
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>

          {/* <div className="flex items-center mt-5">
            <ExportUsersReport
              exportModule="society"
              searchTerm={registrationNumber}
              filters={filters}
            />
          </div> */}
        </div>
      )}

      <Card padding="none">
        {loading ? (
          <div className="p-8 text-center">Loading conversion societies…</div>
        ) : (
          <div className="overflow-x-auto max-h-[75vh]">
            <table className="w-full">
              <thead className={`sticky top-0 bg-gray-50 ${mode}:bg-gray-900`}>
                <ConversionTableColumns theme={mode} />
              </thead>

              <tbody
                className={`divide-y divide-gray-200 ${mode}:divide-gray-700`}
              >
                {conversions.map((item: any) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50 ${mode}:hover:bg-gray-800`}
                  >
                    <td className="px-6 py-4 text-sm font-medium">
                      {item.society?.registration_number || "-"}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      {item.society?.cooperative_society_name || "-"}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      {item.conversionFrom?.name || "-"}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      {item.conversionTo?.name || "-"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                          item?.status?.key || item?.status,
                          mode,
                        )}`}
                      >
                        {item.statusDetails?.title || item.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm">
                      {moment(item.created_at).format("DD MMM, YYYY")}
                    </td>

                    <td className="px-6 py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="border"
                        onClick={() =>
                          navigate(`/conversion-society/${item.id}`)
                        }
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}

                {conversions.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No conversion societies found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Pagination
        pagination={paginationInfo}
        currentPage={page}
        onPageChange={setPage}
        theme={mode}
      />
    </div>
  );
};
