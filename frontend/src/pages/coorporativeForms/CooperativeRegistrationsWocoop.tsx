import React, { useState } from "react";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { RadioGroup } from "../../components/ui/RadioGroup";
// import { Textarea } from '../../components/ui/Textarea';
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

interface FormData {
  // Women Cooperative Type
  womenCooperativeType: string;

  // Office Building
  hasOfficeBuilding: string;
  officeBuildingType: string;

  // Share Capital
  authorizedShareCapital: string;
  totalDeposit: string;

  // Annual Turnover
  annualTurnover: string;

  // Raw Material & Processing
  providesRawMaterial: string;

  facilities: string[];
}

const CooperativeRegistrationsWocoop = ({
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
  const [formData, setFormData] = useState<FormData>(
    data || {
      womenCooperativeType: "",
      hasOfficeBuilding: "",
      officeBuildingType: "",
      authorizedShareCapital: "",
      totalDeposit: "",
      annualTurnover: "",
      providesRawMaterial: "",
      facilities: [],
    },
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const womenCooperativeTypes = [
    {
      value: "1",
      label: "Women Social Welfare & Cultural Cooperative Society",
    },
    { value: "2", label: "Women Credit Cooperative Society" },
    { value: "3", label: "Women Marketing & Consumer Cooperative Society" },
    { value: "4", label: "Women Handicraft/Weever Cooperative Society" },
    { value: "5", label: "Any Other" },
  ];

  const officeBuildingTypes = [
    { value: "1", label: "Own Building" },
    { value: "2", label: "Rented Building" },
    { value: "3", label: "Rent Free Building" },
    { value: "4", label: "Leased Building" },
    { value: "5", label: "Building Provided By Govt" },
  ];

  const facilitiesOptions = [
    { value: "1", label: "Do not have basic amenities" },
    { value: "51", label: "Health centre/Medical check-up camps" },
    { value: "52", label: "Business Correspondence" },
    { value: "53", label: "Consumer Store/Outlet" },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleFacilitiesChange = (value: string) => {
    setFormData((prev) => {
      const exists = prev.facilities.includes(value);

      const updated = exists
        ? prev.facilities.filter((v) => v !== value)
        : [...prev.facilities, value];

      return { ...prev, facilities: updated };
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.womenCooperativeType)
      newErrors.womenCooperativeType = "Women cooperative type is required";
    if (!formData.hasOfficeBuilding)
      newErrors.hasOfficeBuilding =
        "Please specify if society has office building";
    if (formData.hasOfficeBuilding === "yes" && !formData.officeBuildingType) {
      newErrors.officeBuildingType = "Office building type is required";
    }
    // if (!formData.authorizedShareCapital)
    //   newErrors.authorizedShareCapital = "Authorized share capital is required";
    // if (!formData.annualTurnover)
    //   newErrors.annualTurnover = "Annual turnover is required";
    if (!formData.totalDeposit)
      newErrors.totalDeposit = "Total deposit is required";
    if (!formData.providesRawMaterial)
      newErrors.providesRawMaterial =
        "Please specify if society provides raw material";

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
      CooperativeRegistrationsWocoop: [
        {
          type_society: formData.womenCooperativeType || null,

          has_building: hasBuilding || null,
          building_type: buildingType || null,

          authorised_share:Number(formData.authorizedShareCapital) || null,

          total_deposit:Number(formData.totalDeposit) || null,

          annual_turn_over: Number(formData.annualTurnover) || null,

          facilities:
            formData.facilities.length > 0
              ? formData.facilities.join(",")
              : 0,

          is_raw_material_taken: formData.providesRawMaterial === "yes" ? 1 : 0,
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
      {/* Women Cooperative Type Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          1. Women Cooperative Type
        </h2>

        <Select
          label="1(a). Type of Women Cooperative"
          value={formData.womenCooperativeType}
          onChange={(e) =>
            handleInputChange("womenCooperativeType", e.target.value)
          }
          placeholder="Select women cooperative type"
          error={errors.womenCooperativeType}
          required
        >
          {womenCooperativeTypes.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Card>

      {/* Office Building Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          2. Office Building
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="2(b). Whether the co-operative society has an office building"
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
                2(b)(i). Type of Office Building
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

      {/* Share Capital Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          3. Share Capital
        </h2>

        <div className="mb-4">
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
        </div>

        <Input
          label="3(b). Total Deposit (in Rs)"
          type="number"
          value={formData.totalDeposit}
          onChange={(e) => handleInputChange("totalDeposit", e.target.value)}
          placeholder="Enter total deposit"
          error={errors.totalDeposit}
          required
        />
      </Card>

      {/* Annual Turnover Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          4. Annual Turnover
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

      {/* Raw Material & Processing Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          5. Raw Material & Processing
        </h2>

        <RadioGroup
          label="5(a). Whether the cooperative society provide raw material to promoters & finished products taken after processing?"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          value={formData.providesRawMaterial}
          onChange={(value) => handleInputChange("providesRawMaterial", value)}
          name="providesRawMaterial"
          error={errors.providesRawMaterial}
        />
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          6. Facilities
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {facilitiesOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.facilities.includes(option.value)}
                onChange={() => handleFacilitiesChange(option.value)}
              />
              {option.label}
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

export default CooperativeRegistrationsWocoop;
