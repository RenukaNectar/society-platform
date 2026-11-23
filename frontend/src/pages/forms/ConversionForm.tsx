import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { AlertCircle, CheckCircle } from "lucide-react";

import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { DocumentUpload } from "../../components/ui/DocumentUpload";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";

import {
  createSocietyConversion,
  getConversionById,
  resubmitSocietyConversion,
} from "../../lib/data/conversionSociety/api";
import { getMySociety } from "../../lib/data/users/api";
import { useMasterData } from "../../hooks/useMasterData";
import { CoorporativeMapping } from "../../pages/coorporativeForms/coorporativeMapping";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { getBodList } from "../../lib/data/BOD/api";
import BodModule from "../../components/bod/BodModule";
import { useConversionMeetingEligibility } from "../../hooks/conversion/useConversionMeetingEligibility";
import { ConversionMeetingAccessBlock } from "../../components/conversion/ConversionMeetingAccessBlock";
import {
  CONVERTED_SOCIETY_ADDRESS_KEY,
  CONVERTED_SOCIETY_NAME_KEY,
  readConvertedSocietyIdentity,
  withoutConvertedSocietyIdentity,
} from "../../utils/conversionIdentity";

/* ====================================================================== */
/* TYPES */
/* ====================================================================== */

type DocKey =
  | "notice_sgbm"
  | "minutes_meeting"
  | "form_g"
  | "attendance_sheet"
  | "bye_laws"
  | "audit_report";

interface UploadedDoc {
  id: string;
  url: string;
}

type DocumentsState = Record<DocKey, UploadedDoc | null>;

const CONVERSION_DOCUMENT_LABELS: Record<DocKey, string> = {
  notice_sgbm: "Notice Sgbm",
  minutes_meeting: "Minutes Meeting",
  form_g: "Form G",
  attendance_sheet: "Attendance Sheet",
  bye_laws: "New Byelaws",
  audit_report: "Audit Report",
};

/* ====================================================================== */
/* COMPONENT */
/* ====================================================================== */

