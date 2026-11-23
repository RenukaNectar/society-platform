import React, { useState } from "react";
import { Input } from "../../components/ui/Input";
// import { Select } from '../../components/ui/Select';
import { RadioGroup } from "../../components/ui/RadioGroup";
// import { Textarea } from '../../components/ui/Textarea';
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

interface FormData {
  // Office Building
  hasOfficeBuilding: string;
  officeBuildingType: string;

  // Share Capital
  authorizedShareCapital: string;
  membersShareCapital: string;
  governmentShareCapital: string;
  paidUpShareDate: string;

  // Annual Financials
  annualTurnover: string;
  totalDeposits: string;
  totalLoanOutstanding: string;

  // Member Details
  individualMembers: string;
  institutionalMembers: string;

  // Facilities
  facilities: string[];
}

const CooperativeRegistrationsCmiscellaneous = ({
  data,
  onCancel,
  onClose,
  onSubmit,
}: {
  data: any;
  onCancel: () => void;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) => {
  console.log(data);

  const [formData, setFormData] = useState<FormData>({
    hasOfficeBuilding: data?.hasOfficeBuilding || "",
    officeBuildingType: data?.officeBuildingType || "",
    authorizedShareCapital: data?.authorizedShareCapital || "",
    membersShareCapital: data?.membersShareCapital || "",
    governmentShareCapital: data?.governmentShareCapital || "",
    paidUpShareDate: data?.paidUpShareDate || "",
    annualTurnover: data?.annualTurnover || "",
    totalDeposits: data?.totalDeposits || "",
    totalLoanOutstanding: data?.totalLoanOutstanding || "",
    individualMembers: data?.individualMembers || "",
    institutionalMembers: data?.institutionalMembers || "",
    facilities: data?.facilities || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const officeBuildingTypes = [
    { value: "1", label: "Own Building" },
    { value: "2", label: "Rented Building" },
    { value: "3", label: "Rent Free Building" },
    { value: "4", label: "Leased Building" },
    { value: "5", label: "Building Provided by the Government" },
  ];

  const facilitiesOptions = [
    { value: "1", label: "Do not have basic amenities" },
    { value: "60", label: "Credit facility to non-members" },
    { value: "61", label: "Business Correspondence" },
    { value: "62", label: "Consumer/Thrift Store" },
    { value: "63", label: "Fair Price Shop" },
    { value: "64", label: "LPG distributorship" },
  ];

  const handleFacilityChange = (value: string) => {
    setFormData((prev) => {
      const exists = prev.facilities.includes(value);

      return {
        ...prev,
        facilities: exists
          ? prev.facilities.filter((v) => v !== value)
          : [...prev.facilities, value],
      };
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.hasOfficeBuilding)
      newErrors.hasOfficeBuilding =
        "Please specify if society has office building";
    if (formData?.hasOfficeBuilding === "1" && !formData.officeBuildingType) {
      newErrors.officeBuildingType = "Office building type is required";
    }
    // if (!formData.authorizedShareCapital)
    //   newErrors.authorizedShareCapital = "Authorized share capital is required";
    // if (!formData.membersShareCapital)
    //   newErrors.membersShareCapital = "Promoters share capital is required";
    // if (!formData.governmentShareCapital)
    //   newErrors.governmentShareCapital = "Government share capital is required";
    // if (!formData.annualTurnover)
    //   newErrors.annualTurnover = "Annual turnover is required";
    if (!formData.totalDeposits)
      newErrors.totalDeposits = "Total deposits is required";
    if (!formData.totalLoanOutstanding)
      newErrors.totalLoanOutstanding = "Total loan outstanding is required";
    if (!formData.individualMembers)
      newErrors.individualMembers = "Individual promoters count is required";
    if (!formData.institutionalMembers)
      newErrors.institutionalMembers =
        "Institutional promoters count is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const transformToApiPayload = () => {
    const hasBuilding = Number(formData.hasOfficeBuilding) || null;

    const buildingType =
      hasBuilding === 1 ? Number(formData.officeBuildingType) : null;

    const paidUpMembers = Number(formData.membersShareCapital);
    const paidUpGovt = Number(formData.governmentShareCapital);

    return {
      CooperativeRegistrationsCmiscellaneous: [
        {
          has_building: hasBuilding || null,
          building_type: buildingType || null,

          authorised_share: Number(formData.authorizedShareCapital) || null,

          paid_up_members: paidUpMembers || null,
          paid_up_government_bodies: paidUpGovt || null,
          paid_up_total: paidUpMembers + paidUpGovt || null,

          paid_up_share_date: formData.paidUpShareDate || null,

          total_deposit: Number(formData.totalDeposits) || null,

          loan_outstanding: Number(formData.totalLoanOutstanding) || null,

          individual_member: Number(formData.individualMembers) || null,

          institutional_member: Number(formData.institutionalMembers) || null,

          facilities: formData.facilities.join(",") || null,
        },
      ],
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const payload = transformToApiPayload();
      onSubmit(payload);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Office Building Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          1. Office Building
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="1(a). Whether the co-operative society has an office building"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.hasOfficeBuilding}
            onChange={(value) => handleInputChange("hasOfficeBuilding", value)}
            name="hasOfficeBuilding"
            error={errors.hasOfficeBuilding}
            required
          />

          {formData.hasOfficeBuilding === "1" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                1(a)(i). Type of Office Building
              </h3>
              <RadioGroup
                options={officeBuildingTypes}
                value={formData.officeBuildingType}
                onChange={(value) =>
                  handleInputChange("officeBuildingType", value)
                }
                name="officeBuildingType"
                error={errors.officeBuildingType}
                required
              />
            </div>
          )}
        </div>
      </Card>

      {/* Share Capital Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          2. Share Capital
        </h2>

        <div className="space-y-6">
          <Input
            label="2(a). Authorised Share Capital (in Rs)"
            type="number"
            value={formData.authorizedShareCapital}
            onChange={(e) =>
              handleInputChange("authorizedShareCapital", e.target.value)
            }
            placeholder="Enter authorized share capital amount"
            // error={errors.authorizedShareCapital}
            // required
          />

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              2(b). Paid up Share Capital by different Entity
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">
                      Name of Entity
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-left">
                      Amount (in Rs)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">
                      Promoters in Rs
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Input
                        type="number"
                        value={formData.membersShareCapital}
                        onChange={(e) =>
                          handleInputChange(
                            "membersShareCapital",
                            e.target.value,
                          )
                        }
                        placeholder="Enter promoters share capital amount"
                        // error={errors.membersShareCapital}
                        // required
                        className="w-full"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">
                      Government of Government Bodies in Rs
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Input
                        type="number"
                        value={formData.governmentShareCapital}
                        onChange={(e) =>
                          handleInputChange(
                            "governmentShareCapital",
                            e.target.value,
                          )
                        }
                        placeholder="Enter government share capital amount"
                        // error={errors.governmentShareCapital}
                        // required
                        className="w-full"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>

      {/* Annual Financials Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          3. Annual Financials
        </h2>

        <div className="space-y-6">
          <Input
            label="3(a). Annual Turn Over of the Cooperative Society (in Rs)"
            type="number"
            value={formData.annualTurnover}
            onChange={(e) =>
              handleInputChange("annualTurnover", e.target.value)
            }
            placeholder="Enter annual turnover amount"
            // error={errors.annualTurnover}
            // required
          />

          <Input
            label="3(b). Paid Up Share Date"
            type="date"
            value={formData.paidUpShareDate}
            onChange={(e) =>
              handleInputChange("paidUpShareDate", e.target.value)
            }
          />

          <Input
            label="3(b). Total Deposits with the SOCIETY (in Rs)"
            type="number"
            value={formData.totalDeposits}
            onChange={(e) => handleInputChange("totalDeposits", e.target.value)}
            placeholder="Enter total deposits amount"
            error={errors.totalDeposits}
            required
          />

          <Input
            label="3(c). Total Amount of Loan Outstanding (in Rs)"
            type="number"
            value={formData.totalLoanOutstanding}
            onChange={(e) =>
              handleInputChange("totalLoanOutstanding", e.target.value)
            }
            placeholder="Enter total loan outstanding amount"
            error={errors.totalLoanOutstanding}
            required
          />
        </div>
      </Card>

      {/* Member Details Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          4. Promoter Details
        </h2>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            4(a). Promoter Detail of Cooperative Society
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">
                    Type of Promoter
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left">
                    No. of Member
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">
                    Individual
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <Input
                      type="number"
                      value={formData.individualMembers}
                      onChange={(e) =>
                        handleInputChange("individualMembers", e.target.value)
                      }
                      placeholder="Enter number of individual promoters"
                      error={errors.individualMembers}
                      required
                      className="w-full"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">
                    Institutional
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <Input
                      type="number"
                      value={formData.institutionalMembers}
                      onChange={(e) =>
                        handleInputChange(
                          "institutionalMembers",
                          e.target.value,
                        )
                      }
                      placeholder="Enter number of institutional promoters"
                      error={errors.institutionalMembers}
                      required
                      className="w-full"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Facilities Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          5. Facilities
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {facilitiesOptions.map((item) => (
            <label key={item.value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                value={item.value}
                checked={formData.facilities.includes(item.value)}
                onChange={() => handleFacilityChange(item.value)}
                className="h-4 w-4"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Submit Application</Button>
      </div>
    </form>
  );
};

export default CooperativeRegistrationsCmiscellaneous;
