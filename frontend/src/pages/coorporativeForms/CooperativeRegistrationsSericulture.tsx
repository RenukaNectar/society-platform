import React, { useState } from "react";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { RadioGroup } from "../../components/ui/RadioGroup";
import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

interface FormData {
  // Silkworm Rearing Type
  silkwormRearingType: string;

  // Office Building
  hasOfficeBuilding: string;
  officeBuildingType: string;

  // Share Capital
  authorizedShareCapital: string;

  // Annual Turnover
  annualTurnover: string;
  totalDeposit: string;

  // Rearing House
  hasRearingHouse: string;
  numberOfRearingHouses: string;

  // Member Rearing and Training
  membersDoRearing: string;
  providesGuidance: string;

  // Rearing Appliances
  hasRearingAppliances: string;

  // Mulberry Leaves
  mulberryLeavesAvailable: string;

  // Cocoon Cleaning
  hasCocoonCleaning: string;

  // Spinning and Weaving
  hasSpinningWeaving: string;

  // Waste Management
  hasWasteManagement: string;

  // Retail Operations
  operatesRetailShops: string;
  numberOfRetailShops: string;

  // Facilities
  facilities: string[];
}

const CooperativeRegistrationsSericulture = ({
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
      silkwormRearingType: "",
      hasOfficeBuilding: "",
      officeBuildingType: "",
      authorizedShareCapital: "",
      annualTurnover: "",
      totalDeposit: "",
      hasRearingHouse: "",
      numberOfRearingHouses: "",
      membersDoRearing: "",
      providesGuidance: "",
      hasRearingAppliances: "",
      mulberryLeavesAvailable: "",
      hasCocoonCleaning: "",
      hasSpinningWeaving: "",
      hasWasteManagement: "",
      operatesRetailShops: "",
      numberOfRetailShops: "",
      facilities: [],
    },
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const silkwormRearingTypes = [
    { value: "1", label: "Mulberry silkworm" },
    { value: "2", label: "Eri silkworm" },
    { value: "3", label: "Muga Silkworm" },
    { value: "4", label: "Tasar/Oak Tasar Silkworm" },
    { value: "5", label: "Others" },
  ];

  const officeBuildingTypes = [
    { value: "1", label: "Own Building" },
    { value: "2", label: "Rented Building" },
    { value: "3", label: "Rent Free Building" },
    { value: "4", label: "Leased Building" },
    { value: "5", label: "Building Provided By Govt" },
  ];
  const facilityOptions = [
    { value: "1", label: "Do not have basic amenities" },
    { value: "50", label: "Business Correspondence" },
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

      const updated = exists
        ? prev.facilities.filter((v) => v !== value)
        : [...prev.facilities, value];

      return { ...prev, facilities: updated };
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // if (!formData.silkwormRearingType)
    //   newErrors.silkwormRearingType = "Silkworm rearing type is required";
    if (!formData.hasOfficeBuilding)
      newErrors.hasOfficeBuilding =
        "Please specify if society has office building";
    if (formData.hasOfficeBuilding === "yes" && !formData.officeBuildingType) {
      newErrors.officeBuildingType = "Office building type is required";
    }
    if (!formData.authorizedShareCapital)
      newErrors.authorizedShareCapital = "Authorized share capital is required";
    // if (!formData.annualTurnover)
    //   newErrors.annualTurnover = "Annual turnover is required";
    if (!formData.totalDeposit)
      newErrors.totalDeposit = "Total deposit is required";
    if (!formData.hasRearingHouse)
      newErrors.hasRearingHouse = "Rearing house is required";
    if (!formData.numberOfRearingHouses)
      newErrors.numberOfRearingHouses = "Number of rearing house is required";
    if (!formData.membersDoRearing)
      newErrors.membersDoRearing = "Work done is required";
    if (!formData.providesGuidance)
      newErrors.providesGuidance = "Guidance/Training is required";
    if (!formData.hasRearingAppliances)
      newErrors.hasRearingAppliances = "Rearing appliances is required";
    if (!formData.mulberryLeavesAvailable)
      newErrors.mulberryLeavesAvailable = "Mulberry leaves is required";
    if (!formData.hasCocoonCleaning)
      newErrors.hasCocoonCleaning = "Cocoon cleaning is required";
    if (!formData.hasSpinningWeaving)
      newErrors.hasSpinningWeaving = "Spinning weaving is required";
    if (!formData.hasWasteManagement)
      newErrors.hasWasteManagement = "Waste management is required";
    if (!formData.operatesRetailShops)
      newErrors.operatesRetailShops = "Retail shops is required ";
    if (!formData.numberOfRetailShops)
      newErrors.numberOfRetailShops = "Number of retail shop is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const transformToApiPayload = () => {
    return {
      CooperativeRegistrationsSericulture: [
        {
          type_society: formData.silkwormRearingType || null,

          has_building: formData.hasOfficeBuilding === "yes" ? 1 : 0,

          building_type:
            formData.hasOfficeBuilding === "yes"
              ? formData.officeBuildingType
              : 0,

          authorised_share: Number(formData.authorizedShareCapital) || null,

          annual_turn_over: Number(formData.annualTurnover) || null,

          total_deposit: Number(formData.totalDeposit) || null,

          common_work_place: formData.hasRearingHouse === "yes" ? 1 : 0,

          no_rear_house:
            formData.hasRearingHouse === "yes"
              ? Number(formData.numberOfRearingHouses) 
              : 0,

          is_work_by_member: formData.membersDoRearing === "yes" ? 1 : 0,

          is_training_provide: formData.providesGuidance === "yes" ? 1 : 0,

          is_rear_appliance: formData.hasRearingAppliances === "yes" ? 1 : 0,

          is_mulberry_easy_available:
            formData.mulberryLeavesAvailable === "yes" ? 1 : 0,

          is_cleaning_facility_cocoon:
            formData.hasCocoonCleaning === "yes" ? 1 : 0,

          is_spinning_weav: formData.hasSpinningWeaving === "yes" ? 1 : 0,

          is_waste_facility: formData.hasWasteManagement === "yes" ? 1 : 0,

          is_operate_retail: formData.operatesRetailShops === "yes" ? 1 : 0,

          no_of_retail:
            formData.operatesRetailShops === "yes"
              ? Number(formData.numberOfRetailShops) 
              : 0,

          facilities:
            formData.facilities.length > 0
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
      {/* Silkworm Rearing Type Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          1. Silkworm Rearing Type
        </h2>

        <Select
          label="11(a). Type of Silkworm rearing is carried out by cooperative"
          value={formData.silkwormRearingType}
          onChange={(e) =>
            handleInputChange("silkwormRearingType", e.target.value)
          }
          placeholder="Select silkworm rearing type"
          // error={errors.silkwormRearingType}
          // required
        >
          {silkwormRearingTypes.map((option) => (
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
            label="11(b). Whether the co-operative society has an office building"
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
                11(b)(i). Type of Office Building
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

        <Input
          label="12(a). Authorised Share Capital (in Rs)"
          type="number"
          value={formData.authorizedShareCapital}
          onChange={(e) =>
            handleInputChange("authorizedShareCapital", e.target.value)
          }
          placeholder="Enter authorized share capital amount"
          error={errors.authorizedShareCapital}
          required
        />
      </Card>

      {/* Annual Turnover Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          4. Annual Turnover
        </h2>

        <div className="mb-4">
          <Input
            label="13(a). Annual Turn Over of the Cooperative Society (in Rs)"
            type="number"
            value={formData.annualTurnover}
            onChange={(e) =>
              handleInputChange("annualTurnover", e.target.value)
            }
            placeholder="Enter annual turnover amount"
            // error={errors.annualTurnover}
            // required
          />
        </div>

        <Input
          label="13(b). Total Deposit of the Cooperative Society"
          type="number"
          value={formData.totalDeposit}
          onChange={(e) => handleInputChange("totalDeposit", e.target.value)}
          placeholder="Enter annual turnover amount"
          error={errors.totalDeposit}
          required
        />
      </Card>

      {/* Rearing House Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          5. Rearing House
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="13(b). Whether the cooperative society has common rearing house?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.hasRearingHouse}
            onChange={(value) => handleInputChange("hasRearingHouse", value)}
            name="hasRearingHouse"
            error={errors.hasRearingHouse}
            required
          />

          {formData.hasRearingHouse === "yes" && (
            <Input
              label="13(b)(i). Number of rearing houses operated by cooperative society"
              type="number"
              value={formData.numberOfRearingHouses}
              onChange={(e) =>
                handleInputChange("numberOfRearingHouses", e.target.value)
              }
              placeholder="Enter number of rearing houses"
              error={errors.numberOfRearingHouses}
              required
            />
          )}
        </div>
      </Card>

      {/* Member Rearing and Training Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          6. Member Rearing and Training
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="13(c). Whether the rearing of silkworm is done by member themself?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.membersDoRearing}
            onChange={(value) => handleInputChange("membersDoRearing", value)}
            name="membersDoRearing"
            error={errors.membersDoRearing}
            required
          />

          {formData.membersDoRearing === "yes" && (
            <RadioGroup
              label="13(c)(i). Whether the regular guidance/training is provided by cooperative society to members?"
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              value={formData.providesGuidance}
              onChange={(value) => handleInputChange("providesGuidance", value)}
              name="providesGuidance"
              error={errors.providesGuidance}
              required
            />
          )}
        </div>
      </Card>

      {/* Rearing Appliances Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          7. Rearing Appliances
        </h2>

        <RadioGroup
          label="13(d). Whether the cooperative society has sufficient rearing appliances for rearing house?"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          value={formData.hasRearingAppliances}
          onChange={(value) => handleInputChange("hasRearingAppliances", value)}
          name="hasRearingAppliances"
          error={errors.hasRearingAppliances}
          required
        />
      </Card>

      {/* Mulberry Leaves Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          8. Mulberry Leaves
        </h2>

        <RadioGroup
          label="13(e). Whether mulberry leaves are easily available to cooperative society?"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          value={formData.mulberryLeavesAvailable}
          onChange={(value) =>
            handleInputChange("mulberryLeavesAvailable", value)
          }
          name="mulberryLeavesAvailable"
          error={errors.mulberryLeavesAvailable}
          required
        />
      </Card>

      {/* Cocoon Cleaning Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          9. Cocoon Cleaning
        </h2>

        <RadioGroup
          label="13(f). Whether the cleaning facility of cocoon is available with cooperative society?"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          value={formData.hasCocoonCleaning}
          onChange={(value) => handleInputChange("hasCocoonCleaning", value)}
          name="hasCocoonCleaning"
          error={errors.hasCocoonCleaning}
          required
        />
      </Card>

      {/* Spinning and Weaving Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          10. Spinning and Weaving
        </h2>

        <RadioGroup
          label="13(g). Whether the spinning & weaving activities are carried out by cooperative society?"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          value={formData.hasSpinningWeaving}
          onChange={(value) => handleInputChange("hasSpinningWeaving", value)}
          name="hasSpinningWeaving"
          error={errors.hasSpinningWeaving}
          required
        />
      </Card>

      {/* Waste Management Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          11. Waste Management
        </h2>

        <RadioGroup
          label="13(h). Whether the waste management facility is available in the society?"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          value={formData.hasWasteManagement}
          onChange={(value) => handleInputChange("hasWasteManagement", value)}
          name="hasWasteManagement"
          error={errors.hasWasteManagement}
          required
        />
      </Card>

      {/* Retail Operations Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          12. Retail Operations
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="13(i). Whether the cooperative society operate retail shops/outlet to sale products?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.operatesRetailShops}
            onChange={(value) =>
              handleInputChange("operatesRetailShops", value)
            }
            name="operatesRetailShops"
            error={errors.operatesRetailShops}
            required
          />

          {formData.operatesRetailShops === "yes" && (
            <Input
              label="13(j)(i). Number of retail shops/outlets operated by cooperative society"
              type="number"
              value={formData.numberOfRetailShops}
              onChange={(e) =>
                handleInputChange("numberOfRetailShops", e.target.value)
              }
              placeholder="Enter number of retail shops"
              error={errors.numberOfRetailShops}
              required
            />
          )}
        </div>
      </Card>

      {/* Facilities Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          13. Facilities
        </h2>

        <div className="space-y-3">
          {facilityOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-3">
              <input
                type="checkbox"
                value={option.value}
                checked={formData.facilities.includes(option.value)}
                onChange={() => handleFacilityChange(option.value)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <span className="text-gray-700">{option.label}</span>
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

export default CooperativeRegistrationsSericulture;
