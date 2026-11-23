import React, { useState } from "react";
import { Input } from "../../components/ui/Input";
import { RadioGroup } from "../../components/ui/RadioGroup";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

interface FormData {
  // Member Details
  individualMembers: string;
  institutionalMembers: string;

  // Product Types
  productType: string;

  // Office Building
  hasOfficeBuilding: string;
  officeBuildingType: string;

  // Share Capital
  authorizedShareCapital: string;
  membersShareCapital: string;
  governmentShareCapital: string;
  paidUpTotal: string;
  paidUpShareDate: string;
  totalDeposit: string;
  packTotalOutstandingLoan: string;

  // Annual Turnover
  annualTurnover: string;

  // Processing Units
  hasProcessingUnit: string;
  numberOfProcessingUnits: string;
  membersDoProcessing: string;
  workDividedBySkill: string;
  providesRawMaterial: string;
  rawMaterialAvailable: string;
  generatesWaste: string;
  wasteManagementAvailable: string;

  // Retail Operations
  operatesRetailShops: string;
  numberOfRetailShops: string;
  sellsOutsideArea: string;
}

const CooperativeRegistrationsProcessing = ({
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
      individualMembers: "",
      institutionalMembers: "",
      productType: "",
      hasOfficeBuilding: "",
      officeBuildingType: "",
      authorizedShareCapital: "",
      membersShareCapital: "",
      governmentShareCapital: "",
      paidUpTotal: "",
      paidUpShareDate: "",
      totalDeposit: "",
      packTotalOutstandingLoan: "",
      annualTurnover: "",
      hasProcessingUnit: "",
      numberOfProcessingUnits: "",
      membersDoProcessing: "",
      workDividedBySkill: "",
      providesRawMaterial: "",
      rawMaterialAvailable: "",
      generatesWaste: "",
      wasteManagementAvailable: "",
      operatesRetailShops: "",
      numberOfRetailShops: "",
      sellsOutsideArea: "",
    },
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const officeBuildingTypes = [
    { value: "1", label: "Own Building" },
    { value: "2", label: "Rented Building" },
    { value: "3", label: "Rent Free Building" },
    { value: "4", label: "Leased Building" },
    { value: "5", label: "Building Provided By Govt" },
  ];

  const productTypeOptions = [
    { value: "1", label: "Agriculture & Allied" },
    { value: "2", label: "Non-Agriculture" },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const calculatePaidUpTotal = () => {
    const members = Number(formData.membersShareCapital) || 0;
    const govt = Number(formData.governmentShareCapital) || 0;
    return members + govt;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.individualMembers)
      newErrors.individualMembers = "Individual promoters count is required";
    if (!formData.institutionalMembers)
      newErrors.institutionalMembers =
        "Institutional promoters count is required";
    if (!formData.productType) {
      newErrors.productType = "Please select product type";
    }
    if (formData.hasOfficeBuilding === "yes" && !formData.officeBuildingType) {
      newErrors.officeBuildingType = "Office building type is required";
    }
    if (!formData.totalDeposit)
      newErrors.totalDeposit = "Total Deposit is required";
    // if (!formData.authorizedShareCapital)
    //   newErrors.authorizedShareCapital = "Authorized share capital is required";
    if (!formData.membersShareCapital)
      newErrors.membersShareCapital = "Promoters share capital is required";
    if (!formData.governmentShareCapital)
      newErrors.governmentShareCapital = "Government share capital is required";
    // if (!formData.annualTurnover)
    //   newErrors.annualTurnover = "Annual turnover is required";
    if (!formData.hasProcessingUnit)
      newErrors.hasProcessingUnit =
        "Please specify if society has processing unit";
    if (
      formData.hasProcessingUnit === "yes" &&
      !formData.numberOfProcessingUnits
    ) {
      newErrors.numberOfProcessingUnits =
        "Number of processing units is required";
    }
    if (!formData.membersDoProcessing)
      newErrors.membersDoProcessing =
        "Please specify if promoters do processing work";
    if (!formData.workDividedBySkill)
      newErrors.workDividedBySkill =
        "Please specify if work is divided by skill";
    if (!formData.providesRawMaterial)
      newErrors.providesRawMaterial =
        "Please specify if society provides raw material";
    if (!formData.rawMaterialAvailable)
      newErrors.rawMaterialAvailable =
        "Please specify if raw material is available";
    if (!formData.generatesWaste)
      newErrors.generatesWaste = "Please specify if waste is generated";
    if (
      formData.generatesWaste === "yes" &&
      !formData.wasteManagementAvailable
    ) {
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
    if (!formData.sellsOutsideArea)
      newErrors.sellsOutsideArea =
        "Please specify if products are sold outside area";

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

    const individual = Number(formData.individualMembers) ;
    const institutional = Number(formData.institutionalMembers);

    const paidUpMembers = Number(formData.membersShareCapital);
    const paidUpGovt = Number(formData.governmentShareCapital);

    return {
      CooperativeRegistrationsProcessing: [
        {
          individual_member: individual || null,
          institutional_member: institutional || null,
          total_member: individual + institutional || null,

          type_society: Number(formData.productType) || null,

          has_building: hasBuilding || null,
          building_type: buildingType || null,

          authorised_share: Number(formData.authorizedShareCapital) || null,

          paid_up_members: paidUpMembers || null,
          paid_up_government_bodies: paidUpGovt || null,
          paid_up_total: calculatePaidUpTotal() || null,

          paid_up_share_date: formData.paidUpShareDate || null,

          total_deposit: Number(formData.totalDeposit) || null,

          pack_total_outstanding_loan:
            Number(formData.packTotalOutstandingLoan) || null,

          annual_turn_over: Number(formData.annualTurnover) || null,

          processing_unit: formData.hasProcessingUnit === "yes" ? 1 : 0,
          processing_unit_number:
            formData.hasProcessingUnit === "yes"
              ? Number(formData.numberOfProcessingUnits)
              : 0,

          processing_by_members: formData.membersDoProcessing === "yes" ? 1 : 0,

          work_divided: formData.workDividedBySkill === "yes" ? 1 : 0,

          product_taken: formData.providesRawMaterial === "yes" ? 1 : 0,

          material_available: formData.rawMaterialAvailable === "yes" ? 1 : 0,

          wastes_generated: formData.generatesWaste === "yes" ? 1 : 0,

          waste_management_facility:
            formData.generatesWaste === "yes" &&
            formData.wasteManagementAvailable === "yes"
              ? 1
              : 0,

          operate_shops: formData.operatesRetailShops === "yes" ? 1 : 0,

          operate_shops_number:
            formData.operatesRetailShops === "yes"
              ? Number(formData.numberOfRetailShops) 
              : 0,

          product_sale_out_of_area: formData.sellsOutsideArea === "yes" ? 1 : 0,
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
      {/* Society and Member Details Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          1. Society: Type of Promoter
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              1(a). Promoter Details of the Cooperative
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="i. Individual"
                value={formData.individualMembers}
                onChange={(e) =>
                  handleInputChange("individualMembers", e.target.value)
                }
                placeholder="Enter individual promoter details"
                error={errors.individualMembers}
                required
              />

              <Input
                label="ii. Institutional"
                value={formData.institutionalMembers}
                onChange={(e) =>
                  handleInputChange("institutionalMembers", e.target.value)
                }
                placeholder="Enter institutional promoter details"
                error={errors.institutionalMembers}
                required
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              1(b). Type of product produced by cooperative society
            </h3>

            <RadioGroup
              options={productTypeOptions}
              value={formData.productType}
              onChange={(value) => handleInputChange("productType", value)}
              name="productType"
              error={errors.productType}
            />
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              1(c). Whether the co-operative society has an office building
            </h3>
            <RadioGroup
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              value={formData.hasOfficeBuilding}
              onChange={(value) =>
                handleInputChange("hasOfficeBuilding", value)
              }
              name="hasOfficeBuilding"
              error={errors.hasOfficeBuilding}
            />
          </div>

          {formData.hasOfficeBuilding === "yes" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                1(d). Type of Office Building
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
          2. Share Capital
        </h2>

        <div className="space-y-6">
          <Input
            label="2(a). Authorized Share Capital (in Rs)"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="i. Promoters"
                type="number"
                value={formData.membersShareCapital}
                onChange={(e) =>
                  handleInputChange("membersShareCapital", e.target.value)
                }
                placeholder="Enter promoters share capital"
                error={errors.membersShareCapital}
                required
              />

              <Input
                label="ii. Government or Government Bodies"
                type="number"
                value={formData.governmentShareCapital}
                onChange={(e) =>
                  handleInputChange("governmentShareCapital", e.target.value)
                }
                placeholder="Enter government share capital"
                error={errors.governmentShareCapital}
                required
              />
            </div>
          </div>

          {/* Paid Up Total + Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <Input
              label="Paid Up Total (in Rs)"
              type="number"
              value={calculatePaidUpTotal()}
              disabled
            />

            <Input
              label="Paid Up Share Date"
              type="date"
              value={formData.paidUpShareDate}
              onChange={(e) =>
                handleInputChange("paidUpShareDate", e.target.value)
              }
            />
          </div>

          {/* Deposit + Loan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <Input
              label="Total Deposit (in Rs)"
              type="number"
              value={formData.totalDeposit}
              onChange={(e) =>
                handleInputChange("totalDeposit", e.target.value)
              }
              placeholder="Enter total deposit"
              error={errors.totalDeposit}
              required
            />

            <Input
              label="PACK Total Outstanding Loan (in Rs)"
              type="number"
              value={formData.packTotalOutstandingLoan}
              onChange={(e) =>
                handleInputChange("packTotalOutstandingLoan", e.target.value)
              }
              placeholder="Enter total outstanding loan"
            />
          </div>
        </div>
      </Card>

      {/* Annual Turnover and Processing Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          3. Annual Turnover and Processing
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

          <RadioGroup
            label="3(b). Whether the cooperative society has Processing Unit or Manufacturing Unit in Operation?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.hasProcessingUnit}
            onChange={(value) => handleInputChange("hasProcessingUnit", value)}
            name="hasProcessingUnit"
            error={errors.hasProcessingUnit}
          />

          {formData.hasProcessingUnit === "yes" && (
            <Input
              label="3(c). Number of Processing Unit or Manufacturing Unit operated by cooperative society"
              type="number"
              value={formData.numberOfProcessingUnits}
              onChange={(e) =>
                handleInputChange("numberOfProcessingUnits", e.target.value)
              }
              placeholder="Enter number of processing units"
              error={errors.numberOfProcessingUnits}
              required
            />
          )}

          <RadioGroup
            label="3(d). Whether the Processing or Manufacturing work is done by promoters themself?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.membersDoProcessing}
            onChange={(value) =>
              handleInputChange("membersDoProcessing", value)
            }
            name="membersDoProcessing"
            error={errors.membersDoProcessing}
          />

          <RadioGroup
            label="3(e). Whether the work is divided among the promoters as per their skill?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.workDividedBySkill}
            onChange={(value) => handleInputChange("workDividedBySkill", value)}
            name="workDividedBySkill"
            error={errors.workDividedBySkill}
          />

          <RadioGroup
            label="3(f). Whether the cooperative society provide raw material to promoters & produced product taken after processing?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.providesRawMaterial}
            onChange={(value) =>
              handleInputChange("providesRawMaterial", value)
            }
            name="providesRawMaterial"
            error={errors.providesRawMaterial}
          />

          <RadioGroup
            label="3(g). Whether the raw material easily available to cooperative society?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.rawMaterialAvailable}
            onChange={(value) =>
              handleInputChange("rawMaterialAvailable", value)
            }
            name="rawMaterialAvailable"
            error={errors.rawMaterialAvailable}
          />

          <RadioGroup
            label="3(h). Whether the wastes are generated in production process?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.generatesWaste}
            onChange={(value) => handleInputChange("generatesWaste", value)}
            name="generatesWaste"
            error={errors.generatesWaste}
          />

          {formData.generatesWaste === "yes" && (
            <RadioGroup
              label="3(i). Whether the waste management facility is available in the society?"
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              value={formData.wasteManagementAvailable}
              onChange={(value) =>
                handleInputChange("wasteManagementAvailable", value)
              }
              name="wasteManagementAvailable"
              error={errors.wasteManagementAvailable}
            />
          )}

          <RadioGroup
            label="3(j). Whether the cooperative society operate retail shops/outlet to sale products?"
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
          />

          {formData.operatesRetailShops === "yes" && (
            <Input
              label="3(k). Number of retail shops/outlets operated by the cooperative society"
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
            label="3(l). Whether products are sale out of the area of operation of the cooperative society?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.sellsOutsideArea}
            onChange={(value) => handleInputChange("sellsOutsideArea", value)}
            name="sellsOutsideArea"
            error={errors.sellsOutsideArea}
          />
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

export default CooperativeRegistrationsProcessing;
