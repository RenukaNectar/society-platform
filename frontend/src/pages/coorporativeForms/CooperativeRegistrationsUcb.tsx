import React, { useState } from "react";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { RadioGroup } from "../../components/ui/RadioGroup";
import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

interface FormData {
  // Branches
  totalBranches: string;

  // NAFCUB Affiliation
  isAffiliatedToNAFCUB: string;

  // Office Building
  hasOfficeBuilding: string;
  officeBuildingType: string;

  // Computerization
  isFullyComputerized: string;
  computerSystemsCount: string;

  // Banking Facilities
  hasOwnIFSCCode: string;
  hasCoreBanking: string;
  hasDoorstepBanking: string;
  isOnboardedAePS: string;
  offersDebitCard: string;
  hasInternetBanking: string;
  offersCreditCard: string;
  hasCIBILMembership: string;
  conductsGovernmentBusiness: string;
  isCGTMSEMember: string;
  hasSupervisoryAction: string;
  isFSWMCompliant: string;

  // Financial Details
  netWorth: string;
  authorizedShareCapital: string;
  annualTurnover: string;
  annualIncome: string;
  annualExpenditure: string;
  totalAssets: string;
  totalLiabilities: string;
  totalDeposits: string;
  totalLoanOutstanding: string;

  // Government Schemes
  implementsGovernmentScheme: string;
  governmentSchemeName: string;
  schemeType: string;
  schemeAmount: string;
}

