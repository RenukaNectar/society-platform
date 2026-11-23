import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { RadioGroup } from "../../components/ui/RadioGroup";
import { Checkbox } from "../../components/ui/Checkbox";
import { LiquidationForm as LiquidationFormType } from "../../types";
import {
  Building2,
  FileText,
  DollarSign,
  AlertCircle,
  Send,
  Save,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  createLiquidation,
  updateLiquidation,
  getLiquidationById,
} from "../../lib/data/liquidations/api";
import { DocumentUpload } from "../../components/ui/DocumentUpload";
import { Modal } from "../../components/ui/Modal";
import moment from "moment";
import { getSocietyTypes } from "../../lib/data/master-data/api";
import { getMySociety } from "../../lib/data/users/api";

const SOCIETY_TYPE_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const textValue = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const societyTypeIdFrom = (source: any): string => {
  const nestedId = textValue(source?.societyType?.id);
  if (nestedId) return nestedId;
  const raw = textValue(source?.society_type);
  return SOCIETY_TYPE_ID_RE.test(raw) ? raw : "";
};

const societyTypeLabelFrom = (source: any, types: any[] = []): string => {
  const sectorName =
    source?.sector_of_operation && typeof source.sector_of_operation === "object"
      ? textValue(source.sector_of_operation.name)
      : "";
  const directLabel =
    textValue(source?.societyType?.title) ||
    textValue(source?.cooperative_society_type?.name) ||
    textValue(source?.cooperativeSocietyType?.name) ||
    textValue(source?.sectorOfOperation?.name) ||
    sectorName;
  if (directLabel) return directLabel;

  const raw = textValue(source?.society_type);
  if (raw && !SOCIETY_TYPE_ID_RE.test(raw)) return raw;

  const id = societyTypeIdFrom(source);
  const match = types.find((type) => String(type?.id) === id);
  return textValue(match?.title || match?.name);
};

const SOCIETY_LIQUIDATION_DOCUMENTS = [
  ["minutes_meeting_media_id", "Minutes & Agenda"],
  ["attendance_sheet_media_id", "Attendance Sheet"],
  ["circular_notice_media_id", "Circular Notice"],
  ["creditors_list_media_id", "Creditors List"],
  ["members_list_media_id", "Members List"],
] as const;

interface LiquidationFormProps {
  data?: any;
  societyData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const LiquidationForm: React.FC<LiquidationFormProps> = ({
  data,
  societyData,
  onSuccess,
  onCancel,
}) => {
  const { mode } = useSelector((state: RootState) => state.theme);
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingFormData, setPendingFormData] =
    useState<LiquidationFormType | null>(null);

  const [liquidationMode, setLiquidationMode] = useState<
    "voluntary" | "compulsory"
  >("voluntary");
  const [societyTypes, setSocietyTypes] = useState<any[]>([]);
  const [currentSocietyId, setCurrentSocietyId] = useState<string>("");
  const [currentDistrictId, setCurrentDistrictId] = useState<string>("");
  const [isLoadingSociety, setIsLoadingSociety] = useState(true);
  const [mySociety, setMySociety] = useState<any>();
  const [societyTypeLabel, setSocietyTypeLabel] = useState("");
  const [documentIds, setDocumentIds] = useState<{
    minutes_meeting_media_id?: { id: string; url: string };
    attendance_sheet_media_id?: { id: string; url: string };
    circular_notice_media_id?: { id: string; url: string };
    creditors_list_media_id?: { id: string; url: string };
    members_list_media_id?: { id: string; url: string };
  }>({});
  const societyInitiated =
    data?.is_applicant === false || data?.is_applicant === 0
      ? false
      : data?.is_applicant === true || data?.is_applicant === 1
        ? true
        : user?.role === "applicant";
  const documentsRequired = societyInitiated;

