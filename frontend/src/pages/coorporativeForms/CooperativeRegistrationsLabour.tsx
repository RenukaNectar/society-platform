import React, { useState } from "react";
import { Input } from "../../components/ui/Input";
// import { Select } from "../../components/ui/Select";
import { RadioGroup } from "../../components/ui/RadioGroup";
// import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

interface FormData {
  // Labour Society Type
  labourSocietyType: string;

  // Office Building
  hasOfficeBuilding: string;
  officeBuildingType: string;

  // Work Allocation and Guidance
  workAllocatedByFederation: string;
  guidanceProvidedByFederation: string;

  // Concessions
  stateGovernmentConcession: string;
  centralGovernmentConcession: string;

  // Share Capital
  authorizedShareCapital: string;
  membersShareCapital: string;
  governmentShareCapital: string;
  totalDeposit: string;
  packTotalOutstandingLoan: string;
  // Annual Turnover
  annualTurnover: string;

  // Facilities
  fishCatchInvolvement: string;
  foodProcessingFacilities: string;
  otherFacilities: string;
  facilities: string[];
}

const CooperativeRegistrationsLabour = ({
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
    facilities: data?.facilities ? data.facilities.split(",") : [],
    labourSocietyType: data?.labourSocietyType || "",
    hasOfficeBuilding: data?.hasOfficeBuilding || "",
    officeBuildingType: data?.officeBuildingType || "",
    workAllocatedByFederation: data?.workAllocatedByFederation || "",
    guidanceProvidedByFederation: data?.guidanceProvidedByFederation || "",
    stateGovernmentConcession: data?.stateGovernmentConcession || "",
    centralGovernmentConcession: data?.centralGovernmentConcession || "",
    authorizedShareCapital: data?.authorizedShareCapital || "",
    membersShareCapital: data?.membersShareCapital || "",
    governmentShareCapital: data?.governmentShareCapital || "",
    annualTurnover: data?.annualTurnover || "",
    fishCatchInvolvement: data?.fishCatchInvolvement || "",
    foodProcessingFacilities: data?.foodProcessingFacilities || "",
    otherFacilities: data?.otherFacilities || "",
    totalDeposit: data?.totalDeposit || "",
    packTotalOutstandingLoan: data?.packTotalOutstandingLoan || "",
  });
  console.log("formdata: ", formData);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const facilitiesOptions = [
    { value: "1", label: "Do not have basic amenities" },
    { value: "24", label: "Bargaining for wages/remuneration" },
    { value: "25", label: "Timely payments of wages/remuneration" },
    { value: "26", label: "Health centre / Medical check-up camps" },
    { value: "27", label: "Business Correspondence" },
    { value: "28", label: "Consumer Store / Outlet" },
  ];

  const labourSocietyTypes = [
    {
      value: "1",
      label: "Labour Contract & construction",
    },
    { value: "2", label: "Forest Labour" },
  ];

  const officeBuildingTypes = [
    { value: "1", label: "Own Building" },
    { value: "2", label: "Rented Building" },
    { value: "3", label: "Rent Free Building" },
    { value: "4", label: "Leased Buidling" },
    { value: "5", label: "Buiding Provided By the Government" },
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

    if (!formData.labourSocietyType)
      newErrors.labourSocietyType = "Please select labour society type";
    if (!formData.hasOfficeBuilding)
      newErrors.hasOfficeBuilding =
        "Please specify if society has office building";
    if (formData.hasOfficeBuilding === "1" && !formData.officeBuildingType) {
      newErrors.officeBuildingType = "Office building type is required";
    }
    if (!formData.workAllocatedByFederation)
      newErrors.workAllocatedByFederation =
        "Please specify if work is allocated by federation";
    if (!formData.guidanceProvidedByFederation)
      newErrors.guidanceProvidedByFederation =
        "Please specify if guidance/training is provided";
    if (!formData.stateGovernmentConcession)
      newErrors.stateGovernmentConcession =
        "Please specify if state government concession is availed";
    if (!formData.centralGovernmentConcession)
      newErrors.centralGovernmentConcession =
        "Please specify if central government concession is availed";
    // if (!formData.authorizedShareCapital)
    //   newErrors.authorizedShareCapital = "Authorized share capital is required";
    // if (!formData.membersShareCapital)
    //   newErrors.membersShareCapital = "Promoters share capital is required";
    // if (!formData.governmentShareCapital)
    //   newErrors.governmentShareCapital = "Government share capital is required";
    // if (!formData.annualTurnover)
    //   newErrors.annualTurnover = "Annual turnover is required";
    if (!formData.totalDeposit)
      newErrors.totalDeposit = "Total deposit is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const transformToApiPayload = () => {
    // const labourTypeMap: Record<string, number> = {
    //   labour_contract_construction: 1,
    //   forest_labour: 2,
    // };

    const hasBuilding = Number(formData.hasOfficeBuilding);

    const buildingType =
      hasBuilding === 1
        ? officeBuildingTypes.findIndex(
            (o) => o.value === formData.officeBuildingType,
          ) + 1
        : null;

    const paidUpMembers = Number(formData.membersShareCapital);
    const paidUpGovt = Number(formData.governmentShareCapital);

    return {
      CooperativeRegistrationsLabour: [
        {
          type_society: Number(formData.labourSocietyType) || null,

          has_building: hasBuilding || null,
          building_type: buildingType || null,

          work_allot_state_dist_federation:
            Number(formData.workAllocatedByFederation) || null,

          work_guide_state_dist_federation:
            Number(formData.guidanceProvidedByFederation) || null,

          concession_state_gov:
            Number(formData.stateGovernmentConcession) || null,

          concession_centre_gov:
            Number(formData.centralGovernmentConcession) || null,

          authorised_share: Number(formData.authorizedShareCapital) || null,

          paid_up_members: paidUpMembers || null,
          paid_up_government_bodies: paidUpGovt || null,
          paid_up_total: paidUpMembers + paidUpGovt || null,

          annual_turn_over: Number(formData.annualTurnover) || null,
          total_deposit: Number(formData.totalDeposit) || null,
          pack_total_outstanding_loan:
            Number(formData.packTotalOutstandingLoan) || null,
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
      {/* Labour Society Type Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          1. Labour Society Type
        </h2>

        <RadioGroup
          label="1(a). Type of Labour Society"
          options={labourSocietyTypes}
          value={formData.labourSocietyType}
          onChange={(value) => handleInputChange("labourSocietyType", value)}
          name="labourSocietyType"
          error={errors.labourSocietyType}
          required
        />
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

      {/* Work Allocation and Guidance Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          3. Work Allocation and Guidance
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="3(a). Whether the work is alloted by State/District Federation to the Society?"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.workAllocatedByFederation}
            onChange={(value) =>
              handleInputChange("workAllocatedByFederation", value)
            }
            name="workAllocatedByFederation"
            error={errors.workAllocatedByFederation}
            required
          />

          <RadioGroup
            label="3(b). Whether the proper guidance/training for execution of the work provided by State/District Federation?"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.guidanceProvidedByFederation}
            onChange={(value) =>
              handleInputChange("guidanceProvidedByFederation", value)
            }
            name="guidanceProvidedByFederation"
            error={errors.guidanceProvidedByFederation}
            required
          />
        </div>
      </Card>

      {/* Concessions Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          4. Government Concessions
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="4(a). Whether cooperative availing any Concession provided by State Government?"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.stateGovernmentConcession}
            onChange={(value) =>
              handleInputChange("stateGovernmentConcession", value)
            }
            name="stateGovernmentConcession"
            error={errors.stateGovernmentConcession}
            required
          />

          <RadioGroup
            label="4(b). Whether cooperative availing any Concession provided by Centre Government?"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.centralGovernmentConcession}
            onChange={(value) =>
              handleInputChange("centralGovernmentConcession", value)
            }
            name="centralGovernmentConcession"
            error={errors.centralGovernmentConcession}
            required
          />
        </div>
      </Card>

      {/* Share Capital Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          5. Share Capital
        </h2>

        <div className="space-y-6">
          <Input
            label="5(a). Authorised Share Capital (in Rs)"
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
            label="5(b). Total Deposit (in Rs)"
            type="number"
            value={formData.totalDeposit}
            onChange={(e) => handleInputChange("totalDeposit", e.target.value)}
            placeholder="Enter total deposit"
            error={errors.totalDeposit}
            required
          />

          <Input
            label="5(c). Pack Total Outstanding Loan (in Rs)"
            type="number"
            value={formData.packTotalOutstandingLoan}
            onChange={(e) =>
              handleInputChange("packTotalOutstandingLoan", e.target.value)
            }
            placeholder="Enter outstanding loan"
          />

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              5(d). Paid up Share Capital by different Entity
            </h3>
            <div className="space-y-4">
              <Input
                label="5(d)(i). Promoters"
                type="number"
                value={formData.membersShareCapital}
                onChange={(e) =>
                  handleInputChange("membersShareCapital", e.target.value)
                }
                placeholder="Enter promoters share capital amount"
                // error={errors.membersShareCapital}
                // required
              />

              <Input
                label="5(d)(ii). Government or Government Bodies"
                type="number"
                value={formData.governmentShareCapital}
                onChange={(e) =>
                  handleInputChange("governmentShareCapital", e.target.value)
                }
                placeholder="Enter government share capital amount"
                // error={errors.governmentShareCapital}
                // required
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Annual Turnover Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          6. Annual Turnover
        </h2>

        <Input
          label="6(a). Annual Turn Over of the Cooperative Society (in Rs)"
          type="number"
          value={formData.annualTurnover}
          onChange={(e) => handleInputChange("annualTurnover", e.target.value)}
          placeholder="Enter annual turnover amount"
          // error={errors.annualTurnover}
          // required
        />
      </Card>

      {/* Facilities Section */}
      {/* <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          7. Facilities
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="5(o). Whether Cooperative Society is involved in fish catch"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.fishCatchInvolvement}
            onChange={(value) =>
              handleInputChange("fishCatchInvolvement", value)
            }
            name="fishCatchInvolvement"
          />

          <Textarea
            label="5(q). Food Processing Facilities"
            value={formData.foodProcessingFacilities}
            onChange={(e) =>
              handleInputChange("foodProcessingFacilities", e.target.value)
            }
            placeholder="Describe the food processing facilities available"
            rows={3}
          />

          <Textarea
            label="5(s). Other Facilities Provided (Please Specify)"
            value={formData.otherFacilities}
            onChange={(e) =>
              handleInputChange("otherFacilities", e.target.value)
            }
            placeholder="Describe any other facilities provided by the cooperative society"
            rows={4}
          />
        </div>
      </Card> */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          7. Facilities
        </h2>

        <div className="grid grid-cols-2 gap-3">
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

export default CooperativeRegistrationsLabour;