export const ConversionForm: React.FC = () => {
  const navigate = useNavigate();
  const { masterData } = useMasterData();
  const { societyId, conversionId } = useParams<{
    societyId: string;
    conversionId?: string;
  }>();

  const { statuses } = useSelector((state: RootState) => state.statuses);
  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const isApplicant = authUser?.role === "applicant";
  const meetingEligibility = useConversionMeetingEligibility(
    isApplicant && !conversionId,
  );

  const getStatusKey = (key: string) =>
    statuses.find((s) => s.key === key)?.key;

  /* ------------------------------------------------------------------ */
  /* SOCIETY STATE */
  /* ------------------------------------------------------------------ */

  const [society, setSociety] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [societyLoading, setSocietyLoading] = useState(false);
  const [isVerified, setIsVerified] = useState<number>(0);
  const [verificationLoading, setVerificationLoading] = useState(false);

  /* ------------------------------------------------------------------ */
  /* CONVERSION STATE */
  /* ------------------------------------------------------------------ */

  const [conversionFrom, setConversionFrom] = useState("");
  const [conversionTo, setConversionTo] = useState("");

  const [coorporativeSocietyType, setCoorporativeSocietyType] = useState("");
  const [additionalData, setAdditionalData] = useState<any>(null);

  const [showModal, setShowModal] = useState(false);
  const [convertedName, setConvertedName] = useState("");
  const [convertedAddress, setConvertedAddress] = useState("");
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [identityDraft, setIdentityDraft] = useState({ name: "", address: "" });
  const [formTouched, setFormTouched] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadedConversion, setLoadedConversion] = useState<any>(null);
  const isPrefillLoading = Boolean(conversionId && !loadedConversion);

  /* ------------------------------------------------------------------ */
  /* DOCUMENTS */
  /* ------------------------------------------------------------------ */

  const [documents, setDocuments] = useState<DocumentsState>({
    notice_sgbm: null,
    minutes_meeting: null,
    form_g: null,
    attendance_sheet: null,
    bye_laws: null,
    audit_report: null,
  });

  /* ------------------------------------------------------------------ */
  /* DERIVED / HELPERS */
  /* ------------------------------------------------------------------ */

  const isAdditionalDataValid = (data: any) =>
    Boolean(data && typeof data === "object" && Object.keys(data).length > 0);

  const isSubmitDisabled = Object.values(documents).some((d) => !d);

  const conversionFromSector = masterData.sectorOfOperations.find(
    (s) => s.id.toString() === conversionFrom,
  );

  const shouldShowEditButton = Boolean(conversionTo && coorporativeSocietyType);

  /* ------------------------------------------------------------------ */
  /* LOAD SOCIETY */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    const loadSociety = async () => {
      try {
        setSocietyLoading(true);

        const res = await getMySociety();
        const soc = res?.data?.society;
        if (!soc) return;

        setSociety(soc);
        setUser(res?.data?.user);

        const sectorId = soc.sector_of_operation?.id?.toString();
        if (!sectorId) return;

        setConversionFrom(sectorId);
      } finally {
        setSocietyLoading(false);
      }
    };

    if (masterData.sectorOfOperations.length) {
      loadSociety();
    }
  }, [masterData.sectorOfOperations]);

  useEffect(() => {
    const checkBodVerification = async () => {
      if (!isApplicant || !society?.id) return;

      try {
        setVerificationLoading(true);
        const res = await getBodList(society.id, "conversion");
        setIsVerified(res?.data?.is_verified || 0);
      } catch {
        setIsVerified(0);
      } finally {
        setVerificationLoading(false);
      }
    };

    checkBodVerification();
  }, [isApplicant, society?.id]);

  /* ------------------------------------------------------------------ */
  /* Pre filled  Conversion */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (!conversionId) return;

    const loadConversion = async () => {
      try {
        const res: any = await getConversionById(conversionId);
        const conv = res?.data;

        if (!conv) return;

        setLoadedConversion(conv);
        setIsEditMode(true);
      } catch (e) {
        toast.error("Failed to load conversion");
      }
    };

    loadConversion();
  }, [conversionId]);

  useEffect(() => {
    if (!loadedConversion || !masterData.sectorOfOperations.length) return;

    setConversionFrom(String(loadedConversion.conversion_from));
    setConversionTo(String(loadedConversion.conversion_to));

    const identity = readConvertedSocietyIdentity(loadedConversion.data);
    setConvertedName(identity.name);
    setConvertedAddress(identity.address);
    setAdditionalData(withoutConvertedSocietyIdentity(loadedConversion.data ?? {}));
    setFormTouched(true);

    const sector = masterData.sectorOfOperations.find(
      (s) => String(s.id) === String(loadedConversion.conversion_to),
    );

    setCoorporativeSocietyType(sector?.respective_table ?? "");

    setDocuments({
      notice_sgbm: loadedConversion.noticeSgbmMedia
        ? {
          id: loadedConversion.noticeSgbmMedia.id,
          url: loadedConversion.noticeSgbmMedia.url,
        }
        : null,
      minutes_meeting: loadedConversion.minutesMeetingMedia
        ? {
          id: loadedConversion.minutesMeetingMedia.id,
          url: loadedConversion.minutesMeetingMedia.url,
        }
        : null,
      form_g: loadedConversion.formGMedia
        ? {
          id: loadedConversion.formGMedia.id,
          url: loadedConversion.formGMedia.url,
        }
        : null,
      attendance_sheet: loadedConversion.attendanceSheetMedia
        ? {
          id: loadedConversion.attendanceSheetMedia.id,
          url: loadedConversion.attendanceSheetMedia.url,
        }
        : null,
      bye_laws: loadedConversion.byeLawsMedia
        ? {
          id: loadedConversion.byeLawsMedia.id,
          url: loadedConversion.byeLawsMedia.url,
        }
        : null,
      audit_report: loadedConversion.auditReportMedia
        ? {
          id: loadedConversion.auditReportMedia.id,
          url: loadedConversion.auditReportMedia.url,
        }
        : null,
    });
  }, [loadedConversion, masterData.sectorOfOperations]);

  const submit = async () => {
    if (!societyId) return toast.error("Invalid society");
    if (!conversionTo) return toast.error("Please select conversion sector");
    if (isSubmitDisabled)
      return toast.error("Please upload all required documents");

    if (!isAdditionalDataValid(additionalData)) {
      setFormTouched(true);
      return toast.error(
        'Please fill the cooperative society form by clicking "Edit Form"',
      );
    }

    const nextName = convertedName.trim();
    const nextAddress = convertedAddress.trim();
    if (!nextName || !nextAddress) {
      setIdentityDraft({ name: convertedName, address: convertedAddress });
      setShowIdentityModal(true);
      return toast.error(
        "Please enter the new society name and complete address",
      );
    }

    const statusToSend = isEditMode
      ? getStatusKey("submitted")
      : getStatusKey("submitted");

    const payload = {
      society_id: societyId,
      conversion_from: conversionFrom,
      conversion_to: conversionTo,
      conversion_reason: "Conversion initiated by society",
      status: statusToSend ?? "submitted",
      data: {
        ...withoutConvertedSocietyIdentity(additionalData),
        [CONVERTED_SOCIETY_NAME_KEY]: nextName,
        [CONVERTED_SOCIETY_ADDRESS_KEY]: nextAddress,
      },
      notice_sgbm: documents.notice_sgbm?.id,
      minutes_meeting: documents.minutes_meeting?.id,
      form_g: documents.form_g?.id,
      attendance_sheet: documents.attendance_sheet?.id,
      bye_laws: documents.bye_laws?.id,
      audit_report: documents.audit_report?.id,
      is_active: true,
    };

    try {
      if (conversionId) {
        await resubmitSocietyConversion(conversionId, payload);
        toast.success("Conversion request resubmitted successfully");
      } else {
        await createSocietyConversion(payload);
        toast.success("Conversion request submitted successfully");
      }

      navigate("/my-society");
    } catch (e: any) {
      toast.error(e.message || "Submission failed");
    }
  };

  /* ------------------------------------------------------------------ */
  /* HANDLERS */
  /* ------------------------------------------------------------------ */

  const handleConversionToChange = (sectorId: string) => {
    setConversionTo(sectorId);
    setFormTouched(false);

    const sector: any = masterData.sectorOfOperations.find(
      (s: any) => s.id.toString() === sectorId,
    );
    if (!sector) return;

    setCoorporativeSocietyType(sector.respective_table);
    if (!isEditMode) {
      setAdditionalData(null);
    }

    setShowModal(true);
  };

  /* ------------------------------------------------------------------ */
  /* RENDER */
  /* ------------------------------------------------------------------ */

  if (
    isApplicant &&
    !conversionId &&
    (meetingEligibility.loading || societyLoading)
  ) {
    return (
      <Card className="p-6 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto" />
        <p className="mt-2 text-sm text-gray-600">
          Checking conversion eligibility...
        </p>
      </Card>
    );
  }

  if (isApplicant && !conversionId && !meetingEligibility.isEligible) {
    return <ConversionMeetingAccessBlock />;
  }

  if (isApplicant && (societyLoading || (society?.id && verificationLoading))) {
    return (
      <Card className="p-6 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto" />
        <p className="mt-2 text-sm text-gray-600">
          Checking verification status...
        </p>
      </Card>
    );
  }

  if (isApplicant && !verificationLoading && society?.id && isVerified !== 1) {
    return (
      <BodModule
        module_name="conversion"
        onVerified={() => {
          setIsVerified(1);
        }}
      />
    );
  }

  return (
    <div className="p-6 w-full space-y-6">
      {/* ================= HEADER ================= */}

      {society && (
        <Card className="p-4 pb-0">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {society.cooperative_society_name}
              </h1>

              <p className="text-gray-600 mb-2">
                {society.local_langauge_society_name &&
                  `${society.local_langauge_society_name} • `}
                Registration No: {society.registration_number}
              </p>

              <h5>
                NCD ID:{" "}
                <strong className="font-semibold">{society.ncd_id}</strong>
              </h5>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-500">Society ID</p>
              <p className="text-lg font-semibold text-gray-900">
                {society.society_id}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ================= CONVERSION FORM ================= */}

      {isPrefillLoading ? (
        <Card className="p-6 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-600">
            Loading conversion details…
          </p>
        </Card>
      ) : (
        <Card className="p-6 space-y-6">
          {/* Sector Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Conversion From */}
            <div>
              <label className="text-sm font-medium">Conversion From</label>
              <div className="mt-1 px-3 py-2">
                {societyLoading
                  ? "Loading..."
                  : conversionFromSector?.name || "—"}
              </div>
            </div>

            {/* Conversion To */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Select
                  label="Conversion To"
                  value={conversionTo}
                  disabled={
                    !conversionFrom || !masterData.sectorOfOperations.length
                  }
                  onChange={(e) => handleConversionToChange(e.target.value)}
                >
                  <option value="">-- Select Sector --</option>
                  {masterData.sectorOfOperations
                    .filter((s) => s.id.toString() !== conversionFrom)
                    .map((s) => (
                      <option key={s.id} value={s.id.toString()}>
                        {s.name}
                      </option>
                    ))}
                </Select>
              </div>

              {shouldShowEditButton && (
                <Button
                  size="sm"
                  className="mb-1"
                  onClick={() => {
                    setFormTouched(true);
                    setShowModal(true);
                  }}
                >
                  Edit Form
                </Button>
              )}
            </div>
          </div>

          {/* Additional Data Validation */}
          {conversionTo &&
            !isAdditionalDataValid(additionalData) &&
            formTouched && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span>
                    <strong>Required:</strong> Please click <b>"Edit Form"</b>{" "}
                    to fill the cooperative society form.
                  </span>
                </div>
              </div>
            )}

          <div className="rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">
                  Name and address after conversion
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Enter the society&apos;s new name and complete address. These
                  details are shown in My Society.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setIdentityDraft({
                    name: convertedName,
                    address: convertedAddress,
                  });
                  setShowIdentityModal(true);
                }}
              >
                {convertedName && convertedAddress ? "Edit" : "Enter details"}
              </Button>
            </div>
            {convertedName && convertedAddress ? (
              <div className="text-sm text-gray-800 space-y-1">
                <p>
                  <span className="font-medium">New name:</span> {convertedName}
                </p>
                <p>
                  <span className="font-medium">Complete address:</span>{" "}
                  {convertedAddress}
                </p>
              </div>
            ) : (
              <p className="text-sm text-amber-700">
                New name and complete address are required before submit.
              </p>
            )}
          </div>

          {conversionTo && isAdditionalDataValid(additionalData) && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>
                  <strong>Form Completed:</strong> Cooperative society form has
                  been filled.
                </span>
              </div>
            </div>
          )}

          {/* Documents */}
          <h3 className="text-lg font-semibold">Upload Necessary Documents</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(Object.keys(documents) as DocKey[]).map((key, i) => (
              <DocumentUpload
                key={key}
                label={`${i + 1}. ${CONVERSION_DOCUMENT_LABELS[key]}`}
                required
                existingDocument={documents[key] ?? undefined}
                onUploadComplete={(id, url) =>
                  setDocuments((p) => ({ ...p, [key]: { id, url } }))
                }
                onReplace={(id, url) =>
                  setDocuments((p) => ({ ...p, [key]: { id, url } }))
                }
                onUploadCancel={() =>
                  setDocuments((p) => ({ ...p, [key]: null }))
                }
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-6">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button onClick={submit}>
              {isEditMode
                ? "Update Conversion Request"
                : "Submit Conversion Request"}
            </Button>
          </div>
        </Card>
      )}

      {/* ================= MODAL ================= */}

      {showModal && (
        <Modal
          isOpen
          size="xl"
          title="Cooperative Society Form"
          onClose={() => {
            setShowModal(false);
            setFormTouched(true);
          }}
        >
          <CoorporativeMapping
            societyType={coorporativeSocietyType}
            data={{ ...withoutConvertedSocietyIdentity(additionalData) }}
            onSubmit={(data) => {
              setAdditionalData(data);
              setFormTouched(true);
              setShowModal(false);
            }}
            onCancel={() => {
              setShowModal(false);
              setFormTouched(true);
            }}
            onClose={() => {
              setShowModal(false);
              setFormTouched(true);
            }}
          />
        </Modal>
      )}

      {showIdentityModal && (
        <Modal
          isOpen
          title="Society name and address after conversion"
          onClose={() => setShowIdentityModal(false)}
        >
          <div className="space-y-4">
            <Input
              label="New society name"
              required
              value={identityDraft.name}
              onChange={(e) =>
                setIdentityDraft((current) => ({
                  ...current,
                  name: e.target.value,
                }))
              }
              placeholder="Enter the new name of the society"
            />
            <Textarea
              label="Complete address"
              required
              rows={4}
              value={identityDraft.address}
              onChange={(e) =>
                setIdentityDraft((current) => ({
                  ...current,
                  address: e.target.value,
                }))
              }
              placeholder="Enter the complete address of the society"
            />
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowIdentityModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const name = identityDraft.name.trim();
                  const address = identityDraft.address.trim();
                  if (!name || !address) {
                    toast.error(
                      "Please enter the new society name and complete address",
                    );
                    return;
                  }
                  setConvertedName(name);
                  setConvertedAddress(address);
                  setShowIdentityModal(false);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
