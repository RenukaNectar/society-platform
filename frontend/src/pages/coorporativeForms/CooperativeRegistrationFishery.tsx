import React, { useState } from "react";
import { Input } from "../../components/ui/Input";
// import { Select } from '../../components/ui/Select';
import { RadioGroup } from "../../components/ui/RadioGroup";
import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

interface FormData {
  // Annual Fish Catch
  annualFishCatch: string;

  // Credit Facility
  hasCreditFacility: string;
  totalCreditProvided: string;

  // Distribution of Fuel
  hasFuelDistribution: string;

  // Financial Details
  authorizedShare: string;
  paidUpShare: string;
  paidUpShareDate: string;
  totalDeposit: string;
  totalLoanOutstanding: string;

  // Marketing
  hasMarketing: string;

  // Cold Storage
  hasColdStorage: string;

  // Transportation
  hasTransportation: string;

  // FPO for Fisheries
  hasFPOForFisheries: string;
  fpoFisheriesDetails: string;

  // Other Facilities
  otherFacilities: string;
}

const CooperativeRegistrationFishery = ({
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
    annualFishCatch: data?.annualFishCatch || "",
    hasCreditFacility: data?.hasCreditFacility || "",
    totalCreditProvided: data?.totalCreditProvided || "",
    hasFuelDistribution: data?.hasFuelDistribution || "",
    authorizedShare: data?.authorizedShare || "",
    paidUpShare: data?.paidUpShare || "",
    paidUpShareDate: data?.paidUpShareDate || "",
    totalDeposit: data?.totalDeposit || "",
    totalLoanOutstanding: data?.totalLoanOutstanding || "",
    hasMarketing: data?.hasMarketing || "",
    hasColdStorage: data?.hasColdStorage || "",
    hasTransportation: data?.hasTransportation || "",
    hasFPOForFisheries: data?.hasFPOForFisheries || "",
    fpoFisheriesDetails: data?.fpoFisheriesDetails || "",
    otherFacilities: data?.otherFacilities || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => {
      if (field === "hasCreditFacility" && value === "no") {
        setErrors((prev) => ({ ...prev, totalCreditProvided: "" }));
        return { ...prev, hasCreditFacility: value, totalCreditProvided: "" };
      }

      if (field === "hasFPOForFisheries" && value === "no") {
        setErrors((prev) => ({ ...prev, fpoFisheriesDetails: "" }));

        return {
          ...prev,
          hasFPOForFisheries: value,
          fpoFisheriesDetails: "",
        };
      }

      return { ...prev, [field]: value };
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.annualFishCatch.trim())
      newErrors.annualFishCatch = "Annual fish catch is required";
    if (!formData.hasCreditFacility)
      newErrors.hasCreditFacility =
        "Please specify if credit facility is available";
    if (
      formData?.hasCreditFacility === "yes" &&
      !formData.totalCreditProvided
    ) {
      newErrors.totalCreditProvided = "Total credit provided is required";
    }
    if (!formData.hasFuelDistribution)
      newErrors.hasFuelDistribution =
        "Please specify if fuel distribution is available";
    if (!formData.totalDeposit)
      newErrors.totalDeposit = "Total deposit is required";
    if (!formData.hasMarketing)
      newErrors.hasMarketing =
        "Please specify if marketing facility is available";
    if (!formData.hasColdStorage)
      newErrors.hasColdStorage = "Please specify if cold storage is available";
    if (!formData.hasTransportation)
      newErrors.hasTransportation =
        "Please specify if transportation is available";
    if (!formData.hasFPOForFisheries)
      newErrors.hasFPOForFisheries =
        "Please specify if FPO for fisheries is available";
    if (
      formData?.hasFPOForFisheries === "yes" &&
      !formData?.fpoFisheriesDetails.trim()
    ) {
      newErrors.fpoFisheriesDetails = "FPO for fisheries details are required";
    }
    if (!formData.otherFacilities.trim())
      newErrors.otherFacilities = "Other facility is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const transformToApiPayload = () => {
    return {
      CooperativeRegistrationFishery: [
        {
          annual_fish_catch: Number(formData.annualFishCatch) || null,

          credit_facility: formData.hasCreditFacility === "yes" ? 1 : 0,

          total_credit_provided:
            formData.hasCreditFacility === "yes"
              ? Number(formData.totalCreditProvided)
              : 0,

          authorised_share: Number(formData.authorizedShare) || null,

          paid_up_share: Number(formData.paidUpShare) || null,

          paid_up_share_date: formData.paidUpShareDate || null,

          total_deposit: Number(formData.totalDeposit) || null,

          pack_total_outstanding_loan:
            Number(formData.totalLoanOutstanding) || null,

          fuel_distribution: formData.hasFuelDistribution === "yes" ? 1 : 0,

          marketing: formData.hasMarketing === "yes" ? 1 : 0,

          cold_storage: formData.hasColdStorage === "yes" ? 1 : 0,

          transportation: formData.hasTransportation === "yes" ? 1 : 0,

          is_fpo_fisheries: formData.hasFPOForFisheries === "yes" ? 1 : 0,

          fpo_fisheries_details:
            formData.hasFPOForFisheries === "yes"
              ? formData.fpoFisheriesDetails.trim()
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
      {/* Annual Fish Catch Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          1. Annual Total Fish Catch
        </h2>

        <Input
          label="1(a). Annual Total Fish Catch (in Tonne)"
          type="number"
          value={formData.annualFishCatch}
          onChange={(e) => handleInputChange("annualFishCatch", e.target.value)}
          placeholder="Enter annual fish catch in tonnes"
          error={errors.annualFishCatch}
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

      {/* Distribution of Fuel Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          3. Distribution of Fuel
        </h2>

        <RadioGroup
          label="3(a). Distribution of Fuel"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          value={formData.hasFuelDistribution}
          onChange={(value) => handleInputChange("hasFuelDistribution", value)}
          name="hasFuelDistribution"
          error={errors.hasFuelDistribution}
        />
      </Card>

      {/* Marketing Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          4. Marketing
        </h2>

        <RadioGroup
          label="4(a). Marketing"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          value={formData.hasMarketing}
          onChange={(value) => handleInputChange("hasMarketing", value)}
          name="hasMarketing"
          error={errors.hasMarketing}
        />
      </Card>

      {/* Cold Storage Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          5. Cold Storage
        </h2>

        <RadioGroup
          label="5(a). Cold Storage"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          value={formData.hasColdStorage}
          onChange={(value) => handleInputChange("hasColdStorage", value)}
          name="hasColdStorage"
          error={errors.hasColdStorage}
        />
      </Card>

      {/* Transportation Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          6. Transportation
        </h2>

        <RadioGroup
          label="6(a). Transportation"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          value={formData.hasTransportation}
          onChange={(value) => handleInputChange("hasTransportation", value)}
          name="hasTransportation"
          error={errors.hasTransportation}
        />
      </Card>

      {/* FPO for Fisheries Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          7. FPO for Fisheries
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="7(a). FPO for Fisheries"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.hasFPOForFisheries}
            onChange={(value) => handleInputChange("hasFPOForFisheries", value)}
            name="hasFPOForFisheries"
            error={errors.hasFPOForFisheries}
          />

          {formData?.hasFPOForFisheries === "yes" && (
            <Textarea
              label="FPO for Fisheries Details"
              value={formData.fpoFisheriesDetails}
              onChange={(e) =>
                handleInputChange("fpoFisheriesDetails", e.target.value)
              }
              placeholder="Enter FPO for fisheries details..."
              rows={4}
              error={errors.fpoFisheriesDetails}
              // required
            />
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          8. Financial Details
        </h2>

        <div className="space-y-6">
          <Input
            label="8(a). Authorised Share Capital (in Rs)"
            type="number"
            value={formData.authorizedShare}
            onChange={(e) =>
              handleInputChange("authorizedShare", e.target.value)
            }
            placeholder="Enter authorised share capital"
          />

          <Input
            label="8(b). Paid Up Share Capital (in Rs)"
            type="number"
            value={formData.paidUpShare}
            onChange={(e) => handleInputChange("paidUpShare", e.target.value)}
            placeholder="Enter paid up share capital"
          />

          <Input
            label="8(c). Paid Up Share Date"
            type="date"
            value={formData.paidUpShareDate}
            onChange={(e) =>
              handleInputChange("paidUpShareDate", e.target.value)
            }
          />

          <Input
            label="8(d). Total Deposit (in Rs)"
            type="number"
            value={formData.totalDeposit}
            onChange={(e) => handleInputChange("totalDeposit", e.target.value)}
            placeholder="Enter total deposit"
            error={errors.totalDeposit}
            required
          />

          <Input
            label="8(e). Total Loan Outstanding (in Rs)"
            type="number"
            value={formData.totalLoanOutstanding}
            onChange={(e) =>
              handleInputChange("totalLoanOutstanding", e.target.value)
            }
            placeholder="Enter total loan outstanding"
          />
        </div>
      </Card>

      {/* Other Facilities Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          9. Other Facilities
        </h2>

        <Textarea
          label="9(a). Other Facilities Provided (Please Specify)"
          value={formData.otherFacilities}
          onChange={(e) => handleInputChange("otherFacilities", e.target.value)}
          placeholder="Specify any other facilities provided by the cooperative society..."
          rows={4}
          error={errors.otherFacilities}
          // required
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

export default CooperativeRegistrationFishery;
