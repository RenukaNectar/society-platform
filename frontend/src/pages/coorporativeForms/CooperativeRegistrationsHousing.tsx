import React, { useState } from "react";
import { Input } from "../../components/ui/Input";
// import { Select } from "../../components/ui/Select";
import { RadioGroup } from "../../components/ui/RadioGroup";
// import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

interface FormData {
  // Housing Society Type
  housingSocietyType: string;
  paidUpShareDate: string;
  // Office Building
  hasOfficeBuilding: string;
  officeBuildingType: string;

  // Land Details
  hasLand: string;
  ownedLand: string;
  leasedLand: string;
  governmentAllottedLand: string;

  // Share Capital
  authorizedShareCapital: string;
  membersShareCapital: string;
  governmentShareCapital: string;

  // Annual Financials
  annualTurnover: string;
  annualExpenses: string;
  processing_unit: string;

  // Housing Construction
  housesCompleted: string;
  housesHandover: string;
  housesUnderConstruction: string;

  // Facilities
  totalDeposit: string;
  facilities: string[];
  // Loan Facilitation
  facilitatesLoan: string;
  pack_total_outstanding_loan: string;
}

const CooperativeRegistrationsHousing = ({
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
    facilities: data?.facilities || [],
    housingSocietyType: data?.housingSocietyType || "",
    paidUpShareDate: data?.paidUpShareDate || "",
    totalDeposit: data?.totalDeposit || "",
    hasOfficeBuilding: data?.hasOfficeBuilding || "",
    officeBuildingType: data?.officeBuildingType || "",
    hasLand: data?.hasLand || "",
    ownedLand: data?.ownedLand || "",
    leasedLand: data?.leasedLand || "",
    governmentAllottedLand: data?.governmentAllottedLand || "",
    authorizedShareCapital: data?.authorizedShareCapital || "",
    membersShareCapital: data?.membersShareCapital || "",
    governmentShareCapital: data?.governmentShareCapital || "",
    annualTurnover: data?.annualTurnover || "",
    annualExpenses: data?.annualExpenses || "",
    processing_unit: data?.processing_unit || "",
    housesCompleted: data?.housesCompleted || "",
    housesHandover: data?.housesHandover || "",
    housesUnderConstruction: data?.housesUnderConstruction || "",

    facilitatesLoan: data?.facilitatesLoan || "",
    pack_total_outstanding_loan: data?.pack_total_outstanding_loan || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const housingSocietyTypes = [
    {
      value: "1",
      label: "House construction or house building society",
    },
    { value: "2", label: "Group housing society" },
    { value: "3", label: "Tenant ownership housing society" },
    {
      value: "4",
      label: "Tenant co-partnership housing societies",
    },
    {
      value: "5",
      label: "Housing mortgage societies",
    },
    {
      value: "6",
      label: "Housing Service Cooperative Societies",
    },
    {
      value: "7",
      label: "Cooperative Housing Maintenance Societies",
    },
    {
      value: "8",
      label: "Cooperative Housing Societies",
    },
    {
      value: "9",
      label: "Cooperative Building Societies",
    },
    {
      value: "10",
      label: "Cooperative House Building Societies",
    },
    {
      value: "11",
      label: "Cooperative Construction Societies",
    },
    {
      value: "12",
      label: "Cooperative House site Societies",
    },
    {
      value: "13",
      label: "Taluk Cooperative Housing Societies",
    },
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
    { value: "2", label: "Consumer Store / Fair Price Shop" },
    { value: "3", label: "Sports complex / playground / park" },
    { value: "4", label: "Community Hall" },
    { value: "5", label: "Health centre / Medical check-up camps" },
    { value: "6", label: "Transport service" },
    { value: "7", label: "Creches / common room" },
    { value: "8", label: "School" },
    { value: "9", label: "Shopping centre" },
    { value: "10", label: "Convention Centre" },
    { value: "11", label: "Auditorium" },
    { value: "30", label: "Electricity" },
    { value: "31", label: "Water" },
    { value: "65", label: "Banking Counter" },
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

    if (!formData.housingSocietyType)
      newErrors.housingSocietyType = "Please select housing society type";
    if (!formData.housingSocietyType)
      newErrors.housingSocietyType = "Please select housing society type";
    if (!formData.hasOfficeBuilding)
      newErrors.hasOfficeBuilding =
        "Please specify if society has office building";
    if (formData.hasOfficeBuilding === "yes" && !formData.officeBuildingType) {
      newErrors.officeBuildingType = "Office building type is required";
    }
    if (!formData.hasLand)
      newErrors.hasLand = "Please specify if society has land";
    if (formData.hasLand === "yes") {
      if (
        !formData.ownedLand &&
        !formData.leasedLand &&
        !formData.governmentAllottedLand
      ) {
        newErrors.ownedLand = "At least one land type must be specified";
      }
    }
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
    if (!formData.annualExpenses)
      newErrors.annualExpenses = "Annual expenses is required";
    if (!formData.housesCompleted)
      newErrors.housesCompleted = "Number of houses completed is required";
    if (!formData.housesHandover)
      newErrors.housesHandover = "Number of houses handover is required";
    if (!formData.housesUnderConstruction)
      newErrors.housesUnderConstruction =
        "Number of houses under construction is required";
    // if (!formData.facilitatesLoan)
    //   newErrors.facilitatesLoan = "Please specify if society facilitates loans";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const transformToApiPayload = () => {
    const paidUpMembers = Number(formData.membersShareCapital);
    const paidUpGovt = Number(formData.governmentShareCapital);

    return {
      CooperativeRegistrationsHousing: [
        {
          facilities: formData.facilities.join(",") || null,

          has_building: Number(formData.hasOfficeBuilding) || null,

          building_type:
            formData.hasOfficeBuilding === "1"
              ? Number(formData.officeBuildingType)
              : null,

          has_land: Number(formData.hasLand) || null,

          type_society: Number(formData.housingSocietyType) || null,

          authorised_share: Number(formData.authorizedShareCapital) || null,

          paid_up_share_date: formData.paidUpShareDate || null,

          paid_up_members: paidUpMembers || null,
          paid_up_government_bodies: paidUpGovt || null,
          paid_up_total: paidUpMembers + paidUpGovt || null,

          pack_total_outstanding_loan:
            Number(formData.pack_total_outstanding_loan) || null,

          total_deposit: Number(formData.totalDeposit) || null,

          annual_turn_over: Number(formData.annualTurnover) || null,

          processing_unit: Number(formData.processing_unit) || null,

          loan_facilities: Number(formData.facilitatesLoan) || null,

          individual_member: Number(formData.housesCompleted) || null,
          institutional_member: Number(formData.housesHandover) || null,

          annual_expenses: Number(formData.annualExpenses) || null,

          number_of_houses_audit_year: Number(formData.housesCompleted) || null,

          number_of_houses_during_year: Number(formData.housesHandover) || null,

          number_of_houses_construction:
            Number(formData.housesUnderConstruction) || null,
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
      {/* Housing Society Type Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          1. Housing Society Type
        </h2>

        <select
          className="p-2 w-full rounded-lg bg-transparent border border-gray-900 text-gray-900"
          id="housingSocietyType"
          name="housingSocietyType"
          value={formData.housingSocietyType}
          onChange={(e) =>
            handleInputChange("housingSocietyType", e.target.value)
          }
        >
          <option value="">Select Housing Society Type</option>

          {housingSocietyTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        {errors.housingSocietyType && (
          <p className="text-red-500 text-sm mt-1">
            {errors.housingSocietyType}
          </p>
        )}
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

      {/* Land Details Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          3. Land Details
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="3(a). Whether the co-operative society has land"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.hasLand}
            onChange={(value) => handleInputChange("hasLand", value)}
            name="hasLand"
            error={errors.hasLand}
            required
          />

          {formData.hasLand === "1" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                3(b). Detail of Land Available with the Cooperative
              </h3>
              <div className="space-y-4">
                <Input
                  label="3(b)(i). Owned land in acre"
                  type="number"
                  value={formData.ownedLand}
                  onChange={(e) =>
                    handleInputChange("ownedLand", e.target.value)
                  }
                  placeholder="Enter owned land in acres"
                  step="0.01"
                />

                <Input
                  label="3(b)(ii). Leased land in acre"
                  type="number"
                  value={formData.leasedLand}
                  onChange={(e) =>
                    handleInputChange("leasedLand", e.target.value)
                  }
                  placeholder="Enter leased land in acres"
                  step="0.01"
                />

                <Input
                  label="3(b)(iii). Land allotted by the Government in acre"
                  type="number"
                  value={formData.governmentAllottedLand}
                  onChange={(e) =>
                    handleInputChange("governmentAllottedLand", e.target.value)
                  }
                  placeholder="Enter government allotted land in acres"
                  step="0.01"
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Share Capital Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          4. Share Capital
        </h2>

        <div className="space-y-6">
          <Input
            label="4(a). Authorised Share Capital (in Rs)"
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
              4(b). Paid up Share Capital by different Entity
            </h3>
            <div className="space-y-4">
              <Input
                label="4(b)(i). Promoters in Rs"
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
                label="4(b)(ii). Government or Government Bodies in Rs"
                type="number"
                value={formData.governmentShareCapital}
                onChange={(e) =>
                  handleInputChange("governmentShareCapital", e.target.value)
                }
                placeholder="Enter government share capital amount"
                // error={errors.governmentShareCapital}
                // required
              />
              <Input
                label="4(b)(iii).pack total outstanding loan"
                type="number"
                value={formData.pack_total_outstanding_loan}
                onChange={(e) =>
                  handleInputChange(
                    "pack_total_outstanding_loan",
                    e.target.value,
                  )
                }
                placeholder="Enter government share capital amount"
                // error={errors.governmentShareCapital}
                // required
              />
              <Input
                label="4(b)(iv). Paid up share date"
                type="date"
                value={formData.paidUpShareDate}
                onChange={(e) =>
                  handleInputChange("paidUpShareDate", e.target.value)
                }
              />
              <Input
                label="4(b)(v). Total Deposit (in Rs)"
                type="number"
                value={formData.totalDeposit}
                onChange={(e) =>
                  handleInputChange("totalDeposit", e.target.value)
                }
                placeholder="Enter total deposit"
                error={errors.totalDeposit}
                required
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Annual Financials Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          5. Annual Financials
        </h2>

        <div className="space-y-6">
          <Input
            label="5(a). Annual Turn Over of the Cooperative Society (in Rs)"
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
            label="5(b). Annual Expenses of the Cooperative Society (in Rs)"
            type="number"
            value={formData.annualExpenses}
            onChange={(e) =>
              handleInputChange("annualExpenses", e.target.value)
            }
            placeholder="Enter annual expenses amount"
            error={errors.annualExpenses}
            required
          />

          <Input
            label="5(c). Number of Processing Units"
            type="number"
            value={formData.processing_unit}
            onChange={(e) =>
              handleInputChange("processing_unit", e.target.value)
            }
            placeholder="Enter number of processing units"
          />
        </div>
      </Card>

      {/* Housing Construction Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          6. Housing Construction
        </h2>

        <div className="space-y-6">
          <Input
            label="6(a). Number of houses/flats completed till end of audited year"
            type="number"
            value={formData.housesCompleted}
            onChange={(e) =>
              handleInputChange("housesCompleted", e.target.value)
            }
            placeholder="Enter number of completed houses/flats"
            error={errors.housesCompleted}
            required
          />

          <Input
            label="6(b). Number of houses/flats handover to the members till end of audited year"
            type="number"
            value={formData.housesHandover}
            onChange={(e) =>
              handleInputChange("housesHandover", e.target.value)
            }
            placeholder="Enter number of handover houses/flats"
            error={errors.housesHandover}
            required
          />

          <Input
            label="6(c). Number of houses/flats under construction till end of audited year"
            type="number"
            value={formData.housesUnderConstruction}
            onChange={(e) =>
              handleInputChange("housesUnderConstruction", e.target.value)
            }
            placeholder="Enter number of houses/flats under construction"
            error={errors.housesUnderConstruction}
            required
          />
        </div>
      </Card>

      {/* Facilities Section */}
      {/* <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          7. Facilities
        </h2>

        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            7(a). Facilities provided by Cooperative Society
          </h3>
          <div className="space-y-4">
            <RadioGroup
              label="7(a)(i). Auditorium"
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              value={formData.hasAuditorium}
              onChange={(value) => handleInputChange("hasAuditorium", value)}
              name="hasAuditorium"
            />

            <RadioGroup
              label="7(a)(ii). Banking counter"
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              value={formData.hasBankingCounter}
              onChange={(value) =>
                handleInputChange("hasBankingCounter", value)
              }
              name="hasBankingCounter"
            />

            <RadioGroup
              label="7(a)(iii). Community Hall"
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              value={formData.hasCommunityHall}
              onChange={(value) => handleInputChange("hasCommunityHall", value)}
              name="hasCommunityHall"
            />
          </div>
        </div>
      </Card> */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Facilities</h2>

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
      {/* Loan Facilitation Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          8. Loan Facilitation
        </h2>

        <RadioGroup
          label="8(a). Whether the Society facilitate its promoters in getting Loan for construction of houses or additional structures within the complex?"
          options={[
            { value: "1", label: "Yes" },
            { value: "0", label: "No" },
          ]}
          value={formData.facilitatesLoan}
          onChange={(value) => handleInputChange("facilitatesLoan", value)}
          name="facilitatesLoan"
          // error={errors.facilitatesLoan}
        />
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

export default CooperativeRegistrationsHousing;