const CooperativeRegistrationsUcb = ({
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
      totalBranches: "",
      isAffiliatedToNAFCUB: "",
      hasOfficeBuilding: "",
      officeBuildingType: "",
      isFullyComputerized: "",
      computerSystemsCount: "",
      hasOwnIFSCCode: "",
      hasCoreBanking: "",
      hasDoorstepBanking: "",
      isOnboardedAePS: "",
      offersDebitCard: "",
      hasInternetBanking: "",
      offersCreditCard: "",
      hasCIBILMembership: "",
      conductsGovernmentBusiness: "",
      isCGTMSEMember: "",
      hasSupervisoryAction: "",
      isFSWMCompliant: "",
      netWorth: "",
      authorizedShareCapital: "",
      annualTurnover: "",
      annualIncome: "",
      annualExpenditure: "",
      totalAssets: "",
      totalLiabilities: "",
      totalDeposits: "",
      totalLoanOutstanding: "",
      implementsGovernmentScheme: "",
      governmentSchemeName: "",
      schemeType: "",
      schemeAmount: "",
    },
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const officeBuildingTypes = [
    { value: "1", label: "Own Building" },
    { value: "2", label: "Rented Building" },
    { value: "3", label: "Rent Free Building" },
    { value: "4", label: "Leased Building" },
    { value: "5", label: "Building Provided By Government" },
  ];

  const schemeTypes = [
    { value: "central", label: "Central" },
    { value: "state", label: "State" },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.totalBranches)
      newErrors.totalBranches = "Total number of branches is required";
    if (!formData.isAffiliatedToNAFCUB)
      newErrors.isAffiliatedToNAFCUB = "Please specify NAFCUB affiliation";
    if (!formData.hasOfficeBuilding)
      newErrors.hasOfficeBuilding = "Please specify if UCB has office building";
    if (formData.hasOfficeBuilding === "yes" && !formData.officeBuildingType) {
      newErrors.officeBuildingType = "Office building type is required";
    }
    if (!formData.isFullyComputerized)
      newErrors.isFullyComputerized =
        "Please specify if UCB is fully computerized";
    if (
      formData.isFullyComputerized === "yes" &&
      !formData.computerSystemsCount
    ) {
      newErrors.computerSystemsCount = "Number of computer systems is required";
    }
    if (!formData.hasOwnIFSCCode)
      newErrors.hasOwnIFSCCode = "Please specify if UCB has own IFSC code";
    if (!formData.hasCoreBanking)
      newErrors.hasCoreBanking =
        "Please specify if UCB has core banking facility";
    if (!formData.hasDoorstepBanking)
      newErrors.hasDoorstepBanking =
        "Please specify if doorstep banking is available";
    if (!formData.isOnboardedAePS)
      newErrors.isOnboardedAePS = "Please specify if UCB is onboarded on AePS";
    if (!formData.offersDebitCard)
      newErrors.offersDebitCard = "Please specify if UCB offers debit card";
    if (!formData.hasInternetBanking)
      newErrors.hasInternetBanking =
        "Please specify if UCB has internet banking";
    if (!formData.offersCreditCard)
      newErrors.offersCreditCard = "Please specify if UCB offers credit card";
    if (!formData.hasCIBILMembership)
      newErrors.hasCIBILMembership =
        "Please specify if UCB has CIBIL membership";
    if (!formData.conductsGovernmentBusiness)
      newErrors.conductsGovernmentBusiness =
        "Please specify if UCB conducts government business";
    if (!formData.isCGTMSEMember)
      newErrors.isCGTMSEMember = "Please specify if UCB is CGTMSE MLI promoter";
    if (!formData.hasSupervisoryAction)
      newErrors.hasSupervisoryAction =
        "Please specify if UCB has supervisory action framework";
    if (!formData.isFSWMCompliant)
      newErrors.isFSWMCompliant = "Please specify if UCB is FSWM compliant";
    if (!formData.netWorth) newErrors.netWorth = "Net worth is required";
    if (!formData.authorizedShareCapital)
      newErrors.authorizedShareCapital = "Authorized share capital is required";
    // if (!formData.annualTurnover) newErrors.annualTurnover = 'Annual turnover is required';
    if (!formData.annualIncome)
      newErrors.annualIncome = "Annual income is required";
    if (!formData.annualExpenditure)
      newErrors.annualExpenditure = "Annual expenditure is required";
    if (!formData.totalAssets)
      newErrors.totalAssets = "Total assets is required";
    if (!formData.totalLiabilities)
      newErrors.totalLiabilities = "Total liabilities is required";
    if (!formData.totalDeposits)
      newErrors.totalDeposits = "Total deposits is required";
    if (!formData.totalLoanOutstanding)
      newErrors.totalLoanOutstanding = "Total loan outstanding is required";
    if (!formData.implementsGovernmentScheme)
      newErrors.implementsGovernmentScheme =
        "Please specify if UCB implements government schemes";
    // if (formData.implementsGovernmentScheme === 'yes') {
    //   if (!formData.governmentSchemeName) newErrors.governmentSchemeName = 'Government scheme name is required';
    //   if (!formData.schemeType) newErrors.schemeType = 'Scheme type is required';
    //   if (!formData.schemeAmount) newErrors.schemeAmount = 'Scheme amount is required';
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const transformToApiPayload = () => {
    const yesNo = (val: string) => (val === "yes" ? 1 : 0);

    const buildingType =
      formData.hasOfficeBuilding === "yes"
        ? officeBuildingTypes.findIndex(
            (b) => b.value === formData.officeBuildingType,
          ) + 1
        : 0;

    return {
      CooperativeRegistrationsUcb: [
        {
          ucb_branch: Number(formData.totalBranches) || null,

          has_nafcub: yesNo(formData.isAffiliatedToNAFCUB) || 0,

          has_building: yesNo(formData.hasOfficeBuilding) || 0,
          building_type: buildingType || null,

          is_computerized: yesNo(formData.isFullyComputerized) || 0,
          no_computer_working:
            formData.isFullyComputerized === "yes"
              ? Number(formData.computerSystemsCount)
              : 0,

          have_ifsc: yesNo(formData.hasOwnIFSCCode) || 0,
          have_corebanking: yesNo(formData.hasCoreBanking) || 0,
          have_doorstepservice: yesNo(formData.hasDoorstepBanking) || 0,
          is_aeps: yesNo(formData.isOnboardedAePS) || 0,
          offer_debitcard: yesNo(formData.offersDebitCard) || 0,
          have_internetbanking: yesNo(formData.hasInternetBanking) || 0,
          offer_creditcard: yesNo(formData.offersCreditCard) || 0,
          cibil_membership: yesNo(formData.hasCIBILMembership) || 0,
          conducting_gab: yesNo(formData.conductsGovernmentBusiness) || 0,
          cgtmsemli_member: yesNo(formData.isCGTMSEMember) || 0,
          is_saf_to_cust: yesNo(formData.hasSupervisoryAction) || 0,
          fswm_comp: yesNo(formData.isFSWMCompliant) || 0,

          networth: Number(formData.netWorth) || null,
          authorised_share: Number(formData.authorizedShareCapital) || null,
          annual_turn_over: Number(formData.annualTurnover) || null,
          annual_income: Number(formData.annualIncome) || null,
          annual_ucb_expenditr: Number(formData.annualExpenditure) || null,
          asset_ucb: Number(formData.totalAssets) || null,
          liability_ucb: Number(formData.totalLiabilities) || null,
          total_deposit: Number(formData.totalDeposits) || null,
          loan_outstanding: Number(formData.totalLoanOutstanding) || null,

          is_gov_scheme_implemented:
            yesNo(formData.implementsGovernmentScheme) || 0,
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
      {/* Branches Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          1. Branches
        </h2>

        <Input
          label="1(a). Total Number of branches of UCB"
          type="number"
          value={formData.totalBranches}
          onChange={(e) => handleInputChange("totalBranches", e.target.value)}
          placeholder="Enter total number of branches"
          error={errors.totalBranches}
          required
        />
      </Card>

      {/* NAFCUB Affiliation Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          2. NAFCUB Affiliation
        </h2>

        <RadioGroup
          label="Whether the UCB is affiliated to NAFCUB?"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          value={formData.isAffiliatedToNAFCUB}
          onChange={(value) => handleInputChange("isAffiliatedToNAFCUB", value)}
          name="isAffiliatedToNAFCUB"
          error={errors.isAffiliatedToNAFCUB}
          required
        />
      </Card>

      {/* Office Building Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          3. Office Building
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="3(a). Whether the UCB has an office building?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.hasOfficeBuilding}
            onChange={(value) => handleInputChange("hasOfficeBuilding", value)}
            name="hasOfficeBuilding"
            error={errors.hasOfficeBuilding}
            required
          />

          {formData.hasOfficeBuilding === "yes" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                3(b). Type of Office Building
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

      {/* Computerization Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          4. Computerization
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="4(a). Whether fully computerized or not"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.isFullyComputerized}
            onChange={(value) =>
              handleInputChange("isFullyComputerized", value)
            }
            name="isFullyComputerized"
            error={errors.isFullyComputerized}
            required
          />

          {formData.isFullyComputerized === "yes" && (
            <Input
              label="4(b). No. of computer system linked to the server in working condition"
              type="number"
              value={formData.computerSystemsCount}
              onChange={(e) =>
                handleInputChange("computerSystemsCount", e.target.value)
              }
              placeholder="Enter number of computer systems"
              error={errors.computerSystemsCount}
              required
            />
          )}
        </div>
      </Card>

      {/* Banking Facilities Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          5. Banking Facilities
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="Having own IFSC code"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.hasOwnIFSCCode}
            onChange={(value) => handleInputChange("hasOwnIFSCCode", value)}
            name="hasOwnIFSCCode"
            error={errors.hasOwnIFSCCode}
            required
          />

          <RadioGroup
            label="Having core banking facility or not"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.hasCoreBanking}
            onChange={(value) => handleInputChange("hasCoreBanking", value)}
            name="hasCoreBanking"
            error={errors.hasCoreBanking}
            required
          />

          <RadioGroup
            label="Door step banking facility available or not"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.hasDoorstepBanking}
            onChange={(value) => handleInputChange("hasDoorstepBanking", value)}
            name="hasDoorstepBanking"
            error={errors.hasDoorstepBanking}
            required
          />

          <RadioGroup
            label="Onboarded on Adhar enabled payment system (AePS) or Not"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.isOnboardedAePS}
            onChange={(value) => handleInputChange("isOnboardedAePS", value)}
            name="isOnboardedAePS"
            error={errors.isOnboardedAePS}
            required
          />

          <RadioGroup
            label="Offering Debit Card to the customers"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.offersDebitCard}
            onChange={(value) => handleInputChange("offersDebitCard", value)}
            name="offersDebitCard"
            error={errors.offersDebitCard}
            required
          />

          <RadioGroup
            label="Internet Banking with transaction facility or not"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.hasInternetBanking}
            onChange={(value) => handleInputChange("hasInternetBanking", value)}
            name="hasInternetBanking"
            error={errors.hasInternetBanking}
            required
          />

          <RadioGroup
            label="Offering Credit Card to the customers"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.offersCreditCard}
            onChange={(value) => handleInputChange("offersCreditCard", value)}
            name="offersCreditCard"
            error={errors.offersCreditCard}
            required
          />

          <RadioGroup
            label="CIBIL/ Transunion membership or not"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.hasCIBILMembership}
            onChange={(value) => handleInputChange("hasCIBILMembership", value)}
            name="hasCIBILMembership"
            error={errors.hasCIBILMembership}
            required
          />

          <RadioGroup
            label="Conducting Government agency business or not"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.conductsGovernmentBusiness}
            onChange={(value) =>
              handleInputChange("conductsGovernmentBusiness", value)
            }
            name="conductsGovernmentBusiness"
            error={errors.conductsGovernmentBusiness}
            required
          />

          <RadioGroup
            label="CGTMSE MLI member or not"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.isCGTMSEMember}
            onChange={(value) => handleInputChange("isCGTMSEMember", value)}
            name="isCGTMSEMember"
            error={errors.isCGTMSEMember}
            required
          />

          <RadioGroup
            label="Supervisory Action Framework to customers"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.hasSupervisoryAction}
            onChange={(value) =>
              handleInputChange("hasSupervisoryAction", value)
            }
            name="hasSupervisoryAction"
            error={errors.hasSupervisoryAction}
            required
          />

          <RadioGroup
            label="FSWM compliance"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.isFSWMCompliant}
            onChange={(value) => handleInputChange("isFSWMCompliant", value)}
            name="isFSWMCompliant"
            error={errors.isFSWMCompliant}
            required
          />
        </div>
      </Card>

      {/* Financial Details Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          6. Financial Details
        </h2>

        <div className="space-y-6">
          <Input
            label="Net worth (in Rs)"
            type="number"
            value={formData.netWorth}
            onChange={(e) => handleInputChange("netWorth", e.target.value)}
            placeholder="Enter net worth amount"
            error={errors.netWorth}
            required
          />

          <Input
            label="27(a). Authorised Share Capital of the UCB (in Rs)"
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
            label="28(a). Annual Turn Over of the UCB (in Rs)"
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
            label="28(b). Annual Income of the UCB (in Rs)"
            type="number"
            value={formData.annualIncome}
            onChange={(e) => handleInputChange("annualIncome", e.target.value)}
            placeholder="Enter annual income amount"
            error={errors.annualIncome}
            required
          />

          <Input
            label="28(c). Annual Expenditure of the UCB (in Rs)"
            type="number"
            value={formData.annualExpenditure}
            onChange={(e) =>
              handleInputChange("annualExpenditure", e.target.value)
            }
            placeholder="Enter annual expenditure amount"
            error={errors.annualExpenditure}
            required
          />

          <Input
            label="28(d). Assets of the UCB (in Rs)"
            type="number"
            value={formData.totalAssets}
            onChange={(e) => handleInputChange("totalAssets", e.target.value)}
            placeholder="Enter total assets amount"
            error={errors.totalAssets}
            required
          />

          <Input
            label="28(e). Liabilities of the UCB (in Rs)"
            type="number"
            value={formData.totalLiabilities}
            onChange={(e) =>
              handleInputChange("totalLiabilities", e.target.value)
            }
            placeholder="Enter total liabilities amount"
            error={errors.totalLiabilities}
            required
          />

          <Input
            label="28(f). Total Deposit of the UCB (in Rs)"
            type="number"
            value={formData.totalDeposits}
            onChange={(e) => handleInputChange("totalDeposits", e.target.value)}
            placeholder="Enter total deposits amount"
            error={errors.totalDeposits}
            required
          />

          <Input
            label="28(g). Total loan Outstanding of the UCB (in Rs)"
            type="number"
            value={formData.totalLoanOutstanding}
            onChange={(e) =>
              handleInputChange("totalLoanOutstanding", e.target.value)
            }
            placeholder="Enter total loan outstanding amount"
            error={errors.totalLoanOutstanding}
            required
          />
        </div>
      </Card>

      {/* Government Schemes Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          7. Government Schemes
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="29(a). Whether the UCB implementing any Central/State Government Scheme?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.implementsGovernmentScheme}
            onChange={(value) =>
              handleInputChange("implementsGovernmentScheme", value)
            }
            name="implementsGovernmentScheme"
            error={errors.implementsGovernmentScheme}
          />

          {formData.implementsGovernmentScheme === "yes" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                15(b). Name of the Central Government Schemes or State
                Government Schemes implemented by UCB:
              </h3>

              <Input
                label="1) Name of Government Scheme"
                type="text"
                value={formData.governmentSchemeName}
                onChange={(e) =>
                  handleInputChange("governmentSchemeName", e.target.value)
                }
                placeholder="Enter name of government scheme"
                // error={errors.governmentSchemeName}
                // required
              />

              <Select
                label="2) Type of Scheme "
                value={formData.schemeType}
                onChange={(e) =>
                  handleInputChange("schemeType", e.target.value)
                }
                placeholder="Select scheme type"
                // error={errors.schemeType}
                // required
              >
                {schemeTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>

              <Input
                label="3) Total Amount Spent through UCB (Rs)"
                type="number"
                value={formData.schemeAmount}
                onChange={(e) =>
                  handleInputChange("schemeAmount", e.target.value)
                }
                placeholder="Enter total amount spent"
                // error={errors.schemeAmount}
                // required
              />
            </div>
          )}
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

export default CooperativeRegistrationsUcb;
