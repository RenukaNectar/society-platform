import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { LiquidationForm as LiquidationFormType } from "../../types";
import { AlertCircle, FileText, Search } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import LiquidationTableColums from "../../hooks/liquidation/useLiquidationTableColums";
import { LiquidationForm as LiquidationFormComponent } from "../forms/LiquidationForm";
import { getLiquidations } from "../../lib/data/liquidations/api";
import moment from "moment";
import { getStatusColor } from "../../utils/getStatusByKey";
import { getLiquidationStatusLabel } from "../../utils/liquidationStatus";
import { LiquidationDetails } from "../details/LiquidationDetails";
import { Pagination } from "../../components/layout/Pagination";
import { getMySociety } from "../../lib/data/users/api";
import { Input } from "../../components/ui/Input";
import { ExportUsersReport } from "../exportReports/export";
import BodModule from "../../components/bod/BodModule";
import { getBodList } from "../../lib/data/BOD/api";
import { Modal } from "../../components/ui/Modal";
import { getSocieties } from "../../lib/data/societies/api";
import ActionPermissionGuard from "../../components/guard/ActionPermissionGuard";
import { isReturnedFileWithApplicant } from "../../lib/workflow/assigneeUsers";
// import { Permission } from "../../components/permission/Permission";

type ViewMode = "list" | "add" | "edit" | "view";
type DistrictSociety = {
  id?: string;
  cooperative_society_name?: string;
  society_name?: string;
  registration_number?: string;
  district?: { name?: string };
  status?: { title?: string; key?: string };
};

