import React, { useState } from "react";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { RadioGroup } from "../../components/ui/RadioGroup";
import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

interface FormData {
  // Office Building
  hasOfficeBuilding: string;
  officeBuildingType: string;

  // Share Capital and Annual Turnover
  authorizedShareCapital: string;
  annualTurnover: string;
  paidUpShareDate: string;
  membersShareCapital: string;
  governmentShareCapital: string;
  paidUpTotal: string;

  totalDeposit: string;
  packTotalOutstandingLoan: string;
  // Raw Materials and Products
  rawMaterialType: string;
  productType: string;

  // Manufacturing Units
  hasManufacturingUnit: string;
  numberOfManufacturingUnits: string;

  // Work Processes
  workDoneByMembers: string;
  courseInternationalParticipant: string;
  providesGuidance: string;

  // Raw Material and Products
  providesRawMaterial: string;
  rawMaterialAvailable: string;

  // Waste Management
  generatesWaste: string;
  wasteManagementAvailable: string;

  // Retail Operations
  operatesRetailShops: string;
  numberOfRetailShops: string;
  sellsOutsideArea: string;

  // Facilities

  facilities: string[];
}

const CooperativeRegistrationsJute = ({
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
    annualTurnover: data?.annualTurnover || "",
    rawMaterialType: data?.rawMaterialType || "",
    productType: data?.productType || "",
    hasManufacturingUnit: data?.hasManufacturingUnit || "",
    numberOfManufacturingUnits: data?.numberOfManufacturingUnits || "",
    workDoneByMembers: data?.workDoneByMembers || "",
    courseInternationalParticipant: data?.courseInternationalParticipant || "",
    providesGuidance: data?.providesGuidance || "",
    providesRawMaterial: data?.providesRawMaterial || "",
    rawMaterialAvailable: data?.rawMaterialAvailable || "",
    generatesWaste: data?.generatesWaste || "",
    wasteManagementAvailable: data?.wasteManagementAvailable || "",
    operatesRetailShops: data?.operatesRetailShops || "",
    numberOfRetailShops: data?.numberOfRetailShops || "",
    sellsOutsideArea: data?.sellsOutsideArea || "",
    facilities: data?.facilities || [],
    membersShareCapital: data?.membersShareCapital || "",
    governmentShareCapital: data?.governmentShareCapital || "",
    paidUpShareDate: data?.paidUpShareDate || "",
    paidUpTotal: data?.paidUpTotal || "",
    totalDeposit: data?.totalDeposit || "",
    packTotalOutstandingLoan: data?.packTotalOutstandingLoan || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const officeBuildingTypes = [
    { value: "1", label: "Own Building" },
    { value: "2", label: "Rented Building" },
    { value: "3", label: "Rent Free Building" },
    { value: "4", label: "Leased Building" },
    { value: "5", label: "Building Provided By Govt" },
  ];

  const rawMaterialOptions = [
    { value: "6", label: "Jute Fibers" },
    { value: "7", label: "Coir Fiber" },
    { value: "8", label: "Coconut Fiber" },
    { value: "9", label: "Other Fibers" },
  ];

  const facilitiesOptions = [
    { value: "1", label: "Do not have basic amenities" },
    { value: "43", label: "Business Correspondence" },
  ];

  const productOptions = [
    { value: "1", label: "Hessian Cloth" },
    { value: "2", label: "Sacking Cloth" },
    { value: "3", label: "Jute yarn and Twines" },
    { value: "4", label: "D.W. Tarpaulin" },
    { value: "5", label: "Canvas" },
    { value: "6", label: "Bags" },
    { value: "7", label: "Hydrocarbon Free Jute Cloth" },
    { value: "8", label: "Geotextiles" },
    { value: "9", label: "Mats" },
    { value: "10", label: "Ropes" },
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.hasOfficeBuilding)
      newErrors.hasOfficeBuilding =
        "Please specify if society has office building";
    if (formData.hasOfficeBuilding === "1" && !formData.officeBuildingType) {
      newErrors.officeBuildingType = "Office building type is required";
    }
    if (!formData.authorizedShareCapital)
      newErrors.authorizedShareCapital = "Authorized share capital is required";
    // if (!formData.annualTurnover)
    //   newErrors.annualTurnover = "Annual turnover is required";
    if (!formData.totalDeposit)
      newErrors.totalDeposit = "Total deposit is required";
    if (!formData.rawMaterialType)
      newErrors.rawMaterialType = "Type of raw material is required";
    if (!formData.productType)
      newErrors.productType = "Type of product produced is required";
    if (!formData.hasManufacturingUnit)
      newErrors.hasManufacturingUnit =
        "Please specify if society has manufacturing unit";
    if (
      formData.hasManufacturingUnit === "1" &&
      !formData.numberOfManufacturingUnits
    ) {
      newErrors.numberOfManufacturingUnits =
        "Number of manufacturing units is required";
    }
    if (!formData.workDoneByMembers)
      newErrors.workDoneByMembers =
        "Please specify if work is done by promoters";
    if (formData.workDoneByMembers === "1" && !formData.providesGuidance) {
      newErrors.providesGuidance =
        "Please specify if guidance/training is provided";
    }
    if (!formData.providesRawMaterial)
      newErrors.providesRawMaterial =
        "Please specify if society provides raw material";
    if (!formData.rawMaterialAvailable)
      newErrors.rawMaterialAvailable =
        "Please specify if raw material is available";
    if (!formData.generatesWaste)
      newErrors.generatesWaste = "Please specify if waste is generated";
    if (formData.generatesWaste === "1" && !formData.wasteManagementAvailable) {
      newErrors.wasteManagementAvailable =
        "Please specify if waste management is available";
    }
    if (!formData.operatesRetailShops)
      newErrors.operatesRetailShops =
        "Please specify if society operates retail shops";
    if (
      formData.operatesRetailShops === "yes" &&
      !formData.numberOfRetailShops
    ) {
      newErrors.numberOfRetailShops = "Number of retail shops is required";
    }
    // if (!formData.sellsOutsideArea)
    //   newErrors.sellsOutsideArea =
    //     "Please specify if products are sold outside area";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const transformToApiPayload = () => {
    const paidUpMembers = Number(formData.membersShareCapital);
    const paidUpGovt = Number(formData.governmentShareCapital);

    return {
      CooperativeRegistrationsJute: [
        {
          facilities: formData.facilities.join(",") || null,
          total_deposit: Number(formData.totalDeposit) || null,
          pack_total_outstanding_loan:
            Number(formData.packTotalOutstandingLoan) || null,
          paid_up_members: paidUpMembers || null,
          paid_up_government_bodies: paidUpGovt || null,
          paid_up_total: paidUpMembers + paidUpGovt || null,
          paid_up_share_date: formData.paidUpShareDate || null,

          has_building: Number(formData.hasOfficeBuilding) || null,

          building_type:
            formData.hasOfficeBuilding === "1"
              ? Number(formData.officeBuildingType)
              : null,

          authorised_share: Number(formData.authorizedShareCapital) || null,
          annual_turn_over: Number(formData.annualTurnover) || null,

          type_raw: formData.rawMaterialType || null,
          type_produce: formData.productType || null,

          common_work_place: Number(formData.hasManufacturingUnit) || null,
          workplace_operate:
            formData.hasManufacturingUnit === "1"
              ? Number(formData.numberOfManufacturingUnits)
              : null,

          is_work_by_member: Number(formData.workDoneByMembers) || null,

          course_international_participant:
            Number(formData.courseInternationalParticipant) || null,

          is_raw_provide: Number(formData.providesRawMaterial) || null,
          is_raw_easy_avail: Number(formData.rawMaterialAvailable) || null,

          is_waste_generate: Number(formData.generatesWaste) || null,
          is_waste_facility: Number(formData.wasteManagementAvailable) || null,

          is_operate_retail: Number(formData.operatesRetailShops) || null,

          no_of_retail:
            formData.operatesRetailShops === "1"
              ? Number(formData.numberOfRetailShops)
              : null,

          is_product_sale_out: Number(formData.sellsOutsideArea) || null,
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

      {/* Share Capital and Annual Turnover Section */}
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
            error={errors.authorizedShareCapital}
            required
          />

          <Input
            label="2(b). Annual Turn Over of the Cooperative Society (in Rs)"
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
            label="2(c). Paid up share capital by members"
            placeholder="Enter paid up members"
            type="number"
            value={formData.membersShareCapital}
            onChange={(e) =>
              handleInputChange("membersShareCapital", e.target.value)
            }
          />

          <Input
            label="2(d). Paid up share capital by government bodies"
            placeholder="Enter paid up share capital"
            type="number"
            value={formData.governmentShareCapital}
            onChange={(e) =>
              handleInputChange("governmentShareCapital", e.target.value)
            }
          />

          <Input
            label="2(e). Paid up total"
            placeholder="Enter paid up total"
            type="number"
            value={
              Number(formData.membersShareCapital) +
              Number(formData.governmentShareCapital)
            }
            readOnly
          />

          <Input
            label="2(f). Paid up share date"
            type="date"
            value={formData.paidUpShareDate}
            onChange={(e) =>
              handleInputChange("paidUpShareDate", e.target.value)
            }
          />
          <Input
            label="2(g). Total Deposit (in Rs)"
            type="number"
            value={formData.totalDeposit}
            onChange={(e) => handleInputChange("totalDeposit", e.target.value)}
            placeholder="Enter total deposit"
            error={errors.totalDeposit}
            required
          />

          <Input
            label="2(h). Total Outstanding Loan (in Rs)"
            type="number"
            value={formData.packTotalOutstandingLoan}
            onChange={(e) =>
              handleInputChange("packTotalOutstandingLoan", e.target.value)
            }
            placeholder="Enter total outstanding loan"
          />
        </div>
      </Card>

      {/* Raw Materials and Products Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          3. Raw Materials and Products
        </h2>

        <div className="space-y-6">
          <Select
            label="3(a). Type of raw material used"
            value={formData.rawMaterialType}
            onChange={(e) =>
              handleInputChange("rawMaterialType", e.target.value)
            }
            placeholder="Select Raw Material"
          >
            {rawMaterialOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            label="3(b). Type of product produced by cooperative society"
            value={formData.productType}
            onChange={(e) => handleInputChange("productType", e.target.value)}
            placeholder="Select Product"
          >
            {productOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Manufacturing Units Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          4. Manufacturing Units
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="4(a). Whether the cooperative society has common working place or manufacturing unit?"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.hasManufacturingUnit}
            onChange={(value) =>
              handleInputChange("hasManufacturingUnit", value)
            }
            name="hasManufacturingUnit"
            error={errors.hasManufacturingUnit}
            required
          />

          {formData.hasManufacturingUnit === "1" && (
            <Input
              label="4(a)(i). Number of work places or manufacturing units operated by cooperative society?"
              type="number"
              value={formData.numberOfManufacturingUnits}
              onChange={(e) =>
                handleInputChange("numberOfManufacturingUnits", e.target.value)
              }
              placeholder="Enter number of manufacturing units"
              error={errors.numberOfManufacturingUnits}
              required
            />
          )}
        </div>
      </Card>

      {/* Work Processes Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          5. Work Processes
        </h2>

        <div className="space-y-6 mb-4">
          <RadioGroup
            label="5(a). Whether the processing or handwork is done by members themselves?"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.workDoneByMembers}
            onChange={(value) => handleInputChange("workDoneByMembers", value)}
            name="workDoneByMembers"
            error={errors.workDoneByMembers}
            required
          />

          {formData.workDoneByMembers === "1" && (
            <RadioGroup
              label="5(a)(i). Whether the regular guidance/training is provided by cooperative society to promoters?"
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

        <RadioGroup
          label="5(b). Whether members participated in international course/training?"
          options={[
            { value: "1", label: "Yes" },
            { value: "0", label: "No" },
          ]}
          value={formData.courseInternationalParticipant}
          onChange={(value) =>
            handleInputChange("courseInternationalParticipant", value)
          }
          name="courseInternationalParticipant"
        />
      </Card>

      {/* Raw Material and Products Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          6. Raw Material and Products
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="6(a). Whether the cooperative society provide raw material to promoters & finished products taken after processing?"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.providesRawMaterial}
            onChange={(value) =>
              handleInputChange("providesRawMaterial", value)
            }
            name="providesRawMaterial"
            error={errors.providesRawMaterial}
            required
          />

          <RadioGroup
            label="6(b). Whether the raw material easily available to cooperative society?"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.rawMaterialAvailable}
            onChange={(value) =>
              handleInputChange("rawMaterialAvailable", value)
            }
            name="rawMaterialAvailable"
            error={errors.rawMaterialAvailable}
            required
          />
        </div>
      </Card>

      {/* Waste Management Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          7. Waste Management
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="7(a). Whether the waste are generated in jute process?"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.generatesWaste}
            onChange={(value) => handleInputChange("generatesWaste", value)}
            name="generatesWaste"
            error={errors.generatesWaste}
            required
          />

          {formData.generatesWaste === "1" && (
            <RadioGroup
              label="7(a)(i). Whether the waste management facility is available in the society?"
              options={[
                { value: "1", label: "Yes" },
                { value: "0", label: "No" },
              ]}
              value={formData.wasteManagementAvailable}
              onChange={(value) =>
                handleInputChange("wasteManagementAvailable", value)
              }
              name="wasteManagementAvailable"
              error={errors.wasteManagementAvailable}
              required
            />
          )}
        </div>
      </Card>

      {/* Retail Operations Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          8. Retail Operations
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="8(a). Whether the cooperative society operate retail shops/outlet to sale products?"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.operatesRetailShops}
            onChange={(value) =>
              handleInputChange("operatesRetailShops", value)
            }
            name="operatesRetailShops"
            error={errors.operatesRetailShops}
            required
          />

          {formData.operatesRetailShops === "1" && (
            <Input
              label="8(a)(i). Number of retail shops/outlets operated by cooperative society?"
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

          <RadioGroup
            label="8(b). Whether the products are sale out of the area of operation of the cooperative society?"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.sellsOutsideArea}
            onChange={(value) => handleInputChange("sellsOutsideArea", value)}
            name="sellsOutsideArea"
            // error={errors.sellsOutsideArea}
            // required
          />
        </div>
      </Card>

      {/* Facilities Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          9. Facilities
        </h2>

        <div className="space-y-3">
          {facilitiesOptions.map((item) => (
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

export default CooperativeRegistrationsJute;
