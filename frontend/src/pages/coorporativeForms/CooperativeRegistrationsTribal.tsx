import React, { useState } from "react";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { RadioGroup } from "../../components/ui/RadioGroup";
import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

interface FormData {
  // SC/ST Type
  scstType: string;

  // Office Building
  hasOfficeBuilding: string;
  officeBuildingType: string;

  // Share Capital
  authorizedShareCapital: string;
  membersShareCapital: string;
  governmentShareCapital: string;
  totalShareCapital: string;
  totalDeposit: string;
  // Annual Turnover
  annualTurnover: string;

  // Federation Work
  federationWorkAllocated: string;

  // Raw Material & Processing
  providesRawMaterial: string;

  // Facilities
  facilities: string[];
}

const CooperativeRegistrationsTribal = ({
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
      scstType: "",
      hasOfficeBuilding: "",
      officeBuildingType: "",
      authorizedShareCapital: "",
      membersShareCapital: "",
      governmentShareCapital: "",
      totalShareCapital: "",
      annualTurnover: "",
      federationWorkAllocated: "",
      providesRawMaterial: "",
      facilities: [],
      totalDeposit: "",
    },
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const facilityOptions = [
    { value: "1", label: "Do not have basic amenities" },
    { value: "32", label: "Health centre / Medical check-up camps" },
    { value: "33", label: "Business Correspondence" },
    { value: "34", label: "Consumer Store / Outlet" },
  ];
  const scstTypes = [
    { value: "1", label: "SC/ST Social Cooperative Society" },
    { value: "2", label: "Forest Product Collecting Cooperative Society" },
    { value: "3", label: "SC/ST Handicraft/Weever Cooperative Society" },
    { value: "5", label: "Primary Minor Forest Producer Cooperative Society" },
    { value: "6", label: "Vandhan Vikas Cooperative Society committee" },
    { value: "4", label: "Any Others" },
  ];

  const officeBuildingTypes = [
    { value: "1", label: "Own Building" },
    { value: "2", label: "Rented Building" },
    { value: "3", label: "Rent Free Building" },
    { value: "4", label: "Leased Building" },
    { value: "5", label: "Building Provided By Govt" },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };
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
  const calculateTotalShareCapital = (
    membersValue: string,
    governmentValue: string,
  ) => {
    const members = parseInt(membersValue);
    const government = parseInt(governmentValue);

    const total = members + government;

    setFormData((prev) => ({
      ...prev,
      membersShareCapital: membersValue,
      governmentShareCapital: governmentValue,
      totalShareCapital: total.toString(),
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.scstType) newErrors.scstType = "SC/ST type is required";
    if (!formData.hasOfficeBuilding)
      newErrors.hasOfficeBuilding =
        "Please specify if society has office building";
    if (formData.hasOfficeBuilding === "1" && !formData.officeBuildingType) {
      newErrors.officeBuildingType = "Office building type is required";
    }
    // if (!formData.authorizedShareCapital)
    //   newErrors.authorizedShareCapital = "Authorized share capital is required";
    if (!formData.membersShareCapital)
      newErrors.membersShareCapital = "Promoters share capital is required";
    if (!formData.governmentShareCapital)
      newErrors.governmentShareCapital = "Government share capital is required";
    // if (!formData.annualTurnover)
    //   newErrors.annualTurnover = "Annual turnover is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const transformToApiPayload = () => {
    return {
      CooperativeRegistrationsTribal: [
        {
          type_society: Number(formData.scstType) || null,

          has_building: Number(formData.hasOfficeBuilding) || null,
          total_deposit: Number(formData.totalDeposit) || null,
          building_type:
            formData.hasOfficeBuilding === "1"
              ? formData.officeBuildingType
              : null,

          authorised_share: Number(formData.authorizedShareCapital) || null,

          paid_up_members: Number(formData.membersShareCapital) || null,

          paid_up_government_bodies:
            Number(formData.governmentShareCapital) || null,

          paid_up_total: Number(formData.totalShareCapital) || null,

          annual_turn_over: Number(formData.annualTurnover) || null,

          state_district_federation:
            Number(formData.federationWorkAllocated) || null,

          society_provide_raw_material:
            Number(formData.providesRawMaterial) || null,

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
      {/* SC/ST Type Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          1. SC/ST Type
        </h2>

        <Select
          label="1(a). Type of SC/ST Cooperative"
          value={formData.scstType}
          onChange={(e) => handleInputChange("scstType", e.target.value)}
          placeholder="Select SC/ST type"
          error={errors.scstType}
          required
        >
          {scstTypes.map((option) => (
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
            label="2(a). Whether the co-operative society has an office building"
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
                2(b). Type of Office Building
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
          3. Share Capital
        </h2>

        <div className="space-y-6">
          <Input
            label="3(a) I. Authorised Share Capital (in Rs)"
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
            label="3(a) II. Total Deposit (in Rs)"
            type="number"
            value={formData.totalDeposit}
            onChange={(e) => handleInputChange("totalDeposit", e.target.value)}
            placeholder="Enter total deposit"
          />

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              3(b). Paid up Share Capital by different Entity
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
                      Promoters
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Input
                        type="number"
                        value={formData.membersShareCapital}
                        onChange={(e) =>
                          calculateTotalShareCapital(
                            e.target.value,
                            formData.governmentShareCapital,
                          )
                        }
                        placeholder="Enter promoters share capital amount"
                        error={errors.membersShareCapital}
                        required
                        className="w-full"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">
                      Government or Government Bodies
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Input
                        type="number"
                        value={formData.governmentShareCapital}
                        onChange={(e) =>
                          calculateTotalShareCapital(
                            formData.membersShareCapital,
                            e.target.value,
                          )
                        }
                        placeholder="Enter government share capital amount"
                        error={errors.governmentShareCapital}
                        required
                        className="w-full"
                      />
                    </td>
                  </tr>
                  <tr className="bg-gray-50 font-semibold">
                    <td className="border border-gray-300 px-4 py-2">Total</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Input
                        type="number"
                        value={formData.totalShareCapital}
                        placeholder="Auto-calculated"
                        disabled
                        className="w-full bg-gray-100"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
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

      {/* Federation Work Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          5. Federation Work
        </h2>

        <RadioGroup
          label="5(a). Whether the work is allotted by State/District Federation to the Society?"
          options={[
            { value: "1", label: "Yes" },
            { value: "0", label: "No" },
          ]}
          value={formData.federationWorkAllocated}
          onChange={(value) =>
            handleInputChange("federationWorkAllocated", value)
          }
          name="federationWorkAllocated"
        />
      </Card>

      {/* Raw Material & Processing Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          6. Raw Material & Processing
        </h2>

        <RadioGroup
          label="6(a). Whether the cooperative society provide raw material to promoters & finished products taken after processing?"
          options={[
            { value: "1", label: "Yes" },
            { value: "0", label: "No" },
          ]}
          value={formData.providesRawMaterial}
          onChange={(value) => handleInputChange("providesRawMaterial", value)}
          name="providesRawMaterial"
        />
      </Card>

      {/* Facilities Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          7. Facilities Available
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {facilityOptions.map((item) => (
            <label key={item.value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                value={item.value}
                checked={formData.facilities.includes(item.value)}
                onChange={() => handleFacilityChange(item.value)}
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

export default CooperativeRegistrationsTribal;
