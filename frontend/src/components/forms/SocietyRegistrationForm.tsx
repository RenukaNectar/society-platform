import React, { useEffect, useRef, useState } from 'react';

import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { DocumentUpload } from '../ui/DocumentUpload';
import { CheckCircle, ChevronRight, ChevronLeft, Plus, AlertCircle, Minus, Eye, Download, FileText, X, Save } from 'lucide-react';
import { Member, SocietyFormData } from '../../types';
import { getSocietyById, registerSociety } from '../../lib/data/societies/api';
import { toast } from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MIN_SOCIETY_REGISTRATION_PROMOTERS,
  minApstPromotersRequired,
  validateStep,
} from '../../utils/validation';
import { societyInitialValues, steps } from '../../utils/constants';
import { useMasterData } from '../../hooks/useMasterData';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getAllStatuses } from '../../lib/data/others/api';
import { setStatuses } from '../../store/slices/statusSlice';
import { handleViewPdf } from '../../utils/viewpdf';
import { download } from '../../utils/download';
import { Textarea } from '../ui/Textarea';
import { CoorporativeMapping } from '../../pages/coorporativeForms/coorporativeMapping';
import { DocumentChecklist } from '../ui/DocumentChecklist';
import { uuidv4 } from 'zod/v4';
import { getUrbanLocalBodies, getUrbanLocalBodiesWard, getBanksByFilters, Bank } from '../../lib/data/master-data/api';
import { transliterateToHindi } from '../../utils/translateToHindi';

