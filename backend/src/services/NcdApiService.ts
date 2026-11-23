import { Op } from 'sequelize';
import SocietyRegistration from '../models/SocietyRegistration';
import State from '../models/State';
import District from '../models/District';
import Block from '../models/Block';
import SectorOfOperation from '../models/SectorOfOperation';
import Status from '../models/Status';
import Member from '../models/Member';
import AreaOfOperationLevelUrban from '../models/AreaOfOperationLevelUrban';
import AreaOfOperationLevel from '../models/AreaOfOperationLevel';
import DistrictsBlocksGpVillage from '../models/DistrictsBlocksGpVillage';
import UrbanLocalBody from '../models/UrbanLocalBody';
import UrbanLocalBodiesWard from '../models/UrbanLocalBodiesWard';
import CooperativeSocietyType from '../models/CooperativeSocietyType';
import RegistrationAuthority from '../models/RegistrationAuthority';
import WaterBodyType from '../models/WaterBodyType';
import FunctionalStatus from '../models/FunctionalStatus';
import SectorOfOperationsType from '../models/SectorOfOperationsType';
import Bank from '../models/Bank';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { buildNcdApiPayload, NcdApiPayload } from '../utils/ncdApiPayload';

const NCD_API_URL = process.env.NCD_API_URL || '';
const NCD_SECURE_KEY = process.env.NCD_SECURE_KEY || '';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(v: unknown): boolean {
  return typeof v === 'string' && UUID_RE.test(v.trim());
}

/**
 * Fetches society registration by id with all associations needed to build NCD payload.
 */
