import React, { useState } from "react";
import { Input } from "../../components/ui/Input";
// import { Select } from "../../components/ui/Select";
import { RadioGroup } from "../../components/ui/RadioGroup";
// import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

interface FormData {
  // Office Building
  hasOfficeBuilding: string;
  officeBuildingType: string;

  // Share Capital and Financial Details
  authorizedShareCapital: string;
  paidUpShareCapital: string;
  paidUpShareDate: string;

  totalDeposit: string;
  totalLoanOutstanding: string;

  // Facilities
  facilities: string[];
}

const CooperativeRegistrationsCreditThrift = ({
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
  const [formData, setFormData] = useState<FormData>({
    hasOfficeBuilding: data?.hasOfficeBuilding || "",
    officeBuildingType: data?.officeBuildingType || "",
    authorizedShareCapital: data?.authorizedShareCapital || "",
    paidUpShareCapital: data?.paidUpShareCapital || "",
    paidUpShareDate: data?.paidUpShareDate || "",
    totalDeposit: data?.totalDeposits || "",
    totalLoanOutstanding: data?.totalLoanOutstanding || "",
    facilities: data?.facilities ? data.facilities.split(",") : [],
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
    { value: "12", label: "Consumer/Thrift Store" },
    { value: "13", label: "Fair Price Shop" },
    { value: "14", label: "Insurance Services" },
    { value: "15", label: "LPG distributorship" },
    { value: "29", label: "Banking Counter" },
  ];

  const handleFacilityChange = (value: string) => {
    setFormData((prev) => {
      const updated = prev.facilities.includes(value)
        ? prev.facilities.filter((v) => v !== value)
        : [...prev.facilities, value];

      if (errors.facilities) {
        setErrors((prevErr) => ({ ...prevErr, facilities: "" }));
      }

      return { ...prev, facilities: updated };
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
    if (formData.hasOfficeBuilding === "yes" && !formData.officeBuildingType) {
      newErrors.officeBuildingType = "Office building type is required";
    }
    // if (!formData.authorizedShareCapital)
    //   newErrors.authorizedShareCapital = "Authorized share capital is required";
    // if (!formData.paidUpShareCapital)
    //   newErrors.paidUpShareCapital = "Paid up share capital is required";
    if (!formData.totalDeposit)
      newErrors.totalDeposit = "Total deposit is required";
    // if (!formData.totalLoanOutstanding)
    //   newErrors.totalLoanOutstanding = "Total loan outstanding is required";
    if (!formData.facilities.length) {
      newErrors.facilities = "Please select at least one facility";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const transformToApiPayload = () => {
    const hasBuilding = formData.hasOfficeBuilding === "yes" ? 1 : 0;

    const buildingType =
      hasBuilding === 1
        ? officeBuildingTypes.findIndex(
            (b) => b.value === formData.officeBuildingType,
          ) + 1
        : null;

    return {
      CooperativeRegistrationsCreditThrift: [
        {
          has_building: hasBuilding || null,
          building_type: buildingType || null,

          authorised_share: Number(formData.authorizedShareCapital) || null,
          paid_up_share: Number(formData.paidUpShareCapital) || null,
          paid_up_share_date: formData.paidUpShareDate || null,

          total_deposit: Number(formData.totalDeposit),
          pack_total_outstanding_loan:
            Number(formData.totalLoanOutstanding) || null,

          facilities: formData.facilities.length
            ? formData.facilities.join(",")
            : null,
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
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.hasOfficeBuilding}
            onChange={(value) => handleInputChange("hasOfficeBuilding", value)}
            name="hasOfficeBuilding"
            error={errors.hasOfficeBuilding}
          />

          {formData.hasOfficeBuilding === "yes" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                1(b). Type of Office Building
              </h3>
              <RadioGroup
                options={officeBuildingTypes}
                value={formData.officeBuildingType}
                onChange={(value) =>
                  handleInputChange("officeBuildingType", value)
                }
                name="officeBuildingType"
                error={errors.officeBuildingType}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Share Capital and Financial Details Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          2. Financial Details
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

          <Input
            label="2(b). Paid up Share Capital (in Rs)"
            type="number"
            value={formData.paidUpShareCapital}
            onChange={(e) =>
              handleInputChange("paidUpShareCapital", e.target.value)
            }
            placeholder="Enter paid up share capital amount"
            // error={errors.paidUpShareCapital}
            // required
          />

          <Input
            label="2(c). Paid Up Share Date"
            type="date"
            value={formData.paidUpShareDate}
            onChange={(e) =>
              handleInputChange("paidUpShareDate", e.target.value)
            }
          />

          <Input
            label="2(d). Total Deposit (in Rs)"
            type="number"
            value={formData.totalDeposit}
            onChange={(e) => handleInputChange("totalDeposit", e.target.value)}
            placeholder="Enter total deposit amount"
            error={errors.totalDeposit}
            required
          />

          <Input
            label="2(e). Total Amount of Loan Outstanding (in Rs)"
            type="number"
            value={formData.totalLoanOutstanding}
            onChange={(e) =>
              handleInputChange("totalLoanOutstanding", e.target.value)
            }
            placeholder="Enter total loan outstanding amount"
            // error={errors.totalLoanOutstanding}
            // required
          />
        </div>
      </Card>

      {/* Facilities Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          3. Facilities
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {facilitiesOptions.map((option) => (
            <label key={option.value} className="flex gap-3 items-start">
              <input
                type="checkbox"
                checked={formData.facilities.includes(option.value)}
                onChange={() => handleFacilityChange(option.value)}
                className="mt-1 h-4 w-4 shrink-0 text-indigo-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>

        {errors.facilities && (
          <p className="text-sm text-red-500 mt-2">{errors.facilities}</p>
        )}
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

export default CooperativeRegistrationsCreditThrift;