export const SocietyRegistrationForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showDocumentChecklist, setShowDocumentChecklist] = useState(false);
  const [coorporativeSocietyType, setCoorporativeSocietyType] = useState('');
  const [showCoorporativeSocietyType, setShowCoorporativeSocietyType] = useState(false);
  const [originalSectorData, setOriginalSectorData] = useState<{
    sectorId: string;
    additionalData: any;
  } | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [newMember, setNewMember] = useState({
    name: '',
    mobile: '',
    gender: '',
    category: '',
    designation: '',
    is_co_opted: false,
  });



  const { id } = useLocation().state || {};
  const navigate = useNavigate();

  const [formData, setFormData] = useState<SocietyFormData>(societyInitialValues);
  const [isTransliteratingLocalName, setIsTransliteratingLocalName] = useState(false);
  const transliterateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transliterateAbortRef = useRef<AbortController | null>(null);
  const [documentIds, setDocumentIds] = useState<{
    bye_laws?: { id: string; url: string };
    bank_certificate?: { id: string; url: string };
    economic_scheme?: { id: string; url: string };
    contributor_list?: { id: string; url: string };
    custom_documents?: { id: string; url: string };
    non_family_coop_certificate?: { id: string; url: string };
    site_inspection_report?: { id: string; url: string };
    circular_minutes_of_meeting?: { id: string; url: string };
    land_document?: { id: string; url: string };
    full_particulars_of_the_promoter?: { id: string; url: string };
    circular_for_promoters_meeting?: { id: string; url: string };
    minutes_of_meeting_of_promoters_meeting?: { id: string; url: string };
  }>({});


  // State to track existing documents from API
  const [existingDocuments, setExistingDocuments] = useState<{
    bye_laws?: { id: string; url: string };
    bank_certificate?: { id: string; url: string };
    economic_scheme?: { id: string; url: string };
    contributor_list?: { id: string; url: string };
    custom_documents?: { id: string; url: string };
    non_family_coop_certificate?: { id: string; url: string };
    site_inspection_report?: { id: string; url: string };
    circular_minutes_of_meeting?: { id: string; url: string };
    land_document?: { id: string; url: string };
    full_particulars_of_the_promoter?: { id: string; url: string };
    circular_for_promoters_meeting?: { id: string; url: string };
    minutes_of_meeting_of_promoters_meeting?: { id: string; url: string };
  }>({});

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSocietyNamePhrasePopup, setShowSocietyNamePhrasePopup] = useState(false);
  const [memberErrors, setMemberErrors] = useState<Record<string, string>>({});
  const [urbanLocalBodies, setUrbanLocalBodies] = useState<any[]>([]);
  const [urbanLocalBodiesWards, setUrbanLocalBodiesWards] = useState<any[]>([]);
  const [urbanLocalBodiesLoading, setUrbanLocalBodiesLoading] = useState(false);
  const [urbanLocalBodiesWardsLoading, setUrbanLocalBodiesWardsLoading] = useState(false);
  const [existingDesignation, setExistingDesignation] = useState<{
    chairmenExist: boolean;
    secretariesExist: boolean;
    treasurersExist: boolean;
  }>({
    chairmenExist: false,
    secretariesExist: false,
    treasurersExist: false,
  });
  const [filteredBanks, setFilteredBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const {
    masterData,
    selectedState,
    selectedDistrict,
    selectedBlock,
    handleStateChange,
    handleDistrictChange,
    handleBlockChange,
    handleGramPanchayatChange,
    selectedGramPanchayat,
  } = useMasterData();

  const villages = masterData?.villageRows || [];

  const getGramPanchayatKey = (gp: { id?: number; gram_panchayat_code?: string }) =>
    gp.id != null ? String(gp.id) : String(gp.gram_panchayat_code ?? "");

  const filteredVillages = villages;
  const selectedLocationType = masterData.locationTypes.find(
    (locationType) => locationType.id?.toString() === formData.location_of_head_quarter
  );
  const isUrbanLocation = selectedLocationType?.name === 'Urban';
  const selectedUrbanLocalBody = urbanLocalBodies.find(
    (body) => body.id?.toString() === formData.urban_local_body_type?.toString()
  );

  // Helper function to validate additional data
  const isAdditionalDataValid = (data: any): boolean => {
    if (!data) return false;
    if (typeof data === 'object' && Object.keys(data).length === 0) return false;
    return true;
  };

  // Redux token for PDF viewing
  const dispatch = useDispatch();
  const { token } = useSelector((state: RootState) => state.auth);
  const { statuses } = useSelector((state: RootState) => state.statuses);

  // Watch for sector changes to restore original data when returning to original sector
  useEffect(() => {
    if (formData.sector_of_operation && originalSectorData && formData.sector_of_operation === originalSectorData.sectorId) {
      // If returning to the original sector, restore the original additional data
      setFormData(prev => ({
        ...prev,
        additional_data: originalSectorData.additionalData
      }));
    }
  }, [formData.sector_of_operation, originalSectorData]);

  // Show document checklist on form load
  useEffect(() => {
    setShowDocumentChecklist(true);
  }, []);

  useEffect(() => {
    return () => {
      if (transliterateTimeoutRef.current) {
        clearTimeout(transliterateTimeoutRef.current);
      }
      transliterateAbortRef.current?.abort();
    };
  }, []);

  const autoTransliterateLocalName = (englishName: string) => {
    if (transliterateTimeoutRef.current) {
      clearTimeout(transliterateTimeoutRef.current);
    }
    transliterateAbortRef.current?.abort();

    if (!englishName.trim()) {
      setIsTransliteratingLocalName(false);
      setFormData((prev) => ({ ...prev, local_langauge_society_name: '' }));
      return;
    }

    transliterateTimeoutRef.current = setTimeout(async () => {
      const controller = new AbortController();
      transliterateAbortRef.current = controller;
      setIsTransliteratingLocalName(true);

      try {
        const hindiName = await transliterateToHindi(englishName, controller.signal);
        setFormData((prev) => ({
          ...prev,
          local_langauge_society_name: hindiName,
        }));
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Hindi transliteration failed:', error);
        }
      } finally {
        if (transliterateAbortRef.current === controller) {
          setIsTransliteratingLocalName(false);
        }
      }
    }, 400);
  };

  useEffect(() => {
    if (!formData.bank_type) {
      setFilteredBanks([]);
      return;
    }

    if (formData.bank_type === 'cooperative') {
      if (!formData.state_id) {
        setFilteredBanks([]);
        return;
      }

      const selectedStateRecord = masterData.states.find(
        (state) => state.id.toString() === formData.state_id.toString()
      );
      if (!selectedStateRecord?.name) {
        setFilteredBanks([]);
        return;
      }

      setBanksLoading(true);
      getBanksByFilters({ state: selectedStateRecord.name, type: 'Cooperative' })
        .then((banks) => setFilteredBanks(banks))
        .catch(() => setFilteredBanks([]))
        .finally(() => setBanksLoading(false));
      return;
    }

    setBanksLoading(true);
    getBanksByFilters({ type: 'Commercial' })
      .then((banks) => setFilteredBanks(banks))
      .catch(() => setFilteredBanks([]))
      .finally(() => setBanksLoading(false));
  }, [formData.state_id, formData.bank_type, masterData.states]);

  // Function to validate member details
  const validateMemberDetails = () => {
    const errors: Record<string, string> = {};

    if (!newMember.name.trim()) {
      errors.name = 'Promoter name is required';
    } else if (newMember.name.trim().length < 2) {
      errors.name = 'Promoter name must be at least 2 characters';
    }

    const promoterMobile = newMember.mobile.trim();
    if (!promoterMobile) {
      errors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(promoterMobile)) {
      errors.mobile = 'Mobile number must consist of digits only';
    } else if (
      formData.members.some(
        (member) =>
          member.mobile?.trim() === promoterMobile &&
          member.id !== editingMember?.id
      )
    ) {
      errors.mobile = 'This mobile number is already used for another promoter';
    }

    const promoterName = newMember.name.trim().toLowerCase();
    if (
      promoterName &&
      formData.members.some(
        (member) =>
          member.name?.trim().toLowerCase() === promoterName &&
          member.id !== editingMember?.id
      )
    ) {
      errors.name = 'This name is already used for another promoter';
    }

    if (!newMember.gender) {
      errors.gender = 'Gender is required';
    }

    if (!newMember.category) {
      errors.category = 'Category is required';
    }

    if (!newMember.designation) {
      errors.designation = 'Designation is required';
    }

    setMemberErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Function to handle modal close
  const handleCloseMemberModal = () => {
    setShowAddMemberModal(false);
    setEditingMember(null);
    setNewMember({
      name: '',
      mobile: '',
      gender: '',
      category: '',
      designation: '',
      is_co_opted: false,
    });
    setMemberErrors({});
  };

  const handleView = (url: string) => {
    handleViewPdf(url, token || '');
  };

  // Handler to download PDF
  const handleDownloadPdf = (url: string) => {
    download(url, token || '')
  };

  useEffect(() => {
    if (id && masterData.states.length > 0) {
      getSocietyById(id).then((res: any) => {
        if (res) {
          // Find the state by ID to get its state_code for district loading
          const state = masterData.states.find(s => s.id.toString() === res?.society?.state_id?.toString());
          if (state) {
            handleStateChange(state.state_code);
          }
          const s: any = res?.society || {};
          const { village, gram_panchayat: gp, block: blockNested, ...sRest } = s;
          const sectorId = s?.sector_of_operation?.id || '';
          const societyAdditionalData = s?.additional_data;

          setFormData({
            ...sRest,
            members: res?.members,
            functional_status: s?.functional_status?.id,
            sector_of_operation_type: s?.sector_of_operation_type?.id,
            sector_of_operation: sectorId,
            society_type:
              (typeof s?.society_type === 'object' && s?.society_type?.id
                ? String(s.society_type.id)
                : s?.society_type
                  ? String(s.society_type)
                  : '') || sectorId,
            registration_authoritie_id: s?.registration_authority?.id || '',
            operation_area_location: s?.operation_area_location || '',
            cooperative_society_type_id: s?.cooperative_society_type?.id || '',
            is_adjacent_to_water_body: s?.water_body_type_id ? 'yes' : 'no',
            location_of_head_quarter: s?.location_of_head_quarter?.id || '',
            urban_local_body_type: s?.urban_local_body_type?.id || '',
            locality_ward_code: s?.locality_ward_code?.id || '',
            additional_data: societyAdditionalData,
            gram_panchayat_id: String(gp?.id ?? s?.gram_panchayat_id ?? ''),
            village_code: String(village?.village_code ?? gp?.village_code ?? s?.village_code ?? ''),
            gram_panchayat_code: String(gp?.gram_panchayat_code ?? s?.gram_panchayat_code ?? ''),
            block_id: String(blockNested?.id ?? s?.block_id ?? ''),
            block_code: String(
              village?.block_code ?? blockNested?.block_code ?? s?.block_code ?? ''
            ),
            district_code: String(
              village?.district_code ?? s?.district?.district_code ?? s?.district_code ?? ''
            ),
          });

          // Set the coorporativeSocietyType for the Edit Form button to show
          if (sectorId) {
            const sector = masterData.sectorOfOperations.find((sector: any) => sector.id === sectorId);
            if (sector) {
              setCoorporativeSocietyType(sector.respective_table || '');
            }
          }

          // Store original sector data for restoration when editing
          if (sectorId && societyAdditionalData) {
            setOriginalSectorData({
              sectorId,
              additionalData: societyAdditionalData
            });
          }

          setExistingDesignation(prev => ({
            ...prev,
            chairmenExist: res?.members.some((member: any) => member.designation === 'Chief Promoter'),
            secretariesExist: res?.members.some((member: any) => member.designation === 'Secretary'),
            treasurersExist: res?.members.some((member: any) => member.designation === 'Treasurer'),
          }));
          // Populate existing documents from API response
          setExistingDocuments({
            bye_laws: res?.society?.bye_laws ? { id: res.society.bye_laws.id, url: res.society.bye_laws.url } : undefined,
            bank_certificate: res?.society?.bank_certificate ? { id: res.society.bank_certificate.id, url: res.society.bank_certificate.url } : undefined,
            economic_scheme: res?.society?.economic_scheme ? { id: res.society.economic_scheme.id, url: res.society.economic_scheme.url } : undefined,
            contributor_list: res?.society?.contributor_list ? { id: res.society.contributor_list.id, url: res.society.contributor_list.url } : undefined,
            custom_documents: res?.society?.custom_documents ? { id: res.society.custom_documents.id, url: res.society.custom_documents.url } : undefined,
            non_family_coop_certificate: res?.society?.non_family_coop_certificate ? { id: res.society.non_family_coop_certificate.id, url: res.society.non_family_coop_certificate.url } : undefined,
            site_inspection_report: res?.society?.site_inspection_report ? { id: res.society.site_inspection_report.id, url: res.society.site_inspection_report.url } : undefined,
            circular_minutes_of_meeting: res?.society?.circular_minutes_of_meeting ? { id: res.society.circular_minutes_of_meeting.id, url: res.society.circular_minutes_of_meeting.url } : undefined,
            land_document: res?.society?.land_document ? { id: res.society.land_document.id, url: res.society.land_document.url } : undefined,
            full_particulars_of_the_promoter: res?.society?.full_particulars_of_the_promoter ? { id: res.society.full_particulars_of_the_promoter.id, url: res.society.full_particulars_of_the_promoter.url } : undefined,
            minutes_of_meeting_of_promoters_meeting: res?.society?.minutes_of_meeting_of_promoters_meeting ? { id: res.society.minutes_of_meeting_of_promoters_meeting.id, url: res.society.minutes_of_meeting_of_promoters_meeting.url } : undefined,
            circular_for_promoters_meeting: res?.society?.circular_for_promoters_meeting ? { id: res.society.circular_for_promoters_meeting.id, url: res.society.circular_for_promoters_meeting.url } : undefined,


          });
        }
      });
    }
  }, [id, masterData.states]);

  // Edit: after districts load, push district **code** into useMasterData so blocks / GP / villages fetch
  useEffect(() => {
    if (!id || !formData.district_id) return;
    if (masterData.districts.length === 0) return;
    const district = masterData.districts.find(
      (d) => d.id.toString() === formData.district_id.toString()
    );
    if (!district) return;
    const codeStr = String(district.district_code ?? '');
    if (selectedDistrict === codeStr) return;
    handleDistrictChange(codeStr);
  }, [id, formData.district_id, masterData.districts, selectedDistrict, handleDistrictChange]);

  // Edit: DB often has block_id null while village master has block_code — resolve FK once blocks are loaded
  useEffect(() => {
    if (!id || formData.block_id) return;
    const code = String(formData.block_code ?? '').trim();
    if (!code || masterData.blocks.length === 0) return;
    const block = masterData.blocks.find(
      (b) => String(b.block_code ?? '').trim() === code
    );
    if (!block) return;
    const nextId = String(block.id);
    setFormData((prev) => (prev.block_id === nextId ? prev : { ...prev, block_id: nextId }));
  }, [id, formData.block_id, formData.block_code, masterData.blocks]);

  // Edit: after blocks load, push block **code** so gram panchayat list loads
  useEffect(() => {
    if (!id || !formData.block_id) return;
    if (masterData.blocks.length === 0) return;
    const block = masterData.blocks.find(
      (b) => b.id.toString() === formData.block_id.toString()
    );
    if (!block) return;
    const codeStr = String(block.block_code ?? '');
    if (selectedBlock === codeStr) return;
    handleBlockChange(codeStr);
  }, [id, formData.block_id, masterData.blocks, selectedBlock, handleBlockChange]);

  // Edit: after GP list loads, fetch villages for the saved gram panchayat
  useEffect(() => {
    if (!id || !formData.gram_panchayat_code) return;
    const gpCode = String(formData.gram_panchayat_code);
    if (selectedGramPanchayat === gpCode) return;
    handleGramPanchayatChange(gpCode);
  }, [id, formData.gram_panchayat_code, selectedGramPanchayat, handleGramPanchayatChange]);

  useEffect(() => {
    if (!isUrbanLocation || !formData.district_code) {
      setUrbanLocalBodies([]);
      setUrbanLocalBodiesWards([]);
      setUrbanLocalBodiesLoading(false);
      return;
    }

    let isCurrentRequest = true;
    const loadUrbanLocalBodies = async () => {
      setUrbanLocalBodiesLoading(true);
      try {
        const bodies = await getUrbanLocalBodies({
          district_code: formData.district_code,
        });
        if (isCurrentRequest) {
          setUrbanLocalBodies(Array.isArray(bodies) ? bodies : []);
        }
      } catch (error) {
        console.error('Error loading urban local bodies:', error);
        if (isCurrentRequest) {
          setUrbanLocalBodies([]);
        }
      } finally {
        if (isCurrentRequest) {
          setUrbanLocalBodiesLoading(false);
        }
      }
    };

    loadUrbanLocalBodies();
    return () => {
      isCurrentRequest = false;
    };
  }, [isUrbanLocation, formData.district_code]);

  useEffect(() => {
    if (!isUrbanLocation || !selectedUrbanLocalBody?.localbody_code) {
      setUrbanLocalBodiesWards([]);
      setUrbanLocalBodiesWardsLoading(false);
      return;
    }

    let isCurrentRequest = true;
    const loadUrbanLocalBodiesWards = async () => {
      setUrbanLocalBodiesWardsLoading(true);
      try {
        const wards = await getUrbanLocalBodiesWard({
          localbody_code: selectedUrbanLocalBody.localbody_code,

        });
        if (isCurrentRequest) {
          setUrbanLocalBodiesWards(Array.isArray(wards) ? wards : []);
        }
      } catch (error) {
        console.error('Error loading locality or wards:', error);
        if (isCurrentRequest) {
          setUrbanLocalBodiesWards([]);
        }
      } finally {
        if (isCurrentRequest) {
          setUrbanLocalBodiesWardsLoading(false);
        }
      }
    };

    loadUrbanLocalBodiesWards();
    return () => {
      isCurrentRequest = false;
    };
  }, [isUrbanLocation, selectedUrbanLocalBody?.localbody_code]);

  const validateField = (field: string, value: any) => {
    const newErrors = { ...errors };

    if (field === 'email') {
      if (!value || value.trim() === '') {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors.email = 'Invalid email address';
      } else {
        delete newErrors.email;
      }
    }

    if (field === 'mobile') {
      if (!value || value.trim() === '') {
        newErrors.mobile = 'Mobile number is required';
      } else if (!/^\d{10}$/.test(value)) {
        newErrors.mobile = 'Mobile number must be exactly 10 digits';
      } else {
        delete newErrors.mobile;
      }
    }

    if (value && value.toString().trim() !== '') {
      delete newErrors[field];
    }

    // For document fields, also check if existing document exists
    if (field === 'bye_laws' && (documentIds?.bye_laws || existingDocuments?.bye_laws)) {
      delete newErrors[field];
    }
    if (field === 'bank_certificate' && (documentIds?.bank_certificate || existingDocuments?.bank_certificate)) {
      delete newErrors[field];
    }
    if (field === 'economic_scheme' && (documentIds?.economic_scheme || existingDocuments?.economic_scheme)) {
      delete newErrors[field];
    }
    if (field === 'contributor_list' && (documentIds?.contributor_list || existingDocuments?.contributor_list)) {
      delete newErrors[field];
    }
    if (field === 'non_family_coop_certificate' && (documentIds?.non_family_coop_certificate || existingDocuments?.non_family_coop_certificate)) {
      delete newErrors[field];
    }
    if (field === 'site_inspection_report' && (documentIds?.site_inspection_report || existingDocuments?.site_inspection_report)) {
      delete newErrors[field];
    }
    if (field === 'circular_minutes_of_meeting' && (documentIds?.circular_minutes_of_meeting || existingDocuments?.circular_minutes_of_meeting)) {
      delete newErrors[field];
    }
    if (field === 'land_document' && (documentIds?.land_document || existingDocuments?.land_document)) {
      delete newErrors[field];
    }
    if (field === 'full_particulars_of_the_promoter' && (documentIds?.full_particulars_of_the_promoter || existingDocuments?.full_particulars_of_the_promoter)) {
      delete newErrors[field];
    }
    if (field === 'circular_for_promoters_meeting' && (documentIds?.circular_for_promoters_meeting || existingDocuments?.circular_for_promoters_meeting)) {
      delete newErrors[field];
    }
    if (field === 'minutes_of_meeting_of_promoters_meeting' && (documentIds?.minutes_of_meeting_of_promoters_meeting || existingDocuments?.minutes_of_meeting_of_promoters_meeting)) {
      delete newErrors[field];
    }

    if (field === 'cooperative_society_name') {
      const name = String(value ?? '').replace(/\s+/g, ' ').trim();
      if (!name) {
        newErrors.cooperative_society_name = 'Society name is required';
      } else if (!/\bcooperative\s+society\s+limited\b/i.test(name)) {
        newErrors.cooperative_society_name = 'Society name must include "Cooperative Society Limited"';
      } else {
        delete newErrors.cooperative_society_name;
      }
    }

    setErrors(newErrors);
  };

  const handleSocietyNameChange = (value: string) => {
    setFormData((prev) => ({ ...prev, cooperative_society_name: value }));
    validateField('cooperative_society_name', value);
    autoTransliterateLocalName(value);
  };

  const handleSocietyNameBlur = (value: string) => {
    const name = value.replace(/\s+/g, ' ').trim();
    if (name && !/\bcooperative\s+society\s+limited\b/i.test(name)) {
      setShowSocietyNamePhrasePopup(true);
    }
  };

  const handleNext = () => {
    let firstError = '';
    const isValid = validateStep(
      currentStep,
      formData,
      (newErrors) => {
        setErrors(newErrors);
        firstError = Object.values(newErrors)[0] || '';
      },
      documentIds,
      existingDocuments,
      masterData
    );

    if (isValid) {
      // Sector cooperative form is optional during registration
      // if (currentStep === 1 && formData.sector_of_operation && !isAdditionalDataValid(formData.additional_data)) {
      //   toast.error('Please complete the cooperative society form by clicking "Edit Form" before proceeding to the next step');
      //   return;
      // }
      setCurrentStep(currentStep + 1);
    } else if (firstError) {
      toast.error(firstError);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };


  const handleSubmit = async (status?: string) => {
    const isDraftSave = Boolean(status);

    try {

      // Registration Id
      const registrationId =
        (id as string | undefined) || formData.id || '';

      // Final Additional Data
      let finalAdditionalData = formData.additional_data;

      if (
        originalSectorData &&
        formData.sector_of_operation === originalSectorData.sectorId
      ) {
        finalAdditionalData = originalSectorData.additionalData;
      }

      // Document IDs
      const documentIdsForSubmission = {
        bye_laws: documentIds.bye_laws?.id,
        bank_certificate: documentIds.bank_certificate?.id,
        economic_scheme: documentIds.economic_scheme?.id,
        contributor_list: documentIds.contributor_list?.id,
        custom_documents: documentIds.custom_documents?.id,
        non_family_coop_certificate:
          documentIds.non_family_coop_certificate?.id,
        site_inspection_report:
          documentIds.site_inspection_report?.id,
        circular_minutes_of_meeting:
          documentIds.circular_minutes_of_meeting?.id,
        land_document: documentIds.land_document?.id,
        full_particulars_of_the_promoter:
          documentIds.full_particulars_of_the_promoter?.id,
        circular_for_promoters_meeting:
          documentIds.circular_for_promoters_meeting?.id,
        minutes_of_meeting_of_promoters_meeting:
          documentIds.minutes_of_meeting_of_promoters_meeting?.id,
      };

      // Remove unwanted fields
      const removeLocationCodes = (data: any) => {
        if (!data || typeof data !== "object") return data;

        const {
          district_code,
          block_code,
          gram_panchayat_code,
          village_id,
          ...rest
        } = data;

        return rest;
      };

      const cleanedFormData = removeLocationCodes(formData);

      // Final Body — draft: include `status` (draft id) so PUT persists fields and stays draft (see updateSocietyRegistration).
      let body: any = {
        ...cleanedFormData,
        ...documentIdsForSubmission,
        additional_data: finalAdditionalData,
        id: registrationId,
      };

      // Draft save passes the draft status UUID; Submit-to-NIC passes empty string.
      // Loaded society's `status` is an enriched object (see backend getSocietyByUserId),
      // which would crash backend findStatusById on update. Always normalize:
      //   - draft save -> set status to the draft UUID
      //   - submit     -> strip status so backend resolves it via workflow.
      if (status) {
        body.status = status;
      } else {
        delete body.status;
      }

      const response = await registerSociety(body);

      if (response?.success) {
        toast.success(
          isDraftSave
            ? 'Draft saved successfully'
            : 'Society registered successfully'
        );

        navigate('/my-society', { replace: true });
      } else {
        toast.error(
          (response as any)?.message ||
          (isDraftSave ? 'Could not save draft' : 'Registration failed')
        );
      }

    } catch (error) {
      console.error("error:", error);
      toast.error((error as any)?.message || 'Something went wrong');
    }
  };


  const addMember = () => {
    if (newMember.name && newMember.gender && newMember.category && newMember.mobile) {
      const member: Member = {
        //id: uuidv4().toString(),
        id: Math.random().toString(36).substring(2, 15),
        name: newMember.name.trim(),
        mobile: newMember.mobile.trim(),
        gender: newMember.gender,
        category: newMember.category,
        designation: newMember?.designation || '',
        is_co_opted: !!newMember.is_co_opted,
      };
      const updatedMembers = [...formData.members, member];
      setFormData({
        ...formData,
        members: updatedMembers,
      });
      setExistingDesignation(prev => ({
        ...prev,
        chairmenExist: updatedMembers.some(member => member.designation === 'Chief Promoter'),
        secretariesExist: updatedMembers.some(member => member.designation === 'Secretary'),
        treasurersExist: updatedMembers.some(member => member.designation === 'Treasurer'),
      }));

      setNewMember({ name: '', mobile: '', gender: '', category: '', designation: '', is_co_opted: false });
      setShowAddMemberModal(false);
    }
  };

  const saveEditedMember = () => {
    if (editingMember && newMember.name && newMember.gender && newMember.category && newMember.mobile) {
      const updatedMembers = formData.members.map(member =>
        member.id === editingMember.id
          ? {
              ...member,
              ...newMember,
              name: newMember.name.trim(),
              mobile: newMember.mobile.trim(),
            }
          : member
      );
      setFormData({
        ...formData,
        members: updatedMembers,
      });
      setNewMember({ name: '', mobile: '', gender: '', category: '', designation: '', is_co_opted: false });
      setEditingMember(null);
      setShowAddMemberModal(false);
    }
  };

  const removeMember = (id: string) => {
    const updatedMembers = formData.members.filter(member => member.id !== id);
    setFormData({
      ...formData,
      members: updatedMembers,
    });
    setExistingDesignation(prev => ({
      ...prev,
      chairmenExist: updatedMembers.some(member => member.designation === 'Chief Promoter'),
      secretariesExist: updatedMembers.some(member => member.designation === 'Secretary'),
      treasurersExist: updatedMembers.some(member => member.designation === 'Treasurer'),
    }));
  };

  const handleDocumentUploadComplete = (field: keyof typeof documentIds, documentId: string, documentUrl?: string) => {
    setDocumentIds(prev => ({
      ...prev,
      [field]: { id: documentId, url: documentUrl || '' },
    }));

    // Clear any previous errors for this field
    const newErrors = { ...errors };
    delete newErrors[field];
    setErrors(newErrors);
  };

  const handleDocumentReplace = (field: keyof typeof documentIds, newDocumentId: string, newDocumentUrl?: string) => {
    setDocumentIds(prev => ({ ...prev, [field]: { id: newDocumentId, url: newDocumentUrl || '' } }));
    setExistingDocuments(prev => ({ ...prev, [field]: undefined }));

    // Clear any previous errors for this field
    const newErrors = { ...errors };
    delete newErrors[field];
    setErrors(newErrors);
  };

  const handleDocumentUploadCancel = (field: keyof typeof documentIds) => {
    setDocumentIds(prev => {
      const newIds = { ...prev };
      delete newIds[field];
      return newIds;
    });
  };

  const changeSectorOfOperation = (e: any) => {
    const newSectorId = e.target.value;
    let sector: any = masterData.sectorOfOperations.find((sector: any) => sector.id === newSectorId);

    // Store previous sector before updating

    if (sector) {
      setCoorporativeSocietyType(sector?.respective_table);
      // TEMP: Do not open cooperative society modal on sector select
      // setShowCoorporativeSocietyType(true);

      // If sector is changing and it's not the existing sector, clear additional data
      if (originalSectorData && originalSectorData.sectorId !== newSectorId) {
        setFormData({
          ...formData,
          sector_of_operation: newSectorId,
          society_type: newSectorId,
          additional_data: null // Reset additional data
        });
      } else if (originalSectorData && originalSectorData.sectorId === newSectorId) {
        // If returning to the original sector, restore the original additional data
        setFormData({
          ...formData,
          sector_of_operation: newSectorId,
          society_type: newSectorId,
          additional_data: originalSectorData.additionalData
        });
      } else {
        // New sector selection
        setFormData({
          ...formData,
          sector_of_operation: newSectorId,
          society_type: newSectorId,
          additional_data: null
        });
      }
    } else {
      setFormData({
        ...formData,
        sector_of_operation: newSectorId,
        society_type: newSectorId
      });
    }

    validateField('sector_of_operation', newSectorId);
  }

  const renderProgressIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep > step.id
            ? 'bg-green-500 text-white'
            : currentStep === step.id
              ? 'bg-green-500 text-white'
              : 'bg-gray-300 text-gray-600'
            }`}>
            {currentStep > step.id ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <span className="text-sm font-semibold">{step.id}</span>
            )}
          </div>
          <span className={`ml-2 text-sm font-medium ${currentStep >= step.id ? 'text-green-600' : 'text-gray-400'
            }`}>
            {step.title}
          </span>
          {index < steps.length - 1 && (
            <div className={`w-16 h-0.5 mx-4 ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'
              }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderBasicDetails = () => (
    <>
      <div className="space-y-6">
        <div className='text-center py-5'>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Register a Cooperative Society</h2>
          <p className="text-gray-600">Start the journey to form your cooperative society.</p>
          <div className="mt-4">

          </div>
        </div>

        {/* Loading and Error States */}
        {masterData.loading && (
          <div className="text-center py-4">
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500 hover:bg-blue-400 transition ease-in-out duration-150 cursor-not-allowed">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading master data...
            </div>
          </div>
        )}

        {masterData.error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading master data</h3>
                <div className="mt-2 text-sm text-red-700">
                  {masterData.error}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              // label="Cooperative Society Name"
              label="Proposed Name"
              placeholder='Enter society name'
              value={formData.cooperative_society_name}
              onChange={(e) => handleSocietyNameChange(e.target.value)}
              onBlur={(e) => handleSocietyNameBlur(e.target.value)}
              required
              error={errors.cooperative_society_name}

            />

            <Input
              label="Local Language Name"
              value={formData.local_langauge_society_name}
              placeholder={
                isTransliteratingLocalName
                  ? 'Typing in Hindi...'
                  : 'Auto-filled in Hindi'
              }
              readOnly
              className="bg-gray-50 cursor-not-allowed"
            />

            <Select
              label="Cooperative Society Type"
              value={formData.cooperative_society_type_id}
              onChange={(e) => {
                setFormData({ ...formData, cooperative_society_type_id: e.target.value });
                validateField('cooperative_society_type_id', e.target.value);
              }}
              error={errors.cooperative_society_type_id}
              disabled={masterData.loading}
              required
            >
              <option value="">-- Select --</option>
              {masterData.loading ? (
                <option value="" disabled>Loading...</option>
              ) : (
                masterData.cooperativeSocietyTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))
              )}
            </Select>

            <Select
              label="Sector Type"
              value={formData.sector_of_operation_type}
              onChange={(e) => {
                setFormData({ ...formData, sector_of_operation_type: e.target.value });
                validateField('sector_of_operation_type', e.target.value);
              }}
              error={errors.sector_of_operation_type}
              disabled={masterData.loading}
              required
            >
              <option value="">-- Select --</option>
              {masterData.loading ? (
                <option value="" disabled>Loading...</option>
              ) : (
                masterData.sectorOfOperationsTypes.map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.name}
                  </option>
                ))
              )}
            </Select>

            <div className="flex items-center gap-2">
              <div className="w-[100%]">
                <Select
                  label="Sector Of Operation"
                  value={formData.sector_of_operation}
                  onChange={changeSectorOfOperation}
                  error={errors.sector_of_operation}
                  disabled={masterData.loading}
                  required
                >
                  <option value="">-- Select --</option>
                  {masterData.loading ? (
                    <option value="" disabled>Loading...</option>
                  ) : (
                    masterData.sectorOfOperations
                      .map((sector) => (
                        <option key={sector.id} value={sector.id}>
                          {sector.name}
                        </option>
                      ))
                  )}
                </Select>
              </div>
              {/* Sector cooperative form is optional — fill later from Business Activity
              {coorporativeSocietyType && <Button onClick={() => setShowCoorporativeSocietyType(true)} size="sm" variant="primary" className="mt-4 w-[20%] py-2">
                Edit Form
              </Button>}
              */}
            </div>

            <Select
              label="Registration Authority"
              value={formData.registration_authoritie_id}
              onChange={(e) => {
                setFormData({ ...formData, registration_authoritie_id: e.target.value });
                validateField('registration_authoritie_id', e.target.value);
              }}
              error={errors.registration_authoritie_id}
              disabled={masterData.loading}
              required
            >
              <option value="">-- Select --</option>
              {masterData.loading ? (
                <option value="" disabled>Loading...</option>
              ) : (
                masterData.registrationAuthorities.map((authority) => (
                  <option key={authority.id} value={authority.id}>
                    {authority.name}
                  </option>
                ))
              )}
            </Select>

            <Select
              label="Area of Operation"
              value={formData.area_of_operation_id}
              onChange={(e) => {
                setFormData({ ...formData, area_of_operation_id: e.target.value });
                validateField('area_of_operation_id', e.target.value);
              }}
              error={errors.area_of_operation_id}
              disabled={masterData.loading}
              required
            >
              <option value="">-- Select --</option>
              {masterData.loading ? (
                <option value="" disabled>Loading...</option>
              ) : (
                masterData.areaOfOperations.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))
              )}
            </Select>

            <Select
              label="Functional Status"
              value={formData.functional_status}
              onChange={(e) => {
                setFormData({ ...formData, functional_status: e.target.value });
                validateField('functional_status', e.target.value);
              }}
              error={errors.functional_status}
              disabled={masterData.loading}
              required
            >
              <option value="">-- Select --</option>
              {masterData.loading ? (
                <option value="" disabled>Loading...</option>
              ) : (
                masterData.functionalStatuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))
              )}
            </Select>

            <Select
              label="Reference Year"
              value={formData.reference_year.toString()}
              onChange={(e) => {
                setFormData({ ...formData, reference_year: parseInt(e.target.value) });
                validateField('reference_year', parseInt(e.target.value));
              }}
              error={errors.reference_year}
              disabled={masterData.loading}
              required
            >
              <option value="">Select a year</option>
              {Array.from({ length: new Date().getFullYear() - 1969 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </Select>
            {errors.reference_year && <span className="text-red-600 text-sm">{errors.reference_year}</span>}
          </div>
        </div>
      </div>

      <div className="space-y-4 mt-5">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Location Details</h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Location Type</label>
            <div className="flex space-x-4">
              {masterData.loading ? (
                <div className="text-gray-500">Loading location types...</div>
              ) : (
                masterData.locationTypes.map((locationType) => (
                  <label key={locationType.id} className="flex items-center">
                    <input
                      type="radio"
                      name="locationType"
                      value={locationType.id}
                      checked={formData.location_of_head_quarter === locationType?.id?.toString()}
                      onChange={(e) => {
                        console.log(locationType);
                        setFormData({
                          ...formData,
                          location_of_head_quarter: e.target.value,
                          urban_local_body_type: '',
                          urban_local_body_code: '',
                          locality_ward_code: '',
                        });
                        validateField('location_of_head_quarter', e.target.value);
                      }}
                      className="mr-2"
                    />
                    {locationType.name}
                  </label>
                ))
              )}
            </div>
            {errors.location_of_head_quarter && <span className="text-red-600 text-sm">{errors.location_of_head_quarter}</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Select
                label="State / UT"
                value={formData.state_id}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    state_id: e.target.value,
                    district_id: '',
                    district_code: '',
                    block_id: '',
                    block_code: '',
                    gram_panchayat_id: '',
                    gram_panchayat_code: '',
                    village_code: '',
                    urban_local_body_type: '',
                    urban_local_body_code: '',
                    locality_ward_code: '',
                    ...(formData.bank_type === 'cooperative'
                      ? { cooperative_society_bank_id: '' }
                      : {}),
                  });
                  // Find the selected state to get its state_code
                  const selectedState = masterData.states.find(state => state.id.toString() === e.target.value);
                  handleStateChange(selectedState?.state_code || '');
                  handleDistrictChange('');
                  handleBlockChange('');
                  validateField('state_id', e.target.value);
                }}
                error={errors.state_id}
                disabled={masterData.loading}
                required
              >
                <option value="">-- Select --</option>
                {masterData.loading ? (
                  <option value="" disabled>Loading...</option>
                ) : (
                  masterData.states.map((state) => (
                    <option key={state.id} value={state.id}>
                      {state.name}
                    </option>
                  ))
                )}
              </Select>

              <Select
                label="District"
                value={formData.district_id}
                onChange={(e) => {
                  const id = e.target.value;

                  const selectedDistrict = masterData.districts.find(
                    (d) => d.id.toString() === id
                  );

                  setFormData({
                    ...formData,
                    district_id: id,
                    district_code:
                      selectedDistrict?.district_code != null
                        ? String(selectedDistrict.district_code)
                        : '',
                    block_id: '',
                    block_code: '',
                    gram_panchayat_id: '',
                    gram_panchayat_code: '',
                    village_code: '',
                    urban_local_body_type: '',
                    urban_local_body_code: '',
                    locality_ward_code: '',
                  });

                  handleDistrictChange(
                    selectedDistrict?.district_code != null
                      ? String(selectedDistrict.district_code)
                      : ''
                  );
                }}
                error={errors.district_id}
                disabled={masterData.loading || !selectedState}
                required
              >
                <option value="">-- Select --</option>

                {!selectedState ? (
                  <option disabled>Please select a state first</option>
                ) : masterData.loading ? (
                  <option disabled>Loading districts...</option>
                ) : (
                  masterData.districts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))
                )}
              </Select>

              <Input
                label="Pincode"
                value={formData.pincode}
                placeholder='Enter 6-digit pincode'
                maxLength={6}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 6) {
                    setFormData({ ...formData, pincode: value });
                    validateField('pincode', value);
                  }
                }}
                error={errors.pincode}
                required
              />
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Urban-specific fields */}
              {isUrbanLocation && (
                <>
                  <Select
                    label="Urban Local Body"
                    value={formData.urban_local_body_type}
                    onChange={(e) => {
                      const selectedBody = urbanLocalBodies.find(
                        (body) => body.id?.toString() === e.target.value
                      );
                      setFormData({
                        ...formData,
                        urban_local_body_type: e.target.value,
                        urban_local_body_code: selectedBody?.localbody_code
                          ? String(selectedBody.localbody_code)
                          : '',
                        locality_ward_code: '',
                      });

                    }}

                    disabled={masterData.loading || urbanLocalBodiesLoading || !formData.district_id}
                  >
                    <option value="">-- Select --</option>
                    {!formData.district_id ? (
                      <option value="" disabled>Select district first</option>
                    ) : urbanLocalBodiesLoading ? (
                      <option value="" disabled>Loading urban local bodies...</option>
                    ) : urbanLocalBodies.length === 0 ? (
                      <option value="" disabled>No urban local bodies found</option>
                    ) : (
                      urbanLocalBodies.map((bodies) => (
                        <option key={bodies.id} value={bodies.id}>
                          {bodies.local_body_name}
                        </option>
                      ))
                    )}
                  </Select>

                  <Select
                    label="Locality or Ward"
                    value={formData.locality_ward_code}
                    onChange={(e) => {
                      setFormData({ ...formData, locality_ward_code: e.target.value });

                    }}

                    disabled={masterData.loading || urbanLocalBodiesWardsLoading || !formData.urban_local_body_type}

                  >
                    <option value="">-- Select --</option>
                    {!formData.urban_local_body_type ? (
                      <option value="" disabled>Select urban local body first</option>
                    ) : urbanLocalBodiesWardsLoading ? (
                      <option value="" disabled>Loading locality or wards...</option>
                    ) : urbanLocalBodiesWards.length === 0 ? (
                      <option value="" disabled>No locality or wards found</option>
                    ) : (
                      urbanLocalBodiesWards.map((bodies) => (
                        <option key={bodies.id} value={bodies.id}>
                          {bodies.ward_name}
                        </option>
                      ))
                    )}
                  </Select>
                </>
              )}

              {/* Rural-specific fields */}
              {selectedLocationType?.name === 'Rural' && (
                <>
                  <Select
                    label="Block"
                    value={formData.block_id}
                    onChange={(e) => {
                      const id = e.target.value;

                      const selectedBlock = masterData.blocks.find(
                        (b) => b.id.toString() === id
                      );

                      setFormData({
                        ...formData,
                        block_id: id,
                        gram_panchayat_id: '',
                        gram_panchayat_code: '',
                        village_code: '',
                      });

                      handleBlockChange(selectedBlock?.block_code || '');
                    }}

                    disabled={masterData.loading || !formData.district_id}

                  >
                    <option value="">-- Select --</option>

                    {!formData.district_id ? (
                      <option value="" disabled>
                        Select district first
                      </option>
                    ) : masterData.loading ? (
                      <option value="" disabled>
                        Loading blocks...
                      </option>
                    ) : masterData.blocks.length === 0 ? (
                      <option value="" disabled>
                        No blocks found
                      </option>
                    ) : (
                      masterData.blocks.map((block) => (
                        <option key={block.id} value={block.id}>
                          {block.block_name}
                        </option>
                      ))
                    )}
                  </Select>

                  <Select
                    label="Gram Panchayat"
                    value={formData.gram_panchayat_id}
                    onChange={(e) => {
                      const id = e.target.value;
                      const gp = masterData.gramPanchayats.find(
                        (item) => getGramPanchayatKey(item) === id,
                      );
                      setFormData({
                        ...formData,
                        gram_panchayat_id: id,
                        gram_panchayat_code: gp?.gram_panchayat_code
                          ? String(gp.gram_panchayat_code)
                          : "",
                        village_code: "",
                      });
                      handleGramPanchayatChange(
                        gp?.gram_panchayat_code
                          ? String(gp.gram_panchayat_code)
                          : "",
                      );
                    }}

                    disabled={masterData.loading || !formData.block_id}

                  >
                    <option value="">-- Select --</option>

                    {!formData.block_id ? (
                      <option disabled>Select block first</option>
                    ) : masterData.loading ? (
                      <option disabled>Loading gram panchayats...</option>
                    ) : masterData.gramPanchayats.length === 0 ? (
                      <option disabled>No gram panchayat found</option>
                    ) : (
                      masterData.gramPanchayats.map((gp) => (
                        <option key={getGramPanchayatKey(gp)} value={getGramPanchayatKey(gp)}>
                          {gp.gram_panchayat_name} ({gp.gram_panchayat_code})
                        </option>
                      ))
                    )}
                  </Select>

                  <Select
                    label="Village"
                    value={formData.village_code}
                    onChange={(e) => {
                      const villageCode = e.target.value;

                      setFormData({
                        ...formData,
                        village_code: villageCode,
                      });
                    }}

                    disabled={!formData.gram_panchayat_id}

                  >
                    <option value="">-- Select --</option>

                    {!formData.gram_panchayat_id ? (
                      <option disabled>Select gram panchayat first</option>
                    ) : masterData.loading ? (
                      <option disabled>Loading villages...</option>
                    ) : filteredVillages.length === 0 ? (
                      <option disabled>No villages found</option>
                    ) : (
                      filteredVillages.map((village) => (
                        <option
                          key={`${village.gram_panchayat_code}-${village.village_code}-${village.id}`}
                          value={String(village.village_code ?? '')}
                        >
                          {village.village_name} ({village.village_code})
                        </option>
                      ))
                    )}
                  </Select>
                </>
              )}
            </div>
          </div>

          {/* Full Address */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Full Address <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={formData.full_address}
              onChange={(e) => {
                setFormData({ ...formData, full_address: e.target.value, address_line: e.target.value });
                validateField('full_address', e.target.value);
              }}
              placeholder="Enter complete address"
              rows={3}
              required
              maxLength={250}
              error={errors.full_address}
            />
            {/* {errors.full_address && <span className="text-red-600 text-sm">{errors.full_address}</span>} */}
          </div>
        </div>
      </div>

      {/* ================= CONTACT DETAILS ================= */}
      <div className="space-y-4 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
          Contact Details
        </h3>

        {/* Row 1: Name, Designation, Email */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Name "
            name="contact_person"
            autoComplete="section-contact name"
            placeholder="Enter name"
            required
            value={formData.contact_person}
            onChange={(e) => {
              setFormData({ ...formData, contact_person: e.target.value });
              validateField("contact_person", e.target.value);
            }}
            error={errors.contact_person}
          />

          <Input
            label="Designation"
            placeholder="Enter designation"
            required
            value={formData.designation}
            onChange={(e) => {
              setFormData({ ...formData, designation: e.target.value });
              validateField("designation", e.target.value);
            }}
            error={errors.designation}
          />

          <Input
            label="Email"
            placeholder="Enter email address"
            required
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              validateField("email", e.target.value);
            }}
            error={errors.email}
          />
        </div>

        {/* Row 2: Mobile, Landline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Mobile"
            name="contact_mobile"
            autoComplete="section-contact tel"
            placeholder="Enter 10-digit mobile number"
            required
            maxLength={10}
            value={formData.mobile}
            onChange={(e) => {
              setFormData({
                ...formData,
                mobile: e.target.value.replace(/\D/g, ""),
              })
              validateField("mobile", e.target.value.replace(/\D/g, ""))
            }}
            error={errors.mobile}
          />

          <Input
            label="Landline"
            maxLength={12}
            placeholder="Enter landline number"
            value={formData.landline}
            onChange={(e) =>
              setFormData({ ...formData, landline: e.target.value })
            }
          />
        </div>
      </div>

    </>
  );

  const renderSectorDetails = () => (
    <div className="space-y-6">
      <div className='text-center py-5'>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sector Details & Member Count</h2>
        <p className="text-gray-600">Provide details about your society's operational area and affiliations.</p>
      </div>

      {/* Sector Details Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Sector Details</h3>

        <div className="space-y-4">
          {/* Operation Area Location */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Operation Area Location</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="operationAreaLocation"
                  value="urban"
                  checked={formData.operation_area_location == 'urban'}
                  onChange={(e) => {
                    setFormData({ ...formData, operation_area_location: e.target.value });
                    validateField('operation_area_location', e.target.value);
                  }}
                  className="mr-2"
                />
                Urban
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="operationAreaLocation"
                  value="rural"
                  checked={formData.operation_area_location == 'rural'}
                  onChange={(e) => {
                    setFormData({ ...formData, operation_area_location: e.target.value });
                    validateField('operation_area_location', e.target.value);
                  }}
                  className="mr-2"
                />
                Rural
              </label>
              {/* <label className="flex items-center">
                <input
                  type="radio"
                  name="operationAreaLocation"
                  value="both"
                  checked={formData.operation_area_location === 'both'}
                  onChange={(e) => {
                    setFormData({ ...formData, operation_area_location: e.target.value });
                    validateField('operation_area_location', e.target.value);
                  }}
                  className="mr-2"
                />
                Both
              </label> */}
            </div>
            {errors.operation_area_location && <span className="text-red-600 text-sm">{errors.operation_area_location}</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Right Column */}
            <div className="space-y-4">
              {/* Water Body Section */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Is Area Adjacent to Water Body?</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="isAdjacentToWaterBody"
                      value="yes"
                      checked={formData.is_adjacent_to_water_body === 'yes'}
                      onChange={(e) => {
                        setFormData({ ...formData, is_adjacent_to_water_body: e.target.value });
                        validateField('is_adjacent_to_water_body', e.target.value);
                      }}
                      className="mr-2"
                    />
                    Yes
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="isAdjacentToWaterBody"
                      value="no"
                      checked={formData.is_adjacent_to_water_body === 'no'}
                      onChange={(e) => {
                        setFormData({ ...formData, is_adjacent_to_water_body: e.target.value });
                        validateField('is_adjacent_to_water_body', e.target.value);
                      }}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
                {errors.is_adjacent_to_water_body && <span className="text-red-600 text-sm">{errors.is_adjacent_to_water_body}</span>}
              </div>

              {formData.is_adjacent_to_water_body === 'yes' && (
                <Select
                  label="Type of Water Body"
                  value={formData.water_body_type_id}
                  onChange={(e) => {
                    setFormData({ ...formData, water_body_type_id: e.target.value });
                    validateField('water_body_type_id', e.target.value);
                  }}
                  error={errors.water_body_type_id}
                  disabled={masterData.loading}
                  required
                >
                  <option value="">-- Select --</option>
                  {masterData.loading ? (
                    <option value="" disabled>Loading...</option>
                  ) : (
                    masterData.waterBodyTypes.map((waterBody) => (
                      <option key={waterBody.id} value={waterBody.id}>
                        {waterBody.name}
                      </option>
                    ))
                  )}
                </Select>
              )}
            </div>
          </div>

          {/* ================= Affiliation Section ================= */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Whether the Society is affiliated to Union / Federation?
            </label>

            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="is_affiliated_union_federation"
                  value="yes"
                  checked={formData.is_affiliated_union_federation === "yes"}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      is_affiliated_union_federation: e.target.value,
                    });
                    validateField("is_affiliated_union_federation", e.target.value);
                  }}
                  className="mr-2"
                />
                Yes
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  name="is_affiliated_union_federation"
                  value="no"
                  checked={formData.is_affiliated_union_federation === "no"}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      is_affiliated_union_federation: e.target.value,
                      affiliated_union_level: "",
                      affiliated_union_name: "",
                    });
                    validateField("is_affiliated_union_federation", e.target.value);
                  }}
                  className="mr-2"
                />
                No
              </label>
            </div>

            {errors.is_affiliated_union_federation && (
              <span className="text-red-600 text-sm">
                {errors.is_affiliated_union_federation}
              </span>
            )}
          </div>

          {/* ===== Show only if YES ===== */}
          {formData.is_affiliated_union_federation === "yes" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Select
                label="Level of Affiliated Union / Federation"
                required
                value={formData.affiliated_union_level}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    affiliated_union_level: e.target.value,
                  });
                  validateField("affiliated_union_level", e.target.value);
                }}
                error={errors.affiliated_union_level}
              >
                <option value="">-- Select --</option>
                <option value="district">District</option>
                <option value="state">State</option>
                <option value="national">National</option>
              </Select>

              <Input
                label="Name of Affiliated Union / Federation"
                required
                placeholder="Enter name"
                value={formData.affiliated_union_name}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    affiliated_union_name: e.target.value,
                  });
                  validateField("affiliated_union_name", e.target.value);
                }}
                error={errors.affiliated_union_name}
              />
            </div>
          )}
        </div>
      </div>

      {/* Member Management Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Promoter Management</h3>

        <div className="space-y-4">
          <div className="rounded-lg border border-blue-100 bg-blue-50/80 p-4 text-sm text-gray-800">
            <p className="font-semibold text-gray-900">Promoter composition (APST)</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
              <li>At least 80% of promoters must belong to APST.</li>
              <li>Up to 20% may be General or SC only (not OBC or ST).</li>
              <li>
                Example: {MIN_SOCIETY_REGISTRATION_PROMOTERS} promoters → at least{' '}
                {minApstPromotersRequired(MIN_SOCIETY_REGISTRATION_PROMOTERS)} APST (80% rule).
              </li>
            </ul>
            {formData.members.length > 0 && (
              <div className="mt-3 grid gap-1 text-xs sm:text-sm text-gray-600 border-t border-blue-100 pt-3">
                <span>
                  APST: {formData.members.filter((m) => m.category === 'APST').length} / minimum required
                  {formData.members.length >= MIN_SOCIETY_REGISTRATION_PROMOTERS
                    ? ` ${minApstPromotersRequired(formData.members.length)}`
                    : ` (after ${MIN_SOCIETY_REGISTRATION_PROMOTERS} promoters)`}
                </span>
                <span>
                  General / SC: {formData.members.filter((m) => m.category === 'General' || m.category === 'SC').length}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">
                Add Promoter to your society (Min: {MIN_SOCIETY_REGISTRATION_PROMOTERS})
              </p>
              <p className="text-sm text-gray-500">Current Promoters: {formData.members.length}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setEditingMember(null);
                setNewMember({
                  name: '',
                  mobile: '',
                  gender: '',
                  category: '',
                  designation: '',
                  is_co_opted: false,
                });
                setMemberErrors({});
                setShowAddMemberModal(true);
              }}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              Add Promoter
            </Button>
          </div>

          {formData.members.length > 0 ? (
            <div className="bg-gray-50 rounded-lg p-4">
              {/* Header Row */}
              <div className="grid grid-cols-7 gap-2 mb-4 font-semibold text-gray-700 border-b border-gray-200 pb-3 text-center">
                <div className="text-gray-900">S.no</div>
                <div className="text-gray-900">Name</div>
                <div className="text-gray-900">Gender</div>
                <div className="text-gray-900">Category</div>
                <div className="text-gray-900">Designation</div>
                <div className="text-gray-900">Mobile</div>
                <div className="text-gray-900"></div>
              </div>

              {/* Member Rows */}
              <div className="space-y-2">
                {formData.members.map((member, index) => (
                  <div key={member.id} className="grid grid-cols-7 gap-2 items-center pb-2 border-b border-gray-200 text-center">
                    <div className="text-gray-900">{index + 1}</div>
                    <div className="text-gray-900">{member.name}</div>
                    <div className="text-gray-900 capitalize">{member.gender}</div>
                    <div className="text-gray-900">{member.category}</div>
                    <div className="text-gray-900">{member.designation}</div>
                    <div className="text-gray-900">{member?.mobile}</div>
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => member.id && removeMember(member.id)}
                        className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-gray-600 my-5 text-center py-5 bg-gray-50 rounded-lg">
              No Promoter added yet. Please add at least {MIN_SOCIETY_REGISTRATION_PROMOTERS} promoters.
            </div>
          )}


          {errors.members && (
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{errors.members}</span>
            </div>
          )}
          {errors.promoter_categories && (
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{errors.promoter_categories}</span>
            </div>
          )}
          {errors.promoter_apst_composition && (
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{errors.promoter_apst_composition}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderFinancialDetails = () => (
    <div className="space-y-6">
      <div className='text-center py-5'>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Financial & Administrative Details</h2>
        <p className="text-gray-600">Provide financial and administrative information about your society.</p>
      </div>

      {/* Financial Audit Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Financial Audit</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Financial Audit Done?</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="financialAuditDone"
                    value="yes"
                    checked={formData.financial_audit === 'yes'}
                    onChange={(e) => {
                      setFormData({ ...formData, financial_audit: e.target.value });
                      validateField('financial_audit', e.target.value);
                    }}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="financialAuditDone"
                    value="no"
                    checked={formData.financial_audit === 'no'}
                    onChange={(e) => {
                      setFormData({ ...formData, financial_audit: e.target.value });
                      validateField('financial_audit', e.target.value);
                    }}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
              {errors.financialAuditDone && <span className="text-red-600 text-sm">{errors.financialAuditDone}</span>}
            </div>

            {formData.financial_audit === 'yes' && (
              <>
                <Input
                  label="Year of Latest Audit Completed"
                  type="number"
                  value={formData.audit_complete_year}
                  placeholder='Enter year'
                  onChange={(e) => {
                    // Store as string to avoid precision issues
                    const value = e.target.value;
                    if (value === '' || /^\d{1,4}$/.test(value)) {
                      setFormData({ ...formData, audit_complete_year: value });
                      validateField('audit_complete_year', value);
                    }
                  }}
                  error={errors.audit_complete_year}
                  required
                  maxLength={4}
                />

                <Select
                  label="Category of Audit"
                  value={formData.category_audit}
                  onChange={(e) => {
                    setFormData({ ...formData, category_audit: e.target.value });
                    validateField('category_audit', e.target.value);
                  }}
                  error={errors.category_audit}
                  required
                >
                  <option value="">-- Select --</option>
                  <option value="statutory">Statutory Audit</option>
                  <option value="internal">Internal Audit</option>
                  <option value="external">External Audit</option>
                  <option value="government">Government Audit</option>
                  <option value="other">Other</option>
                </Select>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Profit & Loss Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Profit & Loss</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Is Profit Making?</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="isProfitMaking"
                    value="yes"
                    checked={formData.is_profit_making === 'yes'}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        is_profit_making: e.target.value,
                        annual_turnover: '0', // Reset annual turnover
                        annual_loss: '0' // Reset annual loss
                      });
                      validateField('is_profit_making', e.target.value);
                    }}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="isProfitMaking"
                    value="no"
                    checked={formData.is_profit_making === 'no'}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        is_profit_making: e.target.value,
                        annual_turnover: '0', // Reset annual turnover
                        annual_loss: '0' // Reset annual loss
                      });
                      validateField('is_profit_making', e.target.value);
                    }}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
              {errors.is_profit_making && <span className="text-red-600 text-sm">{errors.is_profit_making}</span>}
            </div>

            {formData.is_profit_making === 'yes' && (
              <>
                <Input
                  label="Annual Turnover"
                  type="number"
                  value={formData.annual_turnover || ''}
                  placeholder='Enter annual turnover'
                  onChange={(e) => {
                    // Store as string to avoid precision issues
                    const value = e.target.value;
                    if (value === '' || /^\d{1,8}$/.test(value)) {
                      setFormData({ ...formData, annual_turnover: value });
                      validateField('annual_turnover', value);
                    }
                  }}
                  error={errors.annual_turnover}
                  required
                  maxLength={8}
                />
                <Input
                  label="Annual Profit"
                  type="number"
                  value={formData.annual_profit || ''}
                  placeholder='Enter annual turnover'
                  onChange={(e) => {
                    // Store as string to avoid precision issues
                    const value = e.target.value;
                    if (value === '' || /^\d{1,8}$/.test(value)) {
                      setFormData({ ...formData, annual_profit: value });
                      validateField('annual_profit', value);
                    }
                  }}
                  error={errors.annual_profit}
                  required
                  maxLength={8}
                />
              </>
            )}

            {formData.is_profit_making === 'no' && (
              <Input
                label="Annual Loss"
                type="number"
                value={formData.annual_loss || ''}
                placeholder='Enter annual loss'
                onChange={(e) => {
                  // Store as string to avoid precision issues
                  const value = e.target.value;
                  if (value === '' || /^\d{1,8}$/.test(value)) {
                    setFormData({ ...formData, annual_loss: value });
                    validateField('annual_loss', value);
                  }
                }}
                error={errors.annual_loss}
                required
                maxLength={8}
              />
            )}
          </div>
        </div>
      </div>

      {/* MSME */}
      <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
        MSME Registration
      </h3>
      <div className="space-y-2 mt-4">
        <label className="block text-sm font-medium text-gray-700">
          Is this society registered as a Micro, Small or Medium Enterprise (MSME)? <span className="text-red-500">*</span>
        </label>

        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="is_msme"
              value="1"
              checked={formData.is_msme === 1}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  is_msme: 1,
                });
                validateField('is_msme', 1);
              }}
              className="mr-2"
            />
            Yes
          </label>

          <label className="flex items-center">
            <input
              type="radio"
              name="is_msme"
              value="0"
              checked={formData.is_msme === 0}
              onChange={() => {
                setFormData({
                  ...formData,
                  is_msme: 0,
                  udyam_no: '',
                });
                validateField('is_msme', 0);
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.udyam_no;
                  return next;
                });
              }}
              className="mr-2"
            />
            No
          </label>
        </div>

        {errors.is_msme && (
          <span className="text-red-600 text-sm">{errors.is_msme}</span>
        )}
      </div>

      {formData.is_msme === 1 && (
        <div className="mt-4">
          <Input
            label="Udyam Number"
            maxLength={50}
            value={formData.udyam_no || ""}
            onChange={(e) => {
              const value = e.target.value.replace(/\s/g, "").toUpperCase();
              setFormData({ ...formData, udyam_no: value });
              validateField("udyam_no", value);
            }}
            error={errors.udyam_no}
            required
          />
        </div>
      )}
      {/* Dividend Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Dividend</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Dividend Paid?</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="dividendPaid"
                    value="yes"
                    checked={formData.is_dividend_paid === 'yes'}
                    onChange={(e) => {
                      setFormData({ ...formData, is_dividend_paid: e.target.value });
                      validateField('is_dividend_paid', e.target.value);
                    }}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="dividendPaid"
                    value="no"
                    checked={formData.is_dividend_paid === 'no'}
                    onChange={(e) => {
                      setFormData({ ...formData, is_dividend_paid: e.target.value });
                      validateField('is_dividend_paid', e.target.value);
                    }}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
              {errors.is_dividend_paid && <span className="text-red-600 text-sm">{errors.is_dividend_paid}</span>}
            </div>

            {formData.is_dividend_paid === 'yes' && (
              <Input
                label="Dividend Rate (%) *"
                type="number"
                value={formData.dividend_rate}
                placeholder='Enter dividend rate'
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d+(\.\d{1,2})?$/.test(value)) {
                    setFormData({ ...formData, dividend_rate: parseFloat(value) });
                    validateField('dividend_rate', value);
                  }
                }}
                error={errors.dividend_rate}
                required
              />
            )}
          </div>
        </div>
      </div>

      {/* Bank Details Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Bank Details</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Bank Type</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="bankType"
                  value="cooperative"
                  checked={formData.bank_type === 'cooperative'}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      bank_type: e.target.value,
                      cooperative_society_bank_id: '',
                      other_bank: ''
                    });
                    validateField('bank_type', e.target.value);
                  }}
                  className="mr-2"
                />
                Cooperative
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="bankType"
                  value="commercial"
                  checked={formData.bank_type === 'commercial'}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      bank_type: e.target.value,
                      cooperative_society_bank_id: '',
                      other_bank: ''
                    });
                    validateField('bank_type', e.target.value);
                  }}
                  className="mr-2"
                />
                Commercial
              </label>
            </div>
            {errors.bank_type && <span className="text-red-600 text-sm">{errors.bank_type}</span>}
          </div>

          {formData.bank_type && (
            <Select
              label="Bank"
              value={formData.bank_type === 'cooperative' ? formData.cooperative_society_bank_id : formData.other_bank}
              onChange={(e) => {
                if (formData.bank_type === 'cooperative') {
                  setFormData({
                    ...formData,
                    cooperative_society_bank_id: e.target.value
                  });
                  validateField('cooperative_society_bank_id', e.target.value);
                } else {
                  setFormData({
                    ...formData,
                    other_bank: e.target.value
                  });
                  validateField('other_bank', e.target.value);
                }
              }}
              error={formData.bank_type === 'cooperative' ? errors.cooperative_society_bank_id : errors.other_bank}
              disabled={
                masterData.loading ||
                banksLoading ||
                (formData.bank_type === 'cooperative' && !formData.state_id)
              }
              required
            >
              <option value="">-- Select Bank --</option>
              {formData.bank_type === 'cooperative' && !formData.state_id ? (
                <option value="" disabled>Please select a state first</option>
              ) : banksLoading ? (
                <option value="" disabled>Loading banks...</option>
              ) : filteredBanks.length === 0 ? (
                <option value="" disabled>
                  {formData.bank_type === 'cooperative'
                    ? 'No banks found for selected state'
                    : 'No commercial banks found'}
                </option>
              ) : (
                filteredBanks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name}
                  </option>
                ))
              )}
            </Select>
          )}

          {formData.bank_type === 'commercial' && formData.other_bank && filteredBanks.find(bank => bank.id === formData.other_bank)?.name === 'Other' && (
            <Input
              label="Other Bank Name"
              value={formData.other_bank}
              placeholder='Enter other bank name'
              onChange={(e) => {
                setFormData({ ...formData, other_bank: e.target.value });
                validateField('other_bank', e.target.value);
              }}
              error={errors.other_bank}
              required
            />
          )}
        </div>
      </div>

      {/* Tax Details Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Tax Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* <div className="space-y-4">
            <Input
              label="GST Number"
              value={formData.gst_no}
              placeholder='Enter GST number'
              onChange={(e) => {
                if (e.target.value.length <= 20) {
                  setFormData({ ...formData, gst_no: e.target.value?.replace(/ /g, '') });
                  validateField('gst_no', e.target.value);
                }
              }}
              error={errors.gst_no}
              required
              maxLength={20}
            />

            <Input
              label="PAN Number"
              value={formData.pan_no}
              placeholder='Enter PAN number'
              onChange={(e) => {
                setFormData({ ...formData, pan_no: e.target.value ? e.target.value.toUpperCase().replace(/ /g, '') : '' });
                validateField('pan_no', e.target.value);
              }}
              error={errors.pan_no}
              required
              maxLength={10}
            />
          </div> */}

          <div className="space-y-4">
            <Input
              label="Number of Branches"
              type="text"
              value={formData.how_many_branches}
              placeholder='Enter number of branches'
              onChange={(e) => {
                if (e.target.value.length <= 3) {
                  setFormData({ ...formData, how_many_branches: e.target.value });
                  validateField('how_many_branches', e.target.value);
                }
              }}
              maxLength={3}
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Secretary Available Full Time?</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="secretary_available_full_time"
                    value="yes"
                    checked={formData.full_time_secretary === 'yes'}
                    onChange={(e) => {
                      setFormData({ ...formData, full_time_secretary: e.target.value });
                      validateField('full_time_secretary', e.target.value);
                    }}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="full_time_secretary"
                    value="no"
                    checked={formData.full_time_secretary === 'no'}
                    onChange={(e) => {
                      setFormData({ ...formData, full_time_secretary: e.target.value });
                      validateField('full_time_secretary', e.target.value);
                    }}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
              {errors.full_time_secretary && <span className="text-red-600 text-sm">{errors.full_time_secretary}</span>}
            </div>

            <Input
              label="Secretary Mobile Number"
              value={formData.mobile_number_of_secretary}
              placeholder='Enter 10-digit mobile number'
              maxLength={10}
              onChange={(e) => {
                // Only allow digits
                const value = e.target.value.replace(/\D/g, '');
                // Limit to 10 characters
                if (value.length <= 10) {
                  setFormData({ ...formData, mobile_number_of_secretary: value });
                  validateField('mobile_number_of_secretary', value);
                }
              }}
              error={errors.mobile_number_of_secretary}
              required={formData.full_time_secretary === 'yes' ? true : false}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderDeclaration = () => (
    <div className="space-y-6">
      <div className='text-center py-5'>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Documents</h2>
        <p className="text-gray-600">Upload required documents for your society registration.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <DocumentUpload
            label="Bye-law"
            documentType="bye_laws"
            onUploadComplete={(documentId, documentUrl) => handleDocumentUploadComplete('bye_laws', documentId, documentUrl)}
            onUploadCancel={() => handleDocumentUploadCancel('bye_laws')}
            error={errors.bye_laws}
            required={true}
            existingDocument={documentIds.bye_laws ?? existingDocuments.bye_laws}
            onReplace={(newDocumentId, newDocumentUrl) => handleDocumentReplace('bye_laws', newDocumentId, newDocumentUrl)}
          />

          <DocumentUpload
            label="Bank Certificate"
            onUploadComplete={(documentId, documentUrl) => handleDocumentUploadComplete('bank_certificate', documentId, documentUrl)}
            onUploadCancel={() => handleDocumentUploadCancel('bank_certificate')}
            error={errors.bank_certificate}
            required={true}
            existingDocument={documentIds.bank_certificate ?? existingDocuments.bank_certificate}
            onReplace={(newDocumentId, newDocumentUrl) => handleDocumentReplace('bank_certificate', newDocumentId, newDocumentUrl)}
          />

          <DocumentUpload
            label="Economic Scheme"
            onUploadComplete={(documentId, documentUrl) => handleDocumentUploadComplete('economic_scheme', documentId, documentUrl)}
            onUploadCancel={() => handleDocumentUploadCancel('economic_scheme')}
            error={errors.economic_scheme}
            required={true}
            existingDocument={documentIds.economic_scheme ?? existingDocuments.economic_scheme}
            onReplace={(newDocumentId, newDocumentUrl) => handleDocumentReplace('economic_scheme', newDocumentId, newDocumentUrl)}
          />
          <DocumentUpload
            label="Minutes of Meeting of Promoters' Meeting"
            onUploadComplete={(documentId, documentUrl) => handleDocumentUploadComplete('minutes_of_meeting_of_promoters_meeting', documentId, documentUrl)}
            onUploadCancel={() => handleDocumentUploadCancel('minutes_of_meeting_of_promoters_meeting')}
            error={errors.minutes_of_meeting_of_promoters_meeting}
            required={true}
            existingDocument={
              documentIds.minutes_of_meeting_of_promoters_meeting ??
              existingDocuments.minutes_of_meeting_of_promoters_meeting
            }
            onReplace={(newDocumentId, newDocumentUrl) => handleDocumentReplace('minutes_of_meeting_of_promoters_meeting', newDocumentId, newDocumentUrl)}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <DocumentUpload
            label="Promoter List"
            onUploadComplete={(documentId, documentUrl) => handleDocumentUploadComplete('contributor_list', documentId, documentUrl)}
            onUploadCancel={() => handleDocumentUploadCancel('contributor_list')}
            error={errors.contributor_list}
            required={true}
            existingDocument={documentIds.contributor_list ?? existingDocuments.contributor_list}
            onReplace={(newDocumentId, newDocumentUrl) => handleDocumentReplace('contributor_list', newDocumentId, newDocumentUrl)}
          />

          <DocumentUpload
            label="Custom Documents"
            onUploadComplete={(documentId, documentUrl) => handleDocumentUploadComplete('custom_documents', documentId, documentUrl)}
            onUploadCancel={() => handleDocumentUploadCancel('custom_documents')}
            error={errors.custom_documents}
            required={false}
            existingDocument={documentIds.custom_documents ?? existingDocuments.custom_documents}
            onReplace={(newDocumentId, newDocumentUrl) => handleDocumentReplace('custom_documents', newDocumentId, newDocumentUrl)}
          />

          <DocumentUpload
            label="Full Particulars of the Promoter"
            onUploadComplete={(documentId, documentUrl) => handleDocumentUploadComplete('full_particulars_of_the_promoter', documentId, documentUrl)}
            onUploadCancel={() => handleDocumentUploadCancel('full_particulars_of_the_promoter')}
            error={errors.full_particulars_of_the_promoter}
            required={true}
            existingDocument={
              documentIds.full_particulars_of_the_promoter ??
              existingDocuments.full_particulars_of_the_promoter
            }
            onReplace={(newDocumentId, newDocumentUrl) => handleDocumentReplace('full_particulars_of_the_promoter', newDocumentId, newDocumentUrl)}
          />
        </div>

        <div className="space-y-4">

          <DocumentUpload
            label="Circular Minutes of Meeting"
            onUploadComplete={(documentId, documentUrl) => handleDocumentUploadComplete('circular_minutes_of_meeting', documentId, documentUrl)}
            onUploadCancel={() => handleDocumentUploadCancel('circular_minutes_of_meeting')}
            error={errors.circular_minutes_of_meeting}
            required={true}
            existingDocument={
              documentIds.circular_minutes_of_meeting ?? existingDocuments.circular_minutes_of_meeting
            }
            onReplace={(newDocumentId, newDocumentUrl) => handleDocumentReplace('circular_minutes_of_meeting', newDocumentId, newDocumentUrl)}
          />

          <DocumentUpload
            label="Land Document"
            onUploadComplete={(documentId, documentUrl) => handleDocumentUploadComplete('land_document', documentId, documentUrl)}
            onUploadCancel={() => handleDocumentUploadCancel('land_document')}
            error={errors.land_document}
            required={true}
            existingDocument={documentIds.land_document ?? existingDocuments.land_document}
            onReplace={(newDocumentId, newDocumentUrl) => handleDocumentReplace('land_document', newDocumentId, newDocumentUrl)}
          />

          <DocumentUpload
            label="Circular for Promoters' Meeting"
            onUploadComplete={(documentId, documentUrl) => handleDocumentUploadComplete('circular_for_promoters_meeting', documentId, documentUrl)}
            onUploadCancel={() => handleDocumentUploadCancel('circular_for_promoters_meeting')}
            error={errors.circular_for_promoters_meeting}
            required={true}
            existingDocument={
              documentIds.circular_for_promoters_meeting ??
              existingDocuments.circular_for_promoters_meeting
            }
            onReplace={(newDocumentId, newDocumentUrl) => handleDocumentReplace('circular_for_promoters_meeting', newDocumentId, newDocumentUrl)}
          />
        </div>
      </div>

      {/* Document Links — one row per type: prefer in-session upload, else copy from server (avoids duplicate cards) */}
      {(
        [
          ['bye_laws', 'Bye-law'],
          ['bank_certificate', 'Bank Certificate'],
          ['economic_scheme', 'Economic Scheme'],
          ['contributor_list', 'Promoter List'],
          ['custom_documents', 'Custom Documents'],
          ['circular_minutes_of_meeting', 'Circular Minutes of Meeting'],
          ['land_document', 'Land Document'],
          ['full_particulars_of_the_promoter', 'Full Particulars of the Promoter'],
          ['circular_for_promoters_meeting', "Circular for Promoters' Meeting"],
          ['minutes_of_meeting_of_promoters_meeting', "Minutes of Meeting of Promoters' Meeting"],
        ] as const
      ).some(([field]) => Boolean(documentIds[field] ?? existingDocuments[field])) && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              Uploaded Documents
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(
                [
                  ['bye_laws', 'Bye-law'],
                  ['bank_certificate', 'Bank Certificate'],
                  ['economic_scheme', 'Economic Scheme'],
                  ['contributor_list', 'Promoter List'],
                  ['custom_documents', 'Custom Documents'],
                  ['circular_minutes_of_meeting', 'Circular Minutes of Meeting'],
                  ['land_document', 'Land Document'],
                  ['full_particulars_of_the_promoter', 'Full Particulars of the Promoter'],
                  ['circular_for_promoters_meeting', "Circular for Promoters' Meeting"],
                  ['minutes_of_meeting_of_promoters_meeting', "Minutes of Meeting of Promoters' Meeting"],
                ] as const
              ).map(([field, label]) => {
                const doc = documentIds[field] ?? existingDocuments[field];
                if (!doc?.url) return null;
                const ext = doc.url.split('.').pop()?.toLowerCase();
                return (
                  <div
                    key={field}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{label}</p>
                    </div>
                    <div className="flex space-x-2 flex-end">
                      {ext === 'pdf' && (
                        <Button size="sm" variant="outline" onClick={() => handleView(doc.url)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(doc.url)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Agreements */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.email_agreement}
            onChange={(e) => setFormData({ ...formData, email_agreement: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="text-sm text-gray-700">
            I agree to receive emails and alerts offers from the site
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.terms_agreement}
            onChange={(e) => {
              setFormData({ ...formData, terms_agreement: e.target.checked });
              validateField('terms_agreement', e.target.checked);
            }}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="text-sm text-gray-700">
            By clicking, you are confirming that you have read, understood and agree to the{' '}
            <a href="#" className="text-blue-600 underline">terms & conditions</a>
          </label>
        </div>
        {errors.terms_agreement && <span className="text-red-600 text-sm">{errors.terms_agreement}</span>}
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasicDetails();
      case 2:
        return renderSectorDetails();
      case 3:
        return renderFinancialDetails();
      case 4:
        return renderDeclaration();
      default:
        return null;
    }
  };

  const handleSaveAsDraft = async () => {
    const skipApst = currentStep === 2;
    if (
      !validateStep(currentStep, formData, setErrors, documentIds, existingDocuments, masterData, {
        skipPromoterApstRule: skipApst
      })
    ) {
      toast.error('Please fix the highlighted fields on this step before saving as draft.');
      return;
    }

    // This page is mounted outside Layout (/registrations/new), so Redux statuses are often empty.
    let draftStatus = statuses.find((status: any) => status.key === 'draft');
    if (!draftStatus) {
      try {
        const list = await getAllStatuses();
        if (Array.isArray(list) && list.length > 0) {
          dispatch(setStatuses(list));
          draftStatus = list.find((status: any) => status.key === 'draft');
        }
      } catch (e) {
        console.error('Failed to fetch statuses for draft save', e);
        toast.error('Could not load statuses. Please check your connection and try again.');
        return;
      }
    }

    if (!draftStatus) {
      toast.error('Draft status is not available. Please contact support.');
      return;
    }

    await handleSubmit(draftStatus.id);
  };

  return (
    <>
      <div className="flex flex-col w-[90%] mx-auto pt-5">
        {/* Progress Indicator */}
        {renderProgressIndicator()}

        {/* Content */}
        <div className="flex-1 px-6">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center p-6">
          <div>
            {currentStep > 1 ? (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            ) : (
              <Button variant="outline" onClick={() => navigate(-1)}>
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {currentStep < 4 ? (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  {<Button onClick={handleSaveAsDraft} variant="outline">
                    Save as Draft
                    <Save className="h-4 w-4 ml-2" />
                  </Button>}
                  <Button
                    onClick={() => handleSubmit('')}
                    className="disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Submit to NIC
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && <Modal
        isOpen={showAddMemberModal}
        onClose={handleCloseMemberModal}
        title={editingMember ? "Edit Promoter" : "Add New Promoter"}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            {editingMember ? "Edit a promoter to your society" : "Add a new promoter to your society"}
          </p>

          <Input
            label="Name *"
            name="promoter_name"
            autoComplete="off"
            value={newMember.name}
            placeholder='Enter this promoter’s own name'
            onChange={(e) => {
              setNewMember({ ...newMember, name: e.target.value });
              if (memberErrors.name) {
                setMemberErrors(prev => ({ ...prev, name: '' }));
              }
            }}
            error={memberErrors.name}
          />
          <Input
            label="Mobile *"
            name="promoter_mobile"
            autoComplete="off"
            value={newMember.mobile}
            placeholder='Enter this promoter’s own mobile number'
            maxLength={10}
            onChange={(e) => {
              setNewMember({ ...newMember, mobile: e.target.value });
              if (memberErrors.mobile) {
                setMemberErrors(prev => ({ ...prev, mobile: '' }));
              }
            }}
            error={memberErrors.mobile}
          />

          <Select
            label="Gender *"
            value={newMember.gender}
            onChange={(e) => {
              setNewMember({ ...newMember, gender: e.target.value });
              if (memberErrors.gender) {
                setMemberErrors(prev => ({ ...prev, gender: '' }));
              }
            }}
            error={memberErrors.gender}
          >
            <option value="">-- Select --</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="transgender">Transgender</option>
          </Select>

          <Select
            label="Category *"
            value={newMember.category}
            onChange={(e) => {
              setNewMember({ ...newMember, category: e.target.value });
              if (memberErrors.category) {
                setMemberErrors(prev => ({ ...prev, category: '' }));
              }
            }}
            error={memberErrors.category}
          >
            <option value="">-- Select --</option>
            {editingMember?.category &&
              !['APST', 'General', 'SC'].includes(editingMember.category) && (
                <option value={editingMember.category}>
                  {editingMember.category} (change to APST, General, or SC)
                </option>
              )}
            <option value="APST">APST</option>
            <option value="General">General</option>
            <option value="SC">SC</option>
          </Select>

          <Select
            label="Designation *"
            value={newMember.designation}
            onChange={(e) => {
              setNewMember({ ...newMember, designation: e.target.value });
              if (memberErrors.designation) {
                setMemberErrors(prev => ({ ...prev, designation: '' }));
              }
            }}
            error={memberErrors.designation}
          >
            <option value="">-- Select --</option>
            <option value="Promoter">Promoter</option>
            {!existingDesignation.chairmenExist && <option value="Chief Promoter">Chief Promoter</option>}
            {!existingDesignation.secretariesExist && <option value="Secretary">Secretary</option>}
            {!existingDesignation.treasurersExist && <option value="Treasurer">Treasurer</option>}
          </Select>
          {/* 
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={newMember.is_co_opted}
              onChange={(e) =>
                setNewMember({ ...newMember, is_co_opted: e.target.checked })
              }
              className="h-4 w-4"
            />
            Mark as Co-opted Member
          </label> */}

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={handleCloseMemberModal}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (validateMemberDetails()) {
                if (editingMember) {
                  saveEditedMember();
                } else {
                  addMember();
                }
              }
            }}>
              {editingMember ? "Save Changes" : "Add Promoter"}
            </Button>
          </div>
        </div>
      </Modal>}

      {showCoorporativeSocietyType &&
        <Modal
          isOpen={showCoorporativeSocietyType}
          onClose={() => setShowCoorporativeSocietyType(false)}
          title={"Coorporative Society Form"}
          size="xl"
        >
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Fill the form to register your society as a coorporative society
            </p>
            <CoorporativeMapping
              societyType={coorporativeSocietyType}
              data={formData?.additional_data || null}
              onCancel={() => {
                setShowCoorporativeSocietyType(false);
              }}
              onClose={() => {
                setShowCoorporativeSocietyType(false);
                setCoorporativeSocietyType('');

                // If sector hasn't changed, restore original additional data
                if (originalSectorData && formData.sector_of_operation === originalSectorData.sectorId) {
                  setFormData(prev => ({
                    ...prev,
                    additional_data: originalSectorData.additionalData
                  }));
                }
              }}
              onSubmit={(data) => {
                setFormData({ ...formData, additional_data: data });
                setShowCoorporativeSocietyType(false);
              }}
            />
          </div>
        </Modal>
      }

      <Modal
        isOpen={showSocietyNamePhrasePopup}
        onClose={() => setShowSocietyNamePhrasePopup(false)}
        title="Society name"
        size="sm"
      >
        <p className="text-sm text-gray-700">
          The words <span className="font-semibold">Cooperative Society Limited</span> are mandatory in the society name.
          Please include them in Proposed Name.
        </p>
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            onClick={() => setShowSocietyNamePhrasePopup(false)}
          >
            OK
          </Button>
        </div>
      </Modal>

      {/* Document Checklist Modal */}
      <DocumentChecklist
        isOpen={showDocumentChecklist}
        onClose={() => setShowDocumentChecklist(false)}
        onProceed={() => setShowDocumentChecklist(false)}
        title="Society Registration - Required Documents"
        description="Before proceeding with society registration, please ensure you have all the required documents ready for upload."
      />
    </>
  );
}; 