export async function getSocietyForNcdPayload(societyRegistrationId: string): Promise<any> {
  const society = await SocietyRegistration.findByPk(societyRegistrationId, {
    include: [
      { model: State, as: 'state', attributes: ['id', 'name', 'state_code'] },
      { model: District, as: 'district', attributes: ['id', 'district_code', 'state_code', 'name'] },
      { model: Block, as: 'block', attributes: ['id', 'block_code', 'district_code', 'state_code', 'name'] },
      { model: SectorOfOperation, as: 'sectorOfOperation', attributes: ['id', 'name', 'code', 'respective_table'] },
      { model: Status, as: 'statusDetails', attributes: ['id', 'key', 'title'] },
      { model: CooperativeSocietyType, as: 'cooperativeSocietyType', attributes: ['id', 'name'], required: false },
      { model: RegistrationAuthority, as: 'registrationAuthority', attributes: ['id', 'name'], required: false },
      { model: AreaOfOperationLevel, as: 'areaOfOperationLevel', attributes: ['id', 'name', 'level_type'], required: false },
      { model: WaterBodyType, as: 'waterBodyType', attributes: ['id', 'name'], required: false },
      { model: FunctionalStatus, as: 'functionalStatus', attributes: ['id', 'name'], required: false }
    ]
  });

  if (!society) {
    throw new AppError('Society registration not found', 404);
  }

  const plain = society.toJSON ? society.toJSON() : (society as any).get({ plain: true });

  // Members are stored with society_id = society_registrations.id (UUID), not society_id string
  try {
    const membersList = await Member.findAll({
      where: { society_id: plain.id },
      attributes: ['id', 'gender', 'category', 'society_id']
    });
    plain.members = membersList.map((m: any) => (m.toJSON ? m.toJSON() : m));
  } catch {
    plain.members = [];
  }

  if (typeof plain.additional_data === 'string') {
    try {
      plain.additional_data = JSON.parse(plain.additional_data);
    } catch {
      plain.additional_data = {};
    }
  }

  try {
    const areaUrban = await AreaOfOperationLevelUrban.findAll({
      where: {
        [Op.or]: [{ society_id: plain.id }, { society_id: plain.society_id }]
      }
    });
    plain.areaOfOperationLevelUrban = areaUrban.map((r: any) => (r.toJSON ? r.toJSON() : r));
  } catch {
    plain.areaOfOperationLevelUrban = [];
  }

  // Sector of operation type (credit / non-credit)
  plain.sectorOfOperationType = null;
  if (plain.sector_of_operation_type) {
    try {
      if (isUuid(plain.sector_of_operation_type)) {
        const sot = await SectorOfOperationsType.findByPk(plain.sector_of_operation_type, {
          attributes: ['id', 'name', 'key']
        });
        plain.sectorOfOperationType = sot ? (sot.toJSON ? sot.toJSON() : sot) : null;
      }
    } catch {
      plain.sectorOfOperationType = null;
    }
  }

  // Functional status may be stored as name string when not a UUID FK
  if (!plain.functionalStatus && plain.functional_status && !isUuid(plain.functional_status)) {
    try {
      const fs = await FunctionalStatus.findOne({
        where: { name: { [Op.like]: String(plain.functional_status) } },
        attributes: ['id', 'name']
      });
      plain.functionalStatus = fs ? (fs.toJSON ? fs.toJSON() : fs) : { name: plain.functional_status };
    } catch {
      plain.functionalStatus = { name: plain.functional_status };
    }
  }

  // Bank master (for NCD bank code)
  plain.bank = null;
  if (plain.cooperative_society_bank_id) {
    try {
      if (isUuid(plain.cooperative_society_bank_id)) {
        const bank = await Bank.findByPk(plain.cooperative_society_bank_id, {
          attributes: ['id', 'name', 'code']
        });
        plain.bank = bank ? (bank.toJSON ? bank.toJSON() : bank) : null;
      }
    } catch {
      plain.bank = null;
    }
  }

  // Gram panchayat / village geo row
  plain.gramPanchayat = null;
  if (plain.gram_panchayat_id) {
    try {
      const gp = isUuid(plain.gram_panchayat_id)
        ? await DistrictsBlocksGpVillage.findByPk(plain.gram_panchayat_id)
        : await DistrictsBlocksGpVillage.findOne({
            where: { gram_panchayat_code: plain.gram_panchayat_id }
          });
      plain.gramPanchayat = gp ? (gp.toJSON ? gp.toJSON() : gp) : null;
    } catch {
      plain.gramPanchayat = null;
    }
  }
  if (!plain.gramPanchayat && plain.village_code) {
    try {
      const byVillage = isUuid(plain.village_code)
        ? await DistrictsBlocksGpVillage.findByPk(plain.village_code)
        : await DistrictsBlocksGpVillage.findOne({
            where: { village_code: plain.village_code }
          });
      if (byVillage) {
        plain.gramPanchayat = byVillage.toJSON ? byVillage.toJSON() : byVillage;
        plain.village = plain.gramPanchayat;
      }
    } catch {
      /* ignore */
    }
  }

  // Urban local body: by UUID id, else try numeric localbody_code / name
  plain.urbanLocalBodyType = null;
  plain.urbanLocalBodyCode = null;
  if (plain.urban_local_body_type) {
    try {
      if (isUuid(plain.urban_local_body_type)) {
        const ulb = await UrbanLocalBody.findByPk(plain.urban_local_body_type, {
          attributes: ['id', 'localbody_code', 'localbody_type_code', 'district_code', 'local_body_name', 'localbody_type_name']
        });
        plain.urbanLocalBodyType = ulb ? (ulb.toJSON ? ulb.toJSON() : ulb) : null;
      } else if (!Number.isNaN(Number(plain.urban_local_body_type))) {
        const ulb = await UrbanLocalBody.findOne({
          where: { localbody_type_code: Number(plain.urban_local_body_type) },
          attributes: ['id', 'localbody_code', 'localbody_type_code', 'district_code', 'local_body_name', 'localbody_type_name']
        });
        plain.urbanLocalBodyType = ulb ? (ulb.toJSON ? ulb.toJSON() : ulb) : null;
      } else {
        const ulb = await UrbanLocalBody.findOne({
          where: {
            [Op.or]: [
              { local_body_name: { [Op.like]: `%${String(plain.urban_local_body_type)}%` } },
              { localbody_type_name: { [Op.like]: `%${String(plain.urban_local_body_type)}%` } }
            ]
          },
          attributes: ['id', 'localbody_code', 'localbody_type_code', 'district_code', 'local_body_name', 'localbody_type_name']
        });
        plain.urbanLocalBodyType = ulb ? (ulb.toJSON ? ulb.toJSON() : ulb) : null;
      }
    } catch {
      plain.urbanLocalBodyType = null;
    }
  }

  if (plain.urban_local_body_code) {
    try {
      if (isUuid(plain.urban_local_body_code)) {
        const ulb = await UrbanLocalBody.findByPk(plain.urban_local_body_code, {
          attributes: ['id', 'localbody_code', 'localbody_type_code', 'district_code', 'local_body_name']
        });
        plain.urbanLocalBodyCode = ulb ? (ulb.toJSON ? ulb.toJSON() : ulb) : null;
      } else if (!Number.isNaN(Number(plain.urban_local_body_code))) {
        const ulb = await UrbanLocalBody.findOne({
          where: { localbody_code: Number(plain.urban_local_body_code) },
          attributes: ['id', 'localbody_code', 'localbody_type_code', 'district_code', 'local_body_name']
        });
        plain.urbanLocalBodyCode = ulb ? (ulb.toJSON ? ulb.toJSON() : ulb) : null;
      }
    } catch {
      plain.urbanLocalBodyCode = null;
    }
  }

  // Ward: by UUID id, else by ward_code number (e.g. "52")
  plain.localityWard = null;
  if (plain.locality_ward_code) {
    try {
      if (isUuid(plain.locality_ward_code)) {
        const ward = await UrbanLocalBodiesWard.findByPk(plain.locality_ward_code, {
          attributes: ['id', 'ward_code', 'local_body_code']
        });
        plain.localityWard = ward ? (ward.toJSON ? ward.toJSON() : ward) : null;
      } else if (!Number.isNaN(Number(plain.locality_ward_code))) {
        const wardWhere: any = { ward_code: Number(plain.locality_ward_code) };
        const lbCode =
          plain.urbanLocalBodyCode?.localbody_code ??
          plain.urbanLocalBodyType?.localbody_code ??
          null;
        if (lbCode != null) wardWhere.local_body_code = lbCode;
        const ward = await UrbanLocalBodiesWard.findOne({
          where: wardWhere,
          attributes: ['id', 'ward_code', 'local_body_code']
        });
        plain.localityWard = ward
          ? ward.toJSON
            ? ward.toJSON()
            : ward
          : { ward_code: Number(plain.locality_ward_code) };
      }
    } catch {
      plain.localityWard = !Number.isNaN(Number(plain.locality_ward_code))
        ? { ward_code: Number(plain.locality_ward_code) }
        : null;
    }
  }

  return plain;
}

