import React, { useState } from "react";
import { Input } from "../../components/ui/Input";
// import { Select } from "../../components/ui/Select";
import { RadioGroup } from "../../components/ui/RadioGroup";
import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

interface FormData {
  // Milk Collection
  annualMilkCollection: string;

  // Credit Facility
  hasCreditFacility: string;
  totalCreditProvided: string;

  // Financial
  authorizedShareCapital: string;
  paidUpShareCapital: string;
  paidUpShareDate: string;
  totalDeposit: string;
  totalLoanOutstanding: string;

  // Milk Collection Unit Facility
  hasMilkCollectionUnit: string;
  milkCollectionUnitCapacity: string;

  // Transportation
  hasTransportation: string;

  // BMC Unit Facility
  hasBMCFacility: string;

  // Milk Testing Facility
  hasMilkTestingFacility: string;

  // Pasteurization and Processing
  hasPasteurizationFacility: string;

  // Bank Mitra
  hasBankMitra: string;
  bankMitraDetails: string;

  // Micro ATM
  hasMicroATM: string;
  microATMDetails: string;

  // Other Facilities
  otherFacilities: string;
}

const CooperativeRegistrationDairy = ({
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
    annualMilkCollection: data?.annualMilkCollection || "",
    hasCreditFacility: data?.hasCreditFacility || "",
    totalCreditProvided: data?.totalCreditProvided || "",
    authorizedShareCapital: data?.authorizedShareCapital || "",
    paidUpShareCapital: data?.paidUpShareCapital || "",
    paidUpShareDate: data?.paidUpShareDate || "",
    totalDeposit: data?.totalDeposit || "",
    totalLoanOutstanding: data?.totalLoanOutstanding || "",
    hasMilkCollectionUnit: data?.hasMilkCollectionUnit || "",
    milkCollectionUnitCapacity: data?.milkCollectionUnitCapacity || "",
    hasTransportation: data?.hasTransportation || "",
    hasBMCFacility: data?.hasBMCFacility || "",
    hasMilkTestingFacility: data?.hasMilkTestingFacility || "",
    hasPasteurizationFacility: data?.hasPasteurizationFacility || "",
    hasBankMitra: data?.hasBankMitra || "",
    bankMitraDetails: data?.bankMitraDetails || "",
    hasMicroATM: data?.hasMicroATM || "",
    microATMDetails: data?.microATMDetails || "",
    otherFacilities: data?.otherFacilities || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.annualMilkCollection)
      newErrors.annualMilkCollection = "Annual milk collection is required";
    if (!formData.hasCreditFacility)
      newErrors.hasCreditFacility =
        "Please specify if credit facility is available";
    if (
      formData?.hasCreditFacility === "yes" &&
      !formData.totalCreditProvided
    ) {
      newErrors.totalCreditProvided = "Total credit provided is required";
    }
    if (!formData.totalDeposit)
      newErrors.totalDeposit = "Total deposit is required";
    if (!formData.hasMilkCollectionUnit)
      newErrors.hasMilkCollectionUnit =
        "Please specify if milk collection unit facility is available";
    if (
      formData.hasMilkCollectionUnit === "yes" &&
      !formData.milkCollectionUnitCapacity
    ) {
      newErrors.milkCollectionUnitCapacity =
        "Milk collection unit capacity is required";
    }
    if (!formData.hasTransportation)
      newErrors.hasTransportation =
        "Please specify if transportation facility is available";
    if (!formData.hasBMCFacility)
      newErrors.hasBMCFacility =
        "Please specify if BMC unit facility is available";
    if (!formData.hasMilkTestingFacility)
      newErrors.hasMilkTestingFacility =
        "Please specify if milk testing facility is available";
    if (!formData.hasPasteurizationFacility)
      newErrors.hasPasteurizationFacility =
        "Please specify if pasteurization facility is available";
    if (!formData.hasBankMitra)
      newErrors.hasBankMitra =
        "Please specify if bank mitra facility is available";
    if (formData.hasBankMitra === "yes" && !formData.bankMitraDetails) {
      newErrors.bankMitraDetails = "Bank mitra details are required";
    }
    if (!formData.hasMicroATM)
      newErrors.hasMicroATM =
        "Please specify if micro ATM facility is available";
    if (formData.hasMicroATM === "yes" && !formData.microATMDetails) {
      newErrors.microATMDetails = "Micro ATM details are required";
    }
    if (!formData.otherFacilities?.trim()) {
      newErrors.otherFacilities = "Other facilities are required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const transformToApiPayload = () => {
    const toDecimalString = (value: string) => {
      const num = Number(value);
      return isNaN(num) ? "0.000" : num.toFixed(3);
    };

    return {
      CooperativeRegistrationsDairy: [
        {
          milk_collection: Number(formData.annualMilkCollection) || null,

          credit_facility: formData.hasCreditFacility === "yes" ? 1 : 0,

          authorised_share: Number(formData.authorizedShareCapital) || null,

          paid_up_share: Number(formData.paidUpShareCapital) || null,

          paid_up_share_date: formData.paidUpShareDate || null,

          total_deposit: Number(formData.totalDeposit),

          pack_total_outstanding_loan:
            Number(formData.totalLoanOutstanding) || null,

          credit_provided:
            formData.hasCreditFacility === "yes"
              ? toDecimalString(formData.totalCreditProvided)
              : 0,

          milk_collection_unit:
            formData.hasMilkCollectionUnit === "yes" ? 1 : 0,

          milk_collection_capicity:
            formData.hasMilkCollectionUnit === "yes"
              ? formData.milkCollectionUnitCapacity
              : 0,

          transport_milk: formData.hasTransportation === "yes" ? 1 : 0,

          bulk_milk_unit: formData.hasBMCFacility === "yes" ? 1 : 0,

          milk_testing: formData.hasMilkTestingFacility === "yes" ? 1 : 0,

          processing: formData.hasPasteurizationFacility === "yes" ? 1 : 0,

          is_bank_mitra: formData.hasBankMitra === "yes" ? 1 : 0,

          bank_mitra_details:
            formData.hasBankMitra === "yes"
              ? formData.bankMitraDetails
              : 0,

          is_micro_atm: formData.hasMicroATM === "yes" ? 1 : 0,

          micro_atm_details:
            formData.hasMicroATM === "yes"
              ? formData.microATMDetails 
              : 0,

          other_facility: formData.otherFacilities?.trim() || null,
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
      {/* Annual Milk Collection Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          1. Annual Total Milk Collection
        </h2>

        <Input
          label="1(a). Annual Total Milk Collection (In Liters)"
          type="number"
          value={formData.annualMilkCollection}
          onChange={(e) =>
            handleInputChange("annualMilkCollection", e.target.value)
          }
          placeholder="Enter annual milk collection in liters"
          error={errors.annualMilkCollection}
          required
        />
      </Card>

      {/* Credit Facility Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          2. Credit Facility
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="2(a). Credit Facility"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.hasCreditFacility}
            onChange={(value) => handleInputChange("hasCreditFacility", value)}
            name="hasCreditFacility"
            error={errors.hasCreditFacility}
          />

          {formData?.hasCreditFacility === "yes" && (
            <Input
              label="Total Credit Provided in the Financial Year (In Rs.)"
              type="number"
              value={formData.totalCreditProvided}
              onChange={(e) =>
                handleInputChange("totalCreditProvided", e.target.value)
              }
              placeholder="Enter total credit provided amount"
              error={errors.totalCreditProvided}
              required
            />
          )}
        </div>
      </Card>

      {/* Financial Details */}
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
            placeholder="Enter authorised share capital"
          />

          <Input
            label="2(b). Paid Up Share Capital (in Rs)"
            type="number"
            value={formData.paidUpShareCapital}
            onChange={(e) =>
              handleInputChange("paidUpShareCapital", e.target.value)
            }
            placeholder="Enter paid up share capital"
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
            placeholder="Enter total deposit"
            required
            error={errors.totalDeposit}
          />

          <Input
            label="2(e). PACK Total Outstanding Loan (in Rs)"
            type="number"
            value={formData.totalLoanOutstanding}
            onChange={(e) =>
              handleInputChange("totalLoanOutstanding", e.target.value)
            }
            placeholder="Enter total outstanding loan"
          />
        </div>
      </Card>

      {/* Milk Collection Unit Facility Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          3. Milk Collection Unit Facility
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="3(a). Milk Collection Unit Facility"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.hasMilkCollectionUnit}
            onChange={(value) =>
              handleInputChange("hasMilkCollectionUnit", value)
            }
            name="hasMilkCollectionUnit"
            error={errors.hasMilkCollectionUnit}
            required
          />

          {formData.hasMilkCollectionUnit === "yes" && (
            <Input
              label="Capacity of Milk Collection Unit (In Liters)"
              type="number"
              value={formData.milkCollectionUnitCapacity}
              onChange={(e) =>
                handleInputChange("milkCollectionUnitCapacity", e.target.value)
              }
              placeholder="Enter milk collection unit capacity"
              error={errors.milkCollectionUnitCapacity}
              required
            />
          )}
        </div>
      </Card>

      {/* Transportation Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          4. Transportation
        </h2>

        <RadioGroup
          label="4(a). Transportation of Milk"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          value={formData.hasTransportation}
          onChange={(value) => handleInputChange("hasTransportation", value)}
          name="hasTransportation"
          error={errors.hasTransportation}
          required
        />
      </Card>

      {/* BMC Unit Facility Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          5. BMC Unit Facility
        </h2>

        <RadioGroup
          label="5(a). Bulk Milk Cooling (BMC) Unit Facility"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          value={formData.hasBMCFacility}
          onChange={(value) => handleInputChange("hasBMCFacility", value)}
          name="hasBMCFacility"
          error={errors.hasBMCFacility}
          required
        />
      </Card>

      {/* Milk Testing Facility Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          6. Milk Testing Facility
        </h2>

        <RadioGroup
          label="6(a). Milk Testing Facility"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          value={formData.hasMilkTestingFacility}
          onChange={(value) =>
            handleInputChange("hasMilkTestingFacility", value)
          }
          name="hasMilkTestingFacility"
          error={errors.hasMilkTestingFacility}
          required
        />
      </Card>

      {/* Pasteurization and Processing Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          7. Pasteurization and Processing
        </h2>

        <RadioGroup
          label="7(a). Pasteurization and Processing Facility"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          value={formData.hasPasteurizationFacility}
          onChange={(value) =>
            handleInputChange("hasPasteurizationFacility", value)
          }
          name="hasPasteurizationFacility"
          error={errors.hasPasteurizationFacility}
          required
        />
      </Card>

      {/* Bank Mitra Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          8. Bank Mitra
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="8(a). Bank Mitra"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.hasBankMitra}
            onChange={(value) => handleInputChange("hasBankMitra", value)}
            name="hasBankMitra"
            error={errors.hasBankMitra}
            required
          />

          {formData.hasBankMitra === "yes" && (
            <Textarea
              label={
                <>
                  8(b). Bank Mitra Details
                  <span className="text-red-500 ml-1">*</span>
                </>
              }
              value={formData.bankMitraDetails}
              onChange={(e) =>
                handleInputChange("bankMitraDetails", e.target.value)
              }
              placeholder="Enter bank mitra details..."
              rows={3}
              error={errors.bankMitraDetails}
              required
            />
          )}
        </div>
      </Card>

      {/* Micro ATM Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          9. Micro ATM
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="9(a). Micro ATM"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.hasMicroATM}
            onChange={(value) => handleInputChange("hasMicroATM", value)}
            name="hasMicroATM"
            error={errors.hasMicroATM}
            required
          />

          {formData.hasMicroATM === "yes" && (
            <Textarea
              label={
                <>
                  9(b). Micro ATM Details
                  <span className="text-red-500 ml-1">*</span>
                </>
              }
              value={formData.microATMDetails}
              onChange={(e) =>
                handleInputChange("microATMDetails", e.target.value)
              }
              placeholder="Enter micro ATM details..."
              rows={3}
              error={errors.microATMDetails}
              required
            />
          )}
        </div>
      </Card>

      {/* Other Facilities Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          10. Other Facilities
        </h2>

        <Textarea
          label={
            <>
              10(a). Other Facilities Provided (Please Specify)
              <span className="text-red-500 ml-1">*</span>
            </>
          }
          value={formData.otherFacilities}
          onChange={(e) => handleInputChange("otherFacilities", e.target.value)}
          placeholder="Specify any other facilities provided by the cooperative society..."
          rows={4}
          error={errors.otherFacilities}
          required
        />
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Save Draft
        </Button>
        <Button type="submit">Submit Application</Button>
      </div>
    </form>
  );
};

export default CooperativeRegistrationDairy;