  const liquidationModeOptions = [
    { value: "voluntary", label: "Voluntary Liquidation" },
    { value: "compulsory", label: "Compulsory Liquidation" },
  ];

  useEffect(() => {
    let active = true;
    getSocietyTypes({ limit: 200 })
      .then((types) => {
        if (active) setSocietyTypes(Array.isArray(types) ? types : []);
      })
      .catch((error) => {
        console.error("Failed to fetch society types:", error);
      });
    return () => {
      active = false;
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    trigger,
  } = useForm<LiquidationFormType>({
    defaultValues: {
      society_id: "",
      society_registration_number: "",
      society_name: "",
      society_type: "",
      address: "",
      date_of_original_registration: "",
      date_of_minutes_meeting: "",
      minutes_meeting_media_id: "",
      attendance_sheet_media_id: "",
      date_of_circular_notice: "",
      circular_notice_media_id: "",
      liquidation_order_number: "",
      date_of_liquidation_order: "",
      mode_of_liquidation: "voluntary",
      reason_for_liquidation: "",
      total_assets: "",
      total_liabilities: "",
      net_position: "",
      share_capital_paid_up: "",
      reserve_funds: "",
      creditors_list_media_id: "",
      members_list_media_id: "",
      status: "",
      liquidation_person: "",
      created_by: "",
      active: true,
      declaration_accepted: false,
    },
  });

  const applySocietyType = (source: any) => {
    const label = societyTypeLabelFrom(source, societyTypes);
    const id = societyTypeIdFrom(source);
    setSocietyTypeLabel(label);
    setValue("society_type", id || label);
  };

  // Load existing data if editing

  useEffect(() => {
    const savedData = localStorage.getItem("liquidationFormData");
    if (savedData) {
      data = JSON.parse(savedData);
    }
    if (data) {
      setValue(
        "society_registration_number",
        data.society_registration_number || "",
      );
      setValue("society_name", data.society_name || "");
      applySocietyType(data);
      setValue("address", data.address || "");
      setValue(
        "date_of_original_registration",
        data.date_of_original_registration || "",
      );
      setValue("date_of_minutes_meeting", data.date_of_minutes_meeting || "");
      setValue("liquidation_order_number", data.liquidation_order_number || "");
      setValue(
        "date_of_liquidation_order",
        data.date_of_liquidation_order || "",
      );
      setValue("mode_of_liquidation", data.mode_of_liquidation || "voluntary");
      setValue("reason_for_liquidation", data.reason_for_liquidation || "");
      setValue("total_assets", data.total_assets?.toString() || "");
      setValue("total_liabilities", data.total_liabilities?.toString() || "");
      setValue("net_position", data.net_position?.toString() || "");
      setValue(
        "share_capital_paid_up",
        data.share_capital_paid_up?.toString() || "",
      );
      setValue("reserve_funds", data.reserve_funds?.toString() || "");
      setValue("date_of_circular_notice", data.date_of_circular_notice || "");
      setValue("status", data.status || "");
      setValue("liquidation_person", data.liquidation_person || "");
      setValue("active", data.active !== false);
      setValue("declaration_accepted", data.declaration_accepted || false);

      setLiquidationMode(data.mode_of_liquidation || "voluntary");

      const setDocumentFromApi = (
        field: keyof typeof documentIds,
        media?: { id: string; url: string } | null,
        mediaId?: string | { id: string; url: string } | null,
      ) => {
        if (media?.id && media?.url) {
          setDocumentIds((prev) => ({ ...prev, [field]: media }));
          return;
        }

        if (mediaId && typeof mediaId === "object" && mediaId.id) {
          setDocumentIds((prev) => ({ ...prev, [field]: mediaId }));
          return;
        }

        if (typeof mediaId === "string" && mediaId) {
          setDocumentIds((prev) => ({
            ...prev,
            [field]: { id: mediaId, url: "" },
          }));
        }
      };

      setDocumentFromApi(
        "minutes_meeting_media_id",
        data.minutesMeetingMedia,
        data.minutes_meeting_media_id,
      );
      setDocumentFromApi(
        "attendance_sheet_media_id",
        data.attendanceSheetMedia,
        data.attendance_sheet_media_id,
      );
      setDocumentFromApi(
        "circular_notice_media_id",
        data.circularNoticeMedia,
        data.circular_notice_media_id,
      );
      setDocumentFromApi(
        "creditors_list_media_id",
        data.creditorsListMedia,
        data.creditors_list_media_id,
      );
      setDocumentFromApi(
        "members_list_media_id",
        data.membersListMedia,
        data.members_list_media_id,
      );
    }
  }, [data, setValue, societyTypes]);

  // Fetch current user's society information from /me API
  useEffect(() => {
    // In registrar/JICS flow, society is selected from module modal.
    // Avoid calling /me to prevent unrelated permission checks.
    if (societyData?.id && user?.role !== "applicant") {
      setCurrentSocietyId(societyData.id);
      setCurrentDistrictId(societyData?.district_id || "");
      setIsLoadingSociety(false);
      return;
    }

    const fetchCurrentUserSociety = async () => {
      try {
        setIsLoadingSociety(true);
        const response = await getMySociety();
        setMySociety(response?.data?.society);
        if (response.success && response.data?.society?.id) {
          const societyId = response.data.society.id;
          const districtId = response.data.society.district_id;

          setCurrentSocietyId(societyId);
          setCurrentDistrictId(districtId || "");

          // Update form values if not editing existing data
          if (!data) {
            setValue("society_id", societyId);
            setValue(
              "society_registration_number",
              response.data.society.registration_number || "",
            );
            setValue(
              "society_name",
              response.data.society.cooperative_society_name || "",
            );
            applySocietyType(response.data.society);
            setValue("address", response.data.society.address || "");
            setValue(
              "date_of_original_registration",
              response.data.society.date_registration
                ? moment(response.data.society.date_registration).format(
                    "YYYY-MM-DD",
                  )
                : "",
            );
            setValue("status", "pending");
            setValue("active", true);
            setValue("declaration_accepted", false);
          }
        } else {
          console.error("No society ID found in response:", response);
          toast.error("Failed to get society information");
        }
      } catch (error) {
        console.error("Error fetching society information:", error);
      } finally {
        setIsLoadingSociety(false);
      }
    };

    fetchCurrentUserSociety();
  }, [setValue, data, societyData, user?.role, societyTypes]);

  useEffect(() => {
    const savedData = localStorage.getItem("liquidationFormData");
    let localData: any = {};
    if (savedData) {
      localData = JSON.parse(savedData);
    }

    if (societyData || localData) {
      setValue("society_id", societyData?.id || localData.society_id || "");
      setValue(
        "society_registration_number",
        societyData?.registration_number ||
          localData.society_registration_number ||
          "",
      );
      setValue(
        "society_name",
        societyData?.cooperative_society_name || localData.society_name || "",
      );
      applySocietyType(societyData?.id ? societyData : localData);
      setValue("address", societyData?.address || localData.address || "");
      setValue(
        "date_of_original_registration",
        societyData?.date_registration
          ? moment(societyData.date_registration).format("YYYY-MM-DD")
          : localData.date_of_original_registration || "",
      );
      setValue(
        "date_of_minutes_meeting",
        localData.date_of_minutes_meeting || "",
      );
      setValue(
        "date_of_circular_notice",
        localData.date_of_circular_notice || "",
      );
      setValue("status", localData.status?.key || "pending");
      setValue("active", true);
      setValue("declaration_accepted", localData.declaration_accepted || false);
    }
  }, [societyData, setValue]);

  const cleanPayload = (payload: Record<string, any>) => {
    Object.keys(payload).forEach((key) => {
      if (
        payload[key] === "" ||
        payload[key] === null ||
        payload[key] === undefined ||
        Number.isNaN(payload[key])
      ) {
        delete payload[key];
      }
    });
    return payload;
  };

  const saveDetails = async (
    formData: LiquidationFormType,
    status?: string,
  ) => {
    const today = moment().format("YYYY-MM-DD");
    const noticeDate = String(formData.date_of_circular_notice || "").slice(0, 10);
    const meetingDate = String(formData.date_of_minutes_meeting || "").slice(0, 10);
    if (noticeDate && noticeDate > today) {
      toast.error("Circular notice date cannot be in the future");
      return;
    }
    if (meetingDate && meetingDate > today) {
      toast.error("Meeting date cannot be in the future");
      return;
    }

    setLoading(true);
    try {
      const societyId = currentSocietyId || formData.society_id;
      if (!societyId) {
        toast.error(
          "Society information is missing. Please reload and try again.",
        );
        return;
      }

      let submissionData = {
        ...formData,
        society_id: societyId,
        district_id: currentDistrictId,
        mode_of_liquidation: liquidationMode,

        minutes_meeting_media_id: documentIds.minutes_meeting_media_id?.id,
        attendance_sheet_media_id: documentIds.attendance_sheet_media_id?.id,
        circular_notice_media_id: documentIds.circular_notice_media_id?.id,
        creditors_list_media_id: documentIds.creditors_list_media_id?.id,
        members_list_media_id: documentIds.members_list_media_id?.id,

        total_assets: parseFloat(formData.total_assets),
        total_liabilities: parseFloat(formData.total_liabilities),
        net_position:
          parseFloat(formData.total_assets) -
          parseFloat(formData.total_liabilities),
        share_capital_paid_up: parseFloat(formData.share_capital_paid_up),
        reserve_funds: parseFloat(formData.reserve_funds),

        declaration_accepted: formData.declaration_accepted,
      };

      submissionData = cleanPayload(submissionData);

      delete submissionData.status;
      delete submissionData.created_by;
      delete submissionData.active;
      delete submissionData.liquidation_person;

      let liquidationId;
      if (data?.id) {
        const response = await updateLiquidation(data.id, submissionData);
        if (response.success) {
          liquidationId = response.data.id;
          toast.success("Liquidation request updated successfully!");
        } else {
          toast.error(response.message);
        }
      } else {
        const response = await createLiquidation(submissionData);
        if (response.success) {
          liquidationId = response.data.id;
          toast.success("Liquidation request submitted successfully!");
        } else {
          toast.error(response.message);
        }
      }

      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Failed to submit liquidation request",
      );
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (formData: LiquidationFormType) => {
    // Check if society information is still loading
    if (isLoadingSociety) {
      toast.error("Please wait for society information to load");
      return;
    }

    // Ensure we have the current society ID
    if (!currentSocietyId) {
      toast.error("Society information is not loaded yet. Please try again.");
      return;
    }

    // Trigger form validation first
    const isValid = await trigger();

    if (!isValid) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    if (documentsRequired) {
      const missingDocuments = SOCIETY_LIQUIDATION_DOCUMENTS.filter(
        ([key]) => !documentIds[key]?.id,
      ).map(([, label]) => label);
      if (missingDocuments.length > 0) {
        toast.error(`Please upload: ${missingDocuments.join(", ")}`);
        return;
      }
    }

    // Store form data and show confirmation modal
    setPendingFormData(formData);
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (pendingFormData) {
      setShowConfirmModal(false);
      await saveDetails(pendingFormData);
      setPendingFormData(null);
    }
  };

  const handleCancelSubmit = () => {
    setShowConfirmModal(false);
  };

  const handleDocumentUploadCancel = (field: keyof typeof documentIds) => {
    setDocumentIds((prev) => {
      const newIds = { ...prev };
      delete newIds[field];
      return newIds;
    });
  };

  // Calculate net position
  const totalAssets = watch("total_assets") || "0";
  const totalLiabilities = watch("total_liabilities") || "0";
  const netPosition = parseFloat(totalAssets) - parseFloat(totalLiabilities);

  const saveAsDraft = () => {
    localStorage.setItem("liquidationFormData", JSON.stringify(watch()));
    toast.success("Draft saved successfully!");
  };

  return (
    <div className="space-y-6 mt-4 h-[90vh]">
      {isLoadingSociety && (
        <Card>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span
              className={`ml-3 text-gray-600 ${mode === "dark" ? "text-gray-400" : ""}`}
            >
              Loading society information...
            </span>
          </div>
        </Card>
      )}

      {!isLoadingSociety && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 1. Basic Society Information */}
          <Card>
            <div className="flex items-center space-x-3 mb-6">
              <Building2 className="h-6 w-6 text-blue-600" />
              <h3
                className={`text-xl font-semibold text-gray-900 ${mode}:text-gray-100`}
              >
                Basic Society Information
              </h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="Society Registration Number"
                  {...register("society_registration_number", {
                    required: "Society registration number is required",
                  })}
                  error={errors.society_registration_number?.message}
                  placeholder="Enter registration number"
                  readOnly={!!societyData}
                />
                <Input
                  label="Name of the Society"
                  {...register("society_name", {
                    required: "Society name is required",
                  })}
                  error={errors.society_name?.message}
                  placeholder="Enter society name"
                  readOnly={!!societyData}
                />
                <Input
                  label="Date of Original Registration"
                  type="date"
                  {...register("date_of_original_registration", {
                    required: "Original registration date is required",
                  })}
                  error={errors.date_of_original_registration?.message}
                  readOnly={!!societyData}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Input
                    label="Type of Society"
                    value={societyTypeLabel}
                    readOnly
                  />
                  <input type="hidden" {...register("society_type")} />
                  {errors.society_type && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.society_type.message}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Textarea
                    label="Address (Head office)"
                    // {...register('address', { required: 'Head office address is required' })}
                    error={errors.address?.message}
                    value={societyData?.full_address}
                    rows={3}
                    readOnly={!!societyData}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4
                  className={`text-lg font-medium text-gray-900 ${mode}:text-gray-100`}
                >
                  {documentsRequired ? "Required Documents" : "Documents"}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <DocumentUpload
                      label="Upload Minutes & Agenda"
                      existingDocument={documentIds.minutes_meeting_media_id}
                      onUploadComplete={(id: string, url?: string) =>
                        setDocumentIds((prev) => ({
                          ...prev,
                          minutes_meeting_media_id: { id, url: url || "" },
                        }))
                      }
                      onUploadCancel={() => {}}
                      required={documentsRequired}
                      onReplace={(id: string, url?: string) =>
                        setDocumentIds((prev) => ({
                          ...prev,
                          minutes_meeting_media_id: { id, url: url || "" },
                        }))
                      }
                    />

                    <DocumentUpload
                      label="Upload Attendance Sheet"
                      existingDocument={documentIds.attendance_sheet_media_id}
                      onUploadComplete={(id: string, url?: string) =>
                        setDocumentIds((prev) => ({
                          ...prev,
                          attendance_sheet_media_id: { id, url: url || "" },
                        }))
                      }
                      onUploadCancel={() => {}}
                      required={documentsRequired}
                      onReplace={(id: string, url?: string) =>
                        setDocumentIds((prev) => ({
                          ...prev,
                          attendance_sheet_media_id: { id, url: url || "" },
                        }))
                      }
                    />

                    <DocumentUpload
                      label="Upload Circular Notice"
                      existingDocument={documentIds.circular_notice_media_id}
                      onUploadComplete={(id: string, url?: string) =>
                        setDocumentIds((prev) => ({
                          ...prev,
                          circular_notice_media_id: { id, url: url || "" },
                        }))
                      }
                      onUploadCancel={() => {}}
                      required={documentsRequired}
                      onReplace={(id: string, url?: string) =>
                        setDocumentIds((prev) => ({
                          ...prev,
                          circular_notice_media_id: { id, url: url || "" },
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-3">
                    <Input
                      type="date"
                      label="Date of Circular Notice"
                      max={moment().format("YYYY-MM-DD")}
                      {...register("date_of_circular_notice", {
                        required: "Circular notice date is required",
                        validate: (value) =>
                          !value ||
                          value <= moment().format("YYYY-MM-DD") ||
                          "Circular notice date cannot be in the future",
                      })}
                      error={errors.date_of_circular_notice?.message}
                    />
                    <Input
                      type="date"
                      label="Date of Minutes of Meeting"
                      max={moment().format("YYYY-MM-DD")}
                      {...register("date_of_minutes_meeting", {
                        required: "Meeting date is required",
                        validate: (value) =>
                          !value ||
                          value <= moment().format("YYYY-MM-DD") ||
                          "Meeting date cannot be in the future",
                      })}
                      error={errors.date_of_minutes_meeting?.message}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 2. Liquidation Order Details */}
          <Card>
            <div className="flex items-center space-x-3 mb-6">
              <FileText className="h-6 w-6 text-green-600" />
              <h3
                className={`text-xl font-semibold text-gray-900 ${mode}:text-gray-100`}
              >
                Liquidation Order Details
              </h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label
                    className={`block text-sm font-medium text-gray-700 ${mode}:text-gray-300 mb-2`}
                  >
                    Mode of Liquidation
                  </label>
                  <RadioGroup
                    options={liquidationModeOptions}
                    value={liquidationMode}
                    onChange={(value) =>
                      setLiquidationMode(value as "voluntary" | "compulsory")
                    }
                    name="liquidationMode"
                  />
                </div>
                <Input
                  label="Liquidation Order Number"
                  {...register("liquidation_order_number")}
                  error={errors.liquidation_order_number?.message}
                  placeholder="Enter order number"
                  maxLength={30}
                  minLength={0}
                />
                <Input
                  label="Date of Liquidation Order"
                  type="date"
                  {...register("date_of_liquidation_order")}
                  error={errors.date_of_liquidation_order?.message}
                  minLength={0}
                />
              </div>

              <Textarea
                label="Reason for Liquidation"
                {...register("reason_for_liquidation", {
                  required: "Reason for liquidation is required",
                })}
                error={errors.reason_for_liquidation?.message}
                placeholder="Describe the reason for liquidation"
                rows={4}
                required
              />
            </div>
          </Card>

          {/* 3. Financial Position at Liquidation Start */}
          <Card>
            <div className="flex items-center space-x-3 mb-6">
              <DollarSign className="h-6 w-6 text-purple-600" />
              <h3
                className={`text-xl font-semibold text-gray-900 ${mode}:text-gray-100`}
              >
                Financial Position at Liquidation Start
              </h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <Input
                  label="Total Assets (₹)"
                  type="number"
                  step="1"
                  {...register("total_assets", {
                    required: "Total assets is required",
                    min: { value: 0, message: "Total assets must be positive" },
                  })}
                  error={errors.total_assets?.message}
                  placeholder="0.00"
                  required
                  maxLength={8}
                />
                <Input
                  label="Total Liabilities (₹)"
                  type="number"
                  step="1"
                  {...register("total_liabilities", {
                    required: "Total liabilities is required",
                    min: {
                      value: 0,
                      message: "Total liabilities must be positive",
                    },
                  })}
                  error={errors.total_liabilities?.message}
                  placeholder="0.00"
                  required
                  maxLength={8}
                />
                <div>
                  <label
                    className={`block text-sm font-medium text-gray-700 ${mode}:text-gray-300 mb-1`}
                  >
                    Net Position (Assets - Liabilities)
                  </label>
                  <Input
                    value={`₹ ${netPosition.toFixed(2)}`}
                    readOnly
                    className="bg-gray-100"
                  />
                </div>
                <Input
                  label="Share Capital Paid-up (₹)"
                  type="number"
                  step="1"
                  {...register("share_capital_paid_up", {
                    required: "Share capital paid-up is required",
                    min: {
                      value: 0,
                      message: "Share capital must be positive",
                    },
                  })}
                  error={errors.share_capital_paid_up?.message}
                  placeholder="0.00"
                  required
                  maxLength={8}
                />
                <Input
                  label="Reserve Funds (₹)"
                  type="number"
                  step="1"
                  {...register("reserve_funds", {
                    required: "Reserve funds is required",
                    min: {
                      value: 0,
                      message: "Reserve funds must be positive",
                    },
                  })}
                  error={errors.reserve_funds?.message}
                  placeholder="0.00"
                  required
                  maxLength={8}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DocumentUpload
                  label="Upload Creditors List"
                  existingDocument={documentIds.creditors_list_media_id}
                  onUploadComplete={(id: string, url?: string) =>
                    setDocumentIds((prev) => ({
                      ...prev,
                      creditors_list_media_id: { id, url: url || "" },
                    }))
                  }
                  onUploadCancel={() =>
                    handleDocumentUploadCancel("creditors_list_media_id")
                  }
                  required={documentsRequired}
                  onReplace={(id: string, url?: string) =>
                    setDocumentIds((prev) => ({
                      ...prev,
                      creditors_list_media_id: { id, url: url || "" },
                    }))
                  }
                />

                <DocumentUpload
                  label="Upload Members List"
                  existingDocument={documentIds.members_list_media_id}
                  onUploadComplete={(id: string, url?: string) =>
                    setDocumentIds((prev) => ({
                      ...prev,
                      members_list_media_id: { id, url: url || "" },
                    }))
                  }
                  onUploadCancel={() =>
                    handleDocumentUploadCancel("members_list_media_id")
                  }
                  required={documentsRequired}
                  onReplace={(id: string, url?: string) =>
                    setDocumentIds((prev) => ({
                      ...prev,
                      members_list_media_id: { id, url: url || "" },
                    }))
                  }
                />
              </div>
            </div>
          </Card>

          <Card className="flex flex-col md:flex-row items-center justify-between w-full md:w-auto gap-2 md:gap-0 md:space-x-3 mb-4">
            <div
              className={`mb-4 sm:mb-0 w-[${data?.status?.key !== "draft" ? "80%" : "80%"}]`}
            >
              <Checkbox
                label="I declare that all the information provided above is true and correct to the best of my knowledge and belief. I understand that any false information may result in rejection of this liquidation request."
                {...register("declaration_accepted", {
                  required:
                    "Declaration acceptance is required to submit the liquidation request",
                })}
                error={errors.declaration_accepted?.message}
              />
            </div>
            <div className="flex gap-2">
              {/* {data?.status?.key !== 'draft' && <Button type="button" variant="outline" onClick={saveAsDraft} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              Save as Draft
            </Button>} */}
              <Button type="submit" disabled={loading}>
                <Send className="h-4 w-4 mr-2" />
                {loading
                  ? "Submitting..."
                  : data
                    ? "Update Liquidation"
                    : "Submit Liquidation"}
              </Button>
            </div>
          </Card>
        </form>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={handleCancelSubmit}
        title=""
        size="md"
      >
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <AlertCircle className="h-10 w-10 text-amber-500" />
          </div>
          <div className="flex items-center space-x-3 text-center">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Your Submission
              </h3>
              <p className="text-gray-600 text-sm">
                Are you sure you want to submit this liquidation request? Please
                review all the information carefully before proceeding.
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> Once submitted, you may not be able to
              edit the information after submission.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelSubmit}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmSubmit}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Submitting..." : "Confirm & Submit"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