/**
 * Builds NCD API payload for a society (without calling NCD API).
 */
export async function getNcdPayloadForSociety(
  societyRegistrationId: string,
  options: { secureKey?: string } = {}
): Promise<NcdApiPayload> {
  const society = await getSocietyForNcdPayload(societyRegistrationId);
  const secureKey = options.secureKey ?? NCD_SECURE_KEY ?? 'A key value will be provided';
  return buildNcdApiPayload(society, { secureKey });
}

/**
 * Uploads society data to NCD by building payload and POSTing to NCD API.
 */
export async function uploadSocietyToNcd(
  societyRegistrationId: string,
  options: { apiUrl?: string; secureKey?: string } = {}
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const apiUrl = options.apiUrl ?? NCD_API_URL;
  if (!apiUrl) {
    logger.warn('NCD_API_URL not configured; skipping NCD upload');
    return { success: false, error: 'NCD_API_URL not configured' };
  }

  const payload = await getNcdPayloadForSociety(societyRegistrationId, {
    secureKey: options.secureKey ?? NCD_SECURE_KEY
  });

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      logger.error('NCD API returned error', { status: response.status, societyRegistrationId, data });
      return {
        success: false,
        data,
        error: `NCD API HTTP ${response.status}`
      };
    }
    logger.info('Society uploaded to NCD successfully', { societyRegistrationId, data });
    return { success: true, data };
  } catch (err: any) {
    logger.error('NCD upload failed', { societyRegistrationId, error: err?.message });
    return {
      success: false,
      error: err?.message || 'NCD upload request failed'
    };
  }
}