export const LiquidationModule: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [liquidations, setLiquidations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [societyId, setSocietyId] = useState<string>("");
  const [is_verified, setis_verified] = useState<number>(0);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isDistrictSocietyModalOpen, setIsDistrictSocietyModalOpen] =
    useState(false);
  const [societyPickerQuery, setSocietyPickerQuery] = useState("");
  const [debouncedSocietyPickerQuery, setDebouncedSocietyPickerQuery] =
    useState("");
  const [districtSocieties, setDistrictSocieties] = useState<DistrictSociety[]>(
    [],
  );
  const [districtSocietiesLoading, setDistrictSocietiesLoading] =
    useState(false);
  const [districtSocietiesError, setDistrictSocietiesError] = useState("");

  const { mode } = useSelector((state: RootState) => state.theme);
  const isApplicant = user?.role === "applicant";

  const [societyDetails, setSocietyDetails] = useState<any>(null);
  const navigate = useNavigate();

  const [selectedLiquidation, setSelectedLiquidation] = useState<any>(null);

  const { reset } = useForm<LiquidationFormType>();

  // ================= LOAD LIQUIDATIONS =================
  const loadLiquidations = async () => {
    if (loading) return;

    setLoading(true);

    try {
      let response;

      if (isApplicant) {
        const res = await getMySociety();

        if (res?.data?.society?.id) {
          const societyWithMembers = {
            ...res.data.society,
          };

          setSocietyDetails(societyWithMembers);
          setSocietyId(res.data.society.id);

          response = await getLiquidations({
            society_id: res.data.society.id,
            limit: 1,
          });

          if (
            response.data &&
            response.data.liquidations &&
            response.data.liquidations.length > 0
          ) {
            setLiquidations(response.data.liquidations);
            setViewMode("view");
          } else {
            setLiquidations([]);
            setViewMode("add");
          }
        } else {
          setViewMode("add");
        }
      } else {
        setViewMode("list");

        response = await getLiquidations({
          page: pagination.currentPage,
          limit: pagination.limit,
        });

        if (response.data && response.data.liquidations) {
          setLiquidations(response.data.liquidations || []);
          setPagination({
            currentPage: response.data.page || 1,
            totalPages: response.data.totalPages || 1,
            total: response.data.total || 0,
            limit: parseInt(response.data.limit) || 10,
          });
        } else {
          setLiquidations([]);
        }
      }
    } catch (error) {
      console.error("Error loading liquidations:", error);
      if (isApplicant) setViewMode("add");
    } finally {
      setLoading(false);
    }
  };

  // ================= LOAD REGISTRAR LIQUIDATIONS =================
  const loadRegistrarLiquidations = async (params: any = {}, search = "") => {
    if (isApplicant) return;

    setLoading(true);

    try {
      const response = await getLiquidations({
        page: pagination.currentPage,
        limit: pagination.limit,
        search: search,
        ...params,
      });

      if (response.data && response.data.liquidations) {
        setLiquidations(response.data.liquidations || []);
        setPagination({
          currentPage: response.data.page || 1,
          totalPages: response.data.totalPages || 1,
          total: response.data.total || 0,
          limit: parseInt(response.data.limit) || 10,
        });
      } else {
        setLiquidations([]);
      }
    } catch (error) {
      console.error("Error loading registrar liquidations:", error);
    } finally {
      setLoading(false);
    }
  };

  // ================= FETCH BOD VERIFIED STATUS =================
  useEffect(() => {
    const handleBod = async () => {
      try {
        const res = await getBodList(societyId, "liquidation");
        setis_verified(res?.data?.is_verified || 0);
      } catch (error) {
        console.log("Error fetching BOD:", error);
      }
    };

    if (societyId) {
      handleBod();
    }
  }, [societyId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSocietyPickerQuery(societyPickerQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [societyPickerQuery]);

  useEffect(() => {
    if (!isDistrictSocietyModalOpen || isApplicant) return;
    loadDistrictSocieties(debouncedSocietyPickerQuery);
  }, [isDistrictSocietyModalOpen, debouncedSocietyPickerQuery]);

  // ================= DEBOUNCE SEARCH =================
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ================= LOAD DATA ON SEARCH =================
  useEffect(() => {
    if (isApplicant) {
      loadLiquidations();
    } else {
      loadRegistrarLiquidations({}, debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  // ================= INITIAL LOAD =================
  useEffect(() => {
    loadLiquidations();
  }, []);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));

    if (!isApplicant) {
      loadRegistrarLiquidations({}, debouncedSearchTerm);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const getUserDistrictId = () => {
    const currentUser = user as {
      district_id?: string;
      district?: { id?: string; district_id?: string };
      is_hq?: boolean;
    } | null;

    return (
      currentUser?.district?.id ||
      currentUser?.district_id ||
      currentUser?.district?.district_id ||
      ""
    );
  };
   
  const isHqUser = Boolean((user as any)?.is_hq) ||
    (typeof user?.role === "string" && user.role.includes("_hq"));

  const loadDistrictSocieties = async (search = "") => {
    const districtId = getUserDistrictId();
    setDistrictSocietiesLoading(true);
    setDistrictSocietiesError("");

    if (!districtId && !isHqUser) {
      setDistrictSocieties([]);
      setDistrictSocietiesLoading(false);
      setDistrictSocietiesError("District not found for current user.");
      return;
    }

    try {
      const response = await getSocieties({
        ...(districtId ? { district_id: districtId } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
        limit: 1000,
      });
      const societyResponse = response as {
        societyRegistrations?: DistrictSociety[];
        societies?: DistrictSociety[];
      };
      const societies =
        societyResponse?.societyRegistrations ||
        societyResponse?.societies ||
        [];
      setDistrictSocieties(societies);
    } catch (error) {
      console.error("Error loading district societies:", error);
      setDistrictSocieties([]);
      setDistrictSocietiesError("Failed to load societies for this district.");
    } finally {
      setDistrictSocietiesLoading(false);
    }
  };

  const openDistrictSocietyModal = () => {
    setSocietyPickerQuery("");
    setDebouncedSocietyPickerQuery("");
    setIsDistrictSocietyModalOpen(true);
  };

  const handleAddLiquidation = (society: DistrictSociety) => {
    if (!society?.id) return;
    setSocietyDetails(society);
    setIsDistrictSocietyModalOpen(false);
    setViewMode("add");
  };

  // ================= APPLICANT VIEW =================
  if (isApplicant) {
    // If BOD not verified, show BodModule first
    if (is_verified !== 1) {
      return (
        <BodModule
          module_name="liquidation"
          onVerified={() => {
            setis_verified(1); 
          }}
        />
      );
    }

    // If liquidation exists, show details
    if (liquidations.length > 0 && viewMode !== "add") {
      const liquidation = liquidations[0];

      return (
        <>
          {liquidation?.statusObj &&
            (liquidation?.statusObj?.key === "registrar_rejected" ||
              liquidation?.statusObj?.key === "reverted" ||
              liquidation?.statusObj?.key === "rejected") &&
            isReturnedFileWithApplicant(liquidation) && (
              <div className="p-3 bg-red-500 border-red-200 rounded-lg flex justify-between items-center my-4">
                <div>
                  <div className="flex items-center text-white">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Liquidation request is&nbsp;
                    <span className="font-bold">Return / Re-View</span>
                  </div>

                  {liquidation?.rejection_reason && (
                    <p className="text-white text-sm ps-5 ms-2">
                      {liquidation?.rejection_reason}
                    </p>
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedLiquidation(liquidation); 
                    setViewMode("add");
                  }}
                  size="sm"
                >
                  Re-Submit Liquidation
                </Button>
              </div>
            )}

          <LiquidationDetails liquidation={liquidation} />
        </>
      );
    }

    // If no liquidation, show form
    return (
      <div className="space-y-4 mt-4">
        {societyDetails ? (
          societyDetails?.status?.key === "certificate_issued" ? (
            <LiquidationFormComponent
              data={selectedLiquidation}   
              societyData={societyDetails}
              onSuccess={() => {
                setSelectedLiquidation(null);
                loadLiquidations();
                setViewMode("view");
              }}
              onCancel={() => {
                setSelectedLiquidation(null);
                setViewMode("view");
              }}
            />
          ) : (
            <div className="flex justify-center items-center h-[90vh] bg-white rounded-lg p-4">
              <div className="flex flex-col items-center justify-center space-y-4">
                <h1 className="text-2xl font-bold">Society is under review</h1>
                <h3>Please wait for the review to be completed</h3>
              </div>
            </div>
          )
        ) : (
          <div className="flex justify-center items-center h-[90vh] bg-white rounded-lg p-4">
            <div className="flex flex-col items-center justify-center space-y-4">
              <h1 className="text-2xl font-bold">No society found</h1>
              <h3>Register your society first</h3>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (viewMode === "add" && !isApplicant) {
    return (
      <div className="space-y-4 mt-4">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setViewMode("list")}>
            Back to List
          </Button>
        </div>

        <LiquidationFormComponent
          data={null}
          societyData={societyDetails}
          onSuccess={() => {
            setViewMode("list");
            loadRegistrarLiquidations({}, debouncedSearchTerm);
          }}
          onCancel={() => setViewMode("list")}
        />
      </div>
    );
  }

  // ================= REGISTRAR LIST VIEW =================
  if (viewMode === "list") {
    return (
      <div className="space-y-4 mt-4">
        <div className="flex justify-between items-center">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search by society name, registration number, or status..."
              icon={<Search className="h-4 w-4 text-gray-400" />}
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleSearch(e.target.value)
              }
            />
          </div>

          {user?.role !== "applicant" && (
            <div className="flex items-center gap-2">
              {/* <Permission module="liquidation" action="create"> */}
              <ActionPermissionGuard resource="liquidation" action="create">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={openDistrictSocietyModal}
                >
                  Add Liquidation
                </Button>
              </ActionPermissionGuard>
              {/* </Permission> */}
              <ExportUsersReport
                exportModule="liquidation"
                searchTerm={searchTerm}
                filters={{}}
              />
            </div>
          )}
        </div>

        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`bg-gray-50 ${mode}:bg-gray-900`}>
                <LiquidationTableColums theme />
              </thead>

              <tbody
                className={`divide-y divide-gray-200 ${mode}:divide-gray-700`}
              >
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-lg font-medium">
                          Loading liquidations...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : liquidations.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center">
                        <FileText className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium">
                          No liquidations found
                        </p>
                        <p className="text-sm">
                          No liquidations match your current search
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  liquidations.map((liquidation) => (
                    <tr
                      key={liquidation.id}
                      className={`hover:bg-gray-50 ${mode}:hover:bg-gray-800`}
                    >
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {liquidation?.society_name || "-"}
                        </span>
                        <p className="text-xs text-gray-600">
                          {liquidation?.society_registration_number || "-"}
                        </p>
                      </td>

                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium">
                          {liquidation?.societyType?.title || "-"}
                        </span>
                      </td>

                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium">
                          {liquidation?.mode_of_liquidation || "-"}
                        </span>
                      </td>

                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium">
                          {liquidation?.date_of_liquidation_order
                            ? moment(
                                liquidation.date_of_liquidation_order,
                              ).format("DD-MM-YYYY")
                            : "-"}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-normal">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full whitespace-normal ${getStatusColor(
                            liquidation?.statusObj?.title ||
                              liquidation?.statusObj?.key ||
                              "Unknown",
                            mode,
                          )}`}
                        >
                          {getLiquidationStatusLabel(liquidation)}
                        </span>
                      </td>

                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}
                      >
                        {liquidation?.created_at
                          ? moment(liquidation.created_at).format(
                              "DD MMM, YYYY hh:mm a",
                            )
                          : "-"}
                      </td>

                      <td className="px-5 py-3 whitespace-nowrap text-sm">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="border"
                          onClick={() =>
                            navigate(`/liquidations/${liquidation?.id}`)
                          }
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            pagination={{
              total: pagination.total,
              limit: pagination.limit,
              from: (pagination.currentPage - 1) * pagination.limit + 1,
              to: Math.min(
                pagination.currentPage * pagination.limit,
                pagination.total,
              ),
            }}
            currentPage={pagination.currentPage}
            onPageChange={handlePageChange}
            theme={mode}
          />
        </Card>

        <Modal
          isOpen={isDistrictSocietyModalOpen}
          onClose={() => setIsDistrictSocietyModalOpen(false)}
          title={isHqUser ? "Select Society" : "Societies In Your District"}
          size="xl"
        >
          <div className="mb-3">
            <Input
              placeholder="Search by society name or registration number"
              icon={<Search className="h-4 w-4 text-gray-400" />}
              value={societyPickerQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSocietyPickerQuery(e.target.value)
              }
            />
          </div>
          {districtSocietiesLoading ? (
            <p className="text-sm text-gray-600">Loading societies...</p>
          ) : districtSocietiesError ? (
            <p className="text-sm text-red-600">{districtSocietiesError}</p>
          ) : districtSocieties.length === 0 ? (
            <p className="text-sm text-gray-600">
              {societyPickerQuery.trim()
                ? "No societies match your search."
                : "No societies found in your district."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold">
                      Society Name
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">
                      Registration No.
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">
                      District
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">
                      liquidation
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {districtSocieties.map((society) => (
                    <tr key={society?.id}>
                      <td className="px-4 py-2 text-sm">
                        {society?.cooperative_society_name ||
                          society?.society_name ||
                          "-"}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {society?.registration_number || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {society?.district?.name || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="border"
                          onClick={() => handleAddLiquidation(society)}
                        >
                          Add Liquidation
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  return null;
};
