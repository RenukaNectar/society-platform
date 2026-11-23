import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { FileText, Search } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { Pagination } from "../../components/layout/Pagination";
import { Input } from "../../components/ui/Input";
import moment from "moment";
import { getSocietyRenewals } from "../../lib/data/renewals/api";

export const RenewalsModule: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useSelector((state: RootState) => state.theme);
  const { user } = useSelector((state: RootState) => state.auth);

  const [renewals, setRenewals] = useState<any[]>([]);
  const [filteredRenewals, setFilteredRenewals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [paginationInfo, setPaginationInfo] = useState({
    total: 0,
    limit: 10,
    from: 0,
    to: 0,
  });

  // Load renewals
  const loadRenewals = async () => {
    setLoading(true);

    try {
      const response = await getSocietyRenewals({
        limit: 10,
        page: currentPage,
      });

      if (response?.success) {
        setRenewals(response?.data?.renewals || []);
        setPaginationInfo(response?.data?.pagination || {});
      } else {
        setRenewals([]);
        setPaginationInfo({
          total: 0,
          limit: 10,
          from: 0,
          to: 0,
        });
      }
    } catch (error) {
      console.error("Error loading renewals:", error);
      setRenewals([]);
    } finally {
      setLoading(false);
    }
  };

  // Reload data when page changes
  useEffect(() => {
    loadRenewals();
  }, [currentPage, user?.role]);

  // Filter renewals by Society Name or Registration Number
  useEffect(() => {
    if (!renewals.length) {
      setFilteredRenewals([]);
      return;
    }

    const filtered = renewals.filter((renewal: any) => {
      const societyName =
        renewal?.society?.cooperative_society_name?.toLowerCase() || "";
      const registrationNumber =
        renewal?.society?.registration_number?.toLowerCase() || "";

      return (
        societyName.includes(searchTerm.toLowerCase()) ||
        registrationNumber.includes(searchTerm.toLowerCase())
      );
    });

    setFilteredRenewals(filtered);
  }, [renewals, searchTerm]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search by society name or registration number..."
            icon={<Search className="h-4 w-4 text-gray-400" />}
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleSearch(e.target.value)
            }
          />
        </div>
        {/* {user?.role !== "applicant" && (
          <div className="flex items-center">
            <ExportUsersReport
              exportModule="society"
              searchTerm={searchTerm}
              filters={{}}
            />
          </div>
        )} */}
      </div>

      {/* Renewals Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`bg-gray-50 ${mode}:bg-gray-900`}>
              <tr>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${mode}:text-gray-300 uppercase tracking-wider`}
                >
                  Registration Number
                </th>

                <th
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${mode}:text-gray-300 uppercase tracking-wider`}
                >
                  Society Name
                </th>

                <th
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${mode}:text-gray-300 uppercase tracking-wider`}
                >
                  Status
                </th>

                <th
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${mode}:text-gray-300 uppercase tracking-wider`}
                >
                  Submit Date
                </th>

                <th
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${mode}:text-gray-300 uppercase tracking-wider`}
                >
                  Created By
                </th>

                <th
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${mode}:text-gray-300 uppercase tracking-wider`}
                >
                  Actions
                </th>
              </tr>
            </thead>

            <tbody
              className={`divide-y divide-gray-200 ${mode}:divide-gray-700`}
            >
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-lg font-medium">Loading renewals...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredRenewals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                      <FileText className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium">No renewals found</p>
                      <p className="text-sm">
                        No renewals match your current search
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRenewals.map((renewal) => (
                  <tr
                    key={renewal.id}
                    className={`hover:bg-gray-50 ${mode}:hover:bg-gray-800`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {renewal?.society?.registration_number || "-"}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {renewal?.society?.cooperative_society_name || "-"}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {renewal?.statusDetails?.title || "-"}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {renewal.submit_date
                        ? moment(renewal.submit_date).format("DD-MM-YYYY")
                        : "-"}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {renewal.createdByUser
                        ? `${renewal.createdByUser.first_name} ${renewal.createdByUser.last_name}`
                        : "-"}
                    </td>

                    <td className="px-5 py-3 whitespace-nowrap text-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="border"
                        onClick={() =>
                          navigate(`/renewals/${renewal?.society_id}`)
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

        {/* Pagination */}
        <Pagination
          pagination={paginationInfo}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          theme={mode}
        />
      </Card>
    </div>
  );
};
