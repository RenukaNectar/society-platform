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

  // Departmental Store Operations
  operatesDepartmentalStore: string;
  numberOfOutlets: string;

  // Share Capital
  authorizedShareCapital: string;
  paidUpShareCapital: string;
  paidUpShareDate: string;
  totalDeposit: string;
  packTotalOutstandingLoan: string;

  // Annual Turnover
  annualTurnover: string;

  // Facilities
  facilities: string[];
}

const CooperativeRegistrationsConsumer = ({
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
    hasOfficeBuilding: "",
    officeBuildingType: "",
    operatesDepartmentalStore: "",
    numberOfOutlets: "",
    authorizedShareCapital: "",
    paidUpShareCapital: "",
    paidUpShareDate: "",
    totalDeposit: "",
    packTotalOutstandingLoan: "",
    annualTurnover: "",
    facilities: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const officeBuildingTypes = [
    { value: "1", label: "Own Building" },
    { value: "2", label: "Rented Building" },
    { value: "3", label: "Rent Free Building" },
    { value: "4", label: "Leased Building" },
    { value: "5", label: "Building Provided By Govt" },
  ];

  const facilitiesOptions = [
    { value: "1", label: "Do not have basic amenities" },
    { value: "16", label: "Home Delivery Services" },
    { value: "17", label: "Health Care Services" },
    { value: "18", label: "Welfare Services" },
    { value: "19", label: "Fair Price Shop" },
    { value: "20", label: "LPG distributorship" },
    { value: "22", label: "Credit Facility" },
    { value: "23", label: "Own Departmental Store/Supermarket" },
    {
      value: "21",
      label:
        "Business Correspondent (Insurance, Financial & Banking, etc.) Services",
    },
  ];

  const handleFacilityChange = (value: string) => {
    setFormData((prev) => {
      const updated = prev.facilities.includes(value)
        ? prev.facilities.filter((v) => v !== value)
        : [...prev.facilities, value];

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
    if (!formData.operatesDepartmentalStore)
      newErrors.operatesDepartmentalStore =
        "Please specify if society operates departmental store";
    if (
      formData.operatesDepartmentalStore === "yes" &&
      !formData.numberOfOutlets
    ) {
      newErrors.numberOfOutlets = "Number of outlets is required";
    }
    // if (!formData.authorizedShareCapital)
    //   newErrors.authorizedShareCapital = "Authorized share capital is required";
    // if (!formData.paidUpShareCapital)
    //   newErrors.paidUpShareCapital = "Paid up share capital is required";
    if (!formData.totalDeposit) newErrors.totalDeposit = "Total Deposit is required";
    // if (!formData.annualTurnover)
    //   newErrors.annualTurnover = "Annual turnover is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const transformToApiPayload = () => {
    return {
      CooperativeRegistrationsConsumer: [
        {
          has_building: formData.hasOfficeBuilding === "yes" ? 1 : 0,

          building_type:
            formData.hasOfficeBuilding === "yes"
              ? officeBuildingTypes.findIndex(
                  (o) => o.value === formData.officeBuildingType,
                ) + 1
              : 0,

          has_store: formData.operatesDepartmentalStore === "yes" ? 1 : 0,

          no_of_outlets:
            formData.operatesDepartmentalStore === "yes"
              ? Number(formData.numberOfOutlets)
              : 0,

          authorised_share: Number(formData.authorizedShareCapital) || null,

          paid_up_share: Number(formData.paidUpShareCapital) || null,

          paid_up_share_date: formData.paidUpShareDate || null,

          total_deposit: Number(formData.totalDeposit) || null,

          pack_total_outstanding_loan:
            Number(formData.packTotalOutstandingLoan) || null,

          annual_turn_over: Number(formData.annualTurnover) || null,

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

      {/* Departmental Store Operations Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          2. Departmental Store Operations
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="2(a). Whether the co-operative society is operating Own Departmental Store/Supermarket?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.operatesDepartmentalStore}
            onChange={(value) =>
              handleInputChange("operatesDepartmentalStore", value)
            }
            name="operatesDepartmentalStore"
            error={errors.operatesDepartmentalStore}
          />

          {formData.operatesDepartmentalStore === "yes" && (
            <Input
              label="2(b). No.of outlets/shops of Cooperative Society"
              type="number"
              value={formData.numberOfOutlets}
              onChange={(e) =>
                handleInputChange("numberOfOutlets", e.target.value)
              }
              placeholder="Enter number of outlets/shops"
              error={errors.numberOfOutlets}
              required
            />
          )}
        </div>
      </Card>

      {/* Share Capital Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          3. Share Capital
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <Input
            label="3(a). Authorised Share Capital (in Rs)"
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
            label="3(b). Paid up Share Capital (in Rs)"
            type="number"
            value={formData.paidUpShareCapital}
            onChange={(e) =>
              handleInputChange("paidUpShareCapital", e.target.value)
            }
            placeholder="Enter paid up share capital amount"
            // error={errors.paidUpShareCapital}
            // required
          />
        </div>
        {/* Paid Up Date + Deposit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <Input
            label="3(c). Total Deposit (in Rs)"
            type="number"
            value={formData.totalDeposit}
            onChange={(e) => handleInputChange("totalDeposit", e.target.value)}
            placeholder="Enter total deposit"
            required
            error={errors.totalDeposit}
          />
          <Input
            label="3(d). Paid Up Share Date"
            type="date"
            value={formData.paidUpShareDate}
            onChange={(e) =>
              handleInputChange("paidUpShareDate", e.target.value)
            }
          />
        </div>

        {/* Outstanding Loan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <Input
            label="3(e). PACK Total Outstanding Loan (in Rs)"
            type="number"
            value={formData.packTotalOutstandingLoan}
            onChange={(e) =>
              handleInputChange("packTotalOutstandingLoan", e.target.value)
            }
            placeholder="Enter outstanding loan"
          />
        </div>
      </Card>

      {/* Annual Turnover Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          4. Annual Turn Over
        </h2>

        <Input
          label="4(a). Annual Turn Over of the Cooperative Society (in Rs)"
          type="number"
          value={formData.annualTurnover}
          onChange={(e) => handleInputChange("annualTurnover", e.target.value)}
          placeholder="Enter annual turnover amount"
          // error={errors.annualTurnover}
          // required
        />
      </Card>

      {/* Facilities Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          5. Facilities
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
              <span className="text-sm text-gray-700 leading-5">
                {option.label}
              </span>
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

export default CooperativeRegistrationsConsumer;
