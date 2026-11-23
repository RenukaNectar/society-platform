import { Op } from 'sequelize';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import SocietyRegistration from '../models/SocietyRegistration';
import Amendment from '../models/Amendment';
import AuditRequest from '../models/AuditRequest';
import Status from '../models/Status';
import District from '../models/District';
import { findStatusByKey } from './StatusService';
import { getAllRoles } from './RoleService';
import Liquidation from '../models/Liquidation';
import Enquiry from '../models/Enquiry';
import { get } from 'http';

// Simple test function to isolate database issues
export const testDatabaseConnection = async () => {
  try {
    logger.info('Testing basic database operations...');

    // Test Status model
    const statusCount = await Status.count();
    logger.info(`Status count: ${statusCount}`);

    // Test SocietyRegistration model
    const societyCount = await SocietyRegistration.count();
    logger.info(`Society count: ${societyCount}`);

    // Test Amendment model
    const amendmentCount = await Amendment.count();
    logger.info(`Amendment count: ${amendmentCount}`);

    // Test AuditRequest model
    const auditCount = await AuditRequest.count();
    logger.info(`Audit count: ${auditCount}`);

    //Test Liquidation model
    const liquidationCount = await Liquidation.count();
    logger.info(`Liquidation count: ${liquidationCount}`);



    logger.info('All database operations successful');
    return { statusCount, societyCount, amendmentCount, auditCount, liquidationCount };
  } catch (error) {
    logger.error('Database test failed:', error);
    throw error;
  }
};

// export const getApplicationsDataByRole = async (
//   role: string,
//   statusFilter?: (string | number)[],
//   userDistrictId?: string,
//   userRole?: string
// ) => {
//   try {
//     logger.info(`Starting getApplicationsDataByRole for role: ${role}, userDistrict: ${userDistrictId}`);

//     // --- Ensure DB is alive ---
//     try {
//       await Status.count();
//       logger.info("Database connection OK");
//     } catch (err) {
//       logger.error("Database connection failed", err);
//       throw new AppError("Database connection failed", 500);
//     }

//     // --- Role-based default filters ---
//     const roleFilters: Record<string, any> = {
//       rcs_district: {
//         [Op.and]: [
//           { key: { [Op.ne]: "draft" } },
//           {
//             [Op.or]: [
//               { key: "approved" },
//               { key: "rejected" },
//               { key: "certificate_issued" },

//             ],
//           },
//         ],
//       },
//       jt_rcs_district: {
//         [Op.and]: [
//           { key: { [Op.ne]: "draft" } },
//           {
//             [Op.or]: [
//               { key: "approved" },
//               { key: "rejected" },
//               { key: "certificate_issued" },
//             ],
//           },
//         ],
//       },
//       jics_sics_district: {
//         [Op.and]: [
//           { key: { [Op.ne]: "draft" } },
//           { key: { [Op.in]: ["pending", "resubmit", "requested"] } },
//         ],
//       },
//       sics_district: {
//         [Op.and]: [
//           { key: { [Op.ne]: "draft" } },
//           { key: { [Op.in]: ["pending", "resubmit", "requested"] } },
//         ],
//       },
//       drcs_arcs_district: {
//         [Op.and]: [
//           { key: { [Op.ne]: "draft" } },
//           { key: { [Op.in]: ["pending", "resubmit", "requested"] } },
//         ],
//       },
//       drcs_district: {
//         [Op.and]: [
//           { key: { [Op.ne]: "draft" } },
//           { key: { [Op.in]: ["pending", "resubmit", "requested"] } },
//         ],
//       },
//       // ================= AUDITOR ROLES =================
//       jics_sics_auditor: {
//         key: { [Op.in]: ["approved", "registrar_approved"] }
//       },

//       drcs_arcs_auditor: {
//         key: { [Op.in]: ["approved", "registrar_approved"] }
//       },

//       // ================= LIQUIDATOR =================
//       jics_sics_liquidator: {
//         key: { [Op.ne]: "draft" }
//       },
//       admin: { key: { [Op.ne]: "draft" } },
//       drcs_arcs_hq: { key: { [Op.ne]: "draft" } },
//       jics_sics_hq: { key: { [Op.ne]: "draft" } },
//       jt_rcs_hq: { key: { [Op.ne]: "draft" } },
//       arcs: {
//         [Op.and]: [
//           { key: { [Op.ne]: "draft" } },
//           {
//             [Op.or]: [
//               { key: "approved" },
//               { key: "rejected" },
//               { key: "resubmitted" },
//               { key: "certificate_issued" },
//             ],
//           },
//         ],
//       },
//     };
//     let statusIds: string[] = [];
//     let isCustomFilter = false;

//     // --- Resolve Status IDs ---
//     if (statusFilter?.length) {
//       isCustomFilter = true;
//       logger.info(`Custom status filter: ${statusFilter}`);

//       const statusKeys = statusFilter.filter(x => typeof x === "string") as string[];
//       const statusNums = statusFilter.filter(x => typeof x === "number") as number[];

//       const statuses = await Status.findAll({
//         where: {
//           [Op.and]: [
//             {
//               [Op.or]: [
//                 { key: { [Op.in]: statusKeys } },
//                 { id: { [Op.in]: statusNums } },
//               ],
//             },
//             { key: { [Op.ne]: "draft" } },
//             { is_active: true },
//           ],
//         },
//         attributes: ["id", "key"],
//       });

//       statusIds = [...new Set(statuses.map(s => s.id))];
//       logger.info(`Resolved ${statusIds.length} custom status IDs`);
//     } else {
//       const filters = roleFilters[role.toLowerCase()];
//       if (!filters) throw new AppError(`Invalid role: ${role}`, 400);

//       const statuses = await Status.findAll({ where: filters, attributes: ["id"] });
//       statusIds = statuses.map(s => s.id);
//       logger.info(`Resolved ${statusIds.length} role-based status IDs`);
//     }

//     // --- Common Data ---
//     const draftStatus = await findStatusByKey("draft");
//     const allStatuses = await Status.findAll({
//       where: { is_active: true, key: { [Op.ne]: "draft" } },
//       attributes: ["id", "key", "title", "description"],
//       order: [["title", "ASC"]],
//     });

//     // --- Build district filter ---
//     // Enforce district scoping for non-admin users
//     if (userRole !== "admin" && userRole !== "super_admin" && !userDistrictId) {
//       throw new AppError("District information required for non-admin users", 400);
//     }

//     const districtFilter =
//       userRole === "admin" || userRole === "super_admin"
//         ? {}
//         : { district_id: userDistrictId };

//     // --- Generic helpers ---
//     const buildWhereClause = (ids: string[], modelName: string) => {
//       if (isCustomFilter && ids.length === 0) return { id: { [Op.eq]: "__invalid__" } };
//       if (!ids.length) return {};
//       return { [(modelName === "SocietyRegistration" || modelName === "Liquidation") ? "status" : "status_id"]: { [Op.in]: ids } };
//     };

//     const countModule = async (model: any, modelName: string) => {
//       return model.count({
//         where: {
//           ...buildWhereClause(statusIds, modelName),
//           ...(draftStatus ? { [(modelName === "SocietyRegistration" || modelName === "Liquidation") ? "status" : "status_id"]: { [Op.ne]: draftStatus.id } } : {}),
//         },
//         ...(districtFilter.district_id && modelName !== "SocietyRegistration"
//           ? {
//             include: [
//               {
//                 model: SocietyRegistration,
//                 as: modelName === "Amendment" ? "society" : "societyRegistration",
//                 where: districtFilter,
//                 required: true,
//               },
//             ],
//           }
//           : {}),
//         ...(modelName === "SocietyRegistration" ? { ...districtFilter } : {}),
//       });
//     };

//     const getBreakdown = async (model: any, modelName: string) => {
//       const col = ((modelName === "SocietyRegistration" || modelName === "Liquidation") ? "status" : "status_id");
//       const targetIds = statusIds.length ? statusIds : allStatuses.map(s => s.id);

//       return Promise.all(
//         targetIds.map(async id => {
//           const status = await Status.findByPk(id);
//           const count = await model.count({
//             where: {
//               [col]: id,
//               ...(modelName === "SocietyRegistration" ? { ...districtFilter } : {}),
//             },
//             ...(districtFilter.district_id && modelName !== "SocietyRegistration"
//               ? {
//                 include: [
//                   {
//                     model: SocietyRegistration,
//                     as: modelName === "Amendment" ? "society" : "societyRegistration",
//                     where: districtFilter,
//                     required: true,
//                   },
//                 ],
//               }
//               : {}),
//           });
//           return { status_id: id, status_key: status?.key ?? "unknown", status_title: status?.title ?? "Unknown", count };
//         })
//       );
//     };

//     // --- Parallel Queries ---
//     const [societyCount, amendmentCount, auditCount, liquidationCount, totalSocietyCount, totalAmendmentCount, totalAuditCount, totalLiquidationCount, societyBreakdown, amendmentBreakdown, auditBreakdown, liquidationBreakdown] =
//       await Promise.all([
//         countModule(SocietyRegistration, "SocietyRegistration"),
//         countModule(Amendment, "Amendment"),
//         countModule(AuditRequest, "AuditRequest"),
//         countModule(Liquidation, "Liquidation"),
//         SocietyRegistration.count({ where: { ...districtFilter, ...(draftStatus ? { status: { [Op.ne]: draftStatus.id } } : {}) } }),
//         Amendment.count({
//           where: draftStatus ? { status_id: { [Op.ne]: draftStatus.id } } : {},
//           include: [{ model: SocietyRegistration, as: "society", where: districtFilter, required: !!districtFilter.district_id }],
//         }),
//         AuditRequest.count({
//           where: draftStatus ? { status_id: { [Op.ne]: draftStatus.id } } : {},
//           include: [{ model: SocietyRegistration, as: "societyRegistration", where: districtFilter, required: !!districtFilter.district_id }],
//         }),
//         Liquidation.count({
//           where: draftStatus ? { status: { [Op.ne]: draftStatus.id } } as any : {},
//           include: [{ model: SocietyRegistration, as: "society", where: districtFilter, required: !!districtFilter.district_id }],
//         }),
//         getBreakdown(SocietyRegistration, "SocietyRegistration"),
//         getBreakdown(Amendment, "Amendment"),
//         getBreakdown(AuditRequest, "AuditRequest"),
//         getBreakdown(Liquidation, "Liquidation"),
//       ]);

//     // --- Helper for breakdown lookup ---
//     const getStatusCount = (arr: any[], key: string) => arr.find(s => s.status_key === key)?.count ?? 0;

//     // --- Final Response ---
// return {
//   societies: {
//     challan_pending: getStatusCount(societyBreakdown, "challan_pending"),
//     resubmit: getStatusCount(societyBreakdown, "resubmit"),
//     requested: getStatusCount(societyBreakdown, "requested"),
//     rejected: getStatusCount(societyBreakdown, "rejected"),
//     approved: getStatusCount(societyBreakdown, "approved"),
//     forwarded: getStatusCount(societyBreakdown, "forwarded"),
//     // registrar_approved: getStatusCount(societyBreakdown, "registrar_approved"),
//     // registrar_rejected: getStatusCount(societyBreakdown, "registrar_rejected"),
//     certificate_issued: getStatusCount(societyBreakdown, "certificate_issued"),
//     total: totalSocietyCount,
//   },
//   amendments: {
//     pending: getStatusCount(amendmentBreakdown, "pending"),
//     resubmit: getStatusCount(amendmentBreakdown, "resubmit"),
//     requested: getStatusCount(amendmentBreakdown, "requested"),
//     rejected: getStatusCount(amendmentBreakdown, "rejected"),
//     approved: getStatusCount(amendmentBreakdown, "approved"),
//     registrar_approved: getStatusCount(amendmentBreakdown, "registrar_approved"),
//     registrar_rejected: getStatusCount(amendmentBreakdown, "registrar_rejected"),
//     hearing_required: getStatusCount(amendmentBreakdown, "hearing_required"),
//     hearing_resolved: getStatusCount(amendmentBreakdown, "hearing_resolved"),
//     total: totalAmendmentCount,
//   },
//   audits: {
//     pending: getStatusCount(auditBreakdown, "pending"),
//     resubmit: getStatusCount(auditBreakdown, "resubmit"),
//     requested: getStatusCount(auditBreakdown, "requested"),
//     rejected: getStatusCount(auditBreakdown, "rejected"),
//     approved: getStatusCount(auditBreakdown, "approved"),
//     registrar_approved: getStatusCount(auditBreakdown, "registrar_approved"),
//     registrar_rejected: getStatusCount(auditBreakdown, "registrar_rejected"),
//     hearing_required: getStatusCount(auditBreakdown, "hearing_required"),
//     hearing_resolved: getStatusCount(auditBreakdown, "hearing_resolved"),
//     total: totalAuditCount,
//   },
//   // liquidation: {
//   //   submitted: await Liquidation.count({
//   //     ...(districtFilter.district_id
//   //       ? {
//   //         include: [
//   //           {
//   //             model: SocietyRegistration,
//   //             as: "society",
//   //             where: districtFilter,
//   //             required: true,
//   //           },
//   //         ],
//   //       }
//   //       : {}),
//   //   }),
//   // },
//   liquidation: {
//     pending: getStatusCount(liquidationBreakdown, "pending"),
//     resubmit: getStatusCount(liquidationBreakdown, "resubmit"),
//     requested: getStatusCount(liquidationBreakdown, "requested"),
//     rejected: getStatusCount(liquidationBreakdown, "rejected"),
//     approved: getStatusCount(liquidationBreakdown, "approved"),
//     submitted: getStatusCount(liquidationBreakdown, "submitted"),
//     resubmitted: getStatusCount(liquidationBreakdown, "resubmitted"),
//     total: totalLiquidationCount,
//   },

//       inquiries: {
//         requested: await Enquiry.count({
//           ...(districtFilter.district_id
//             ? {
//               include: [
//                 {
//                   model: SocietyRegistration,
//                   as: "society",
//                   where: districtFilter,
//                   required: true,
//                 },
//               ],
//             }
//             : {}),
//         }),
//       },
//       total_active_societies: totalSocietyCount,
//       total_all_modules: totalSocietyCount + totalAmendmentCount + totalAuditCount + totalLiquidationCount,
//       total_modules: 4,
//       total_statuses: allStatuses.length,
//     };
//   } catch (err) {
//     logger.error("Error in getApplicationsDataByRole:", err);
//     throw err;
//   }
// };


// Helper function to get available statuses for filtering

export const getApplicationsDataByRole = async (
  role: string,
  statusFilter?: (string | number)[],
  userDistrictId?: string,
  userRole?: string,
  userId?: string
) => {
  try {
    logger.info(
      `Starting getApplicationsDataByRole for role: ${role}, userDistrict: ${userDistrictId}`
    );

    await Status.count(); // DB health check

    // ================= STATUS RESOLUTION =================
    let statusIds: string[] = [];
    let isCustomFilter = false;

    if (statusFilter?.length) {
      isCustomFilter = true;

      const statusKeys = statusFilter.filter(
        (x) => typeof x === "string"
      ) as string[];

      const statusNums = statusFilter.filter(
        (x) => typeof x === "number"
      ) as number[];

      const statuses = await Status.findAll({
        where: {
          [Op.or]: [
            { key: { [Op.in]: statusKeys } },
            { id: { [Op.in]: statusNums } },
          ],
          is_active: true,
          key: { [Op.ne]: "draft" },
        },
        attributes: ["id"],
      });

      statusIds = statuses.map((s) => s.id);
    } else {
      const statuses = await Status.findAll({
        where: {
          is_active: true,
          key: { [Op.ne]: "draft" },
        },
        attributes: ["id"],
      });

      statusIds = statuses.map((s) => s.id);
    }

    const draftStatus = await findStatusByKey("draft");

    // ================= ROLE BASED FILTERING =================
    let districtFilter: any = {};
    let applicantFilter: any = {};

    const isAdmin =
      userRole === "admin" || userRole?.includes("_hq");

    const isCrossDistrictRole =
      userRole === 'rcs_district' || userRole === 'jt_rcs_district';

    const isApplicant = userRole === "applicant";

    if (isAdmin || isCrossDistrictRole) {
      // Admin → no filter
    } else if (isApplicant) {
      if (!userId) {
        throw new AppError("Permission denied", 400);
      }
      applicantFilter = { user_id: userId };
    } else {
      if (!userDistrictId) {
        throw new AppError("District required for district users", 400);
      }
      districtFilter = { district_id: userDistrictId };
    }

    // ================= HELPERS =================
    const getStatusColumn = (modelName: string) =>
      modelName === "SocietyRegistration" ||
        modelName === "Liquidation"
        ? "status"
        : "status_id";

    // const getInclude = (modelName: string) => {
    //   if (!districtFilter.district_id) return undefined;

    //   return [
    //     {
    //       model: SocietyRegistration,
    //       as:
    //         modelName === "Amendment"
    //           ? "society"
    //           : modelName === "Liquidation"
    //             ? "society"
    //             : "societyRegistration",
    //       where: districtFilter,
    //       required: true,
    //     },
    //   ];
    // };

    const getInclude = (modelName: string) => {
      // ❌ Never include inside SocietyRegistration
      if (modelName === "SocietyRegistration") {
        return undefined;
      }

      if (!districtFilter.district_id) return undefined;

      return [
        {
          model: SocietyRegistration,
          as:
            modelName === "Amendment"
              ? "society"
              : modelName === "Liquidation"
                ? "society"
                : "societyRegistration",
          where: districtFilter,
          required: true,
        },
      ];
    };

    const countModule = async (model: any, modelName: string) => {
      const statusColumn = getStatusColumn(modelName);

      return model.count({
        where: {
          ...(statusIds.length && {
            [statusColumn]: { [Op.in]: statusIds },
          }),

          ...(draftStatus && {
            [statusColumn]: { [Op.ne]: draftStatus.id },
          }),

          ...(modelName === "SocietyRegistration" && {
            ...districtFilter,
            ...applicantFilter,
          }),
        },
        include: getInclude(modelName),
      });
    };

    // ================= COUNTS =================
    const [
      totalSocietyCount,
      totalAmendmentCount,
      totalAuditCount,
      totalLiquidationCount,
    ] = await Promise.all([
      countModule(SocietyRegistration, "SocietyRegistration"),
      countModule(Amendment, "Amendment"),
      countModule(AuditRequest, "AuditRequest"),
      countModule(Liquidation, "Liquidation"),
    ]);

    // ================= FINAL RESPONSE =================
    return {
      societies: { total: totalSocietyCount },
      amendments: { total: totalAmendmentCount },
      audits: { total: totalAuditCount },
      liquidation: { total: totalLiquidationCount },

      total_active_societies: totalSocietyCount,
      total_all_modules:
        totalSocietyCount +
        totalAmendmentCount +
        totalAuditCount +
        totalLiquidationCount,
      total_modules: 4,
    };
  } catch (err) {
    logger.error("Error in getApplicationsDataByRole:", err);
    throw err;
  }
};

export const getAvailableStatuses = async () => {
  try {
    const statuses = await Status.findAll({
      where: { is_active: true },
      attributes: ['id', 'key', 'title', 'description'],
      order: [['title', 'ASC']]
    });
    return statuses;
  } catch (error) {
    logger.error('Error getting available statuses:', error);
    throw error;
  }
};

// Helper function to determine if a status is accessible for a given role
const isStatusAccessibleForRole = (role: string, statusKey: string): boolean => {
  const roleLower = role.toLowerCase();

  switch (roleLower) {
    case 'rcs_district':
    case 'jt_rcs_district':
    case 'drcs_arcs_district':
    case 'jics_sics_district':
    case 'sics_district':
      // District roles can see approved, rejected, certificate_issued
      return ['approved', 'rejected', 'certificate_issued'].includes(statusKey);
    case 'arcs':
      // Registrar roles can see inspector approved and beyond
      return ['approved', 'registrar_approved', 'registrar_rejected', 'hearing_required', 'hearing_resolved'].includes(statusKey);

    case 'senior_inspector':
    case 'field_inspector':
      // Inspector roles can see pending and resubmit
      return ['pending', 'resubmit', 'requested'].includes(statusKey);

    case 'admin':
    case 'drcs_arcs_hq':
    case 'jics_sics_hq':
      // These roles can see all statuses
      return true;

    default:
      return false;
  }
};

// Allowed status keys for district-wise society graph (approved, forwarded, rejected, submitted, resubmit only)
const GRAPH_STATUS_KEYS = ['approved', 'forwarded', 'rejected', 'submitted', 'resubmit', 'certificate_issued'] as const;

// Get district-wise society data for graphs
export const getDistrictWiseSocietyGraphData = async (role: string, year?: number, userDistrictId?: string, userRole?: string) => {
  try {
    logger.info(`Starting getDistrictWiseSocietyGraphData for role: ${role}, year: ${year || 'current'}`);

    const { roles } = await getAllRoles(1, 500, undefined, true);
    const allowedRoles = roles
      .filter((r) => r.name.toLowerCase() !== 'applicant')
      .map((r) => r.name.toLowerCase());
    const roleLower = role.toLowerCase();
    if (!allowedRoles.includes(roleLower)) {
      throw new AppError(`Invalid role: ${role}`, 400);
    }

    // Get current year if not specified
    const currentYear = year || new Date().getFullYear();
    const draftStatus = await findStatusByKey('draft');
    const allowedStatuses = await Promise.all(GRAPH_STATUS_KEYS.map((key) => findStatusByKey(key)));
    const allowedStatusIds = allowedStatuses.map((s) => s?.id).filter((id): id is string => id != null);

    if (allowedStatusIds.length === 0) {
      throw new AppError('No valid graph statuses found', 500);
    }

    // Base query for society registrations: exclude draft, only approved/forwarded/rejected/submitted/resubmit
    const baseQuery: any = {
      where: {
        [Op.and]: [
          { [Op.not]: { status: draftStatus?.id } },
          { status: { [Op.in]: allowedStatusIds } },
          {
            created_at: {
              [Op.gte]: new Date(currentYear, 0, 1),
              [Op.lt]: new Date(currentYear + 1, 0, 1)
            }
          }
        ]
      },
      include: [
        {
          model: District,
          as: 'district',
          attributes: ['id', 'name', 'district_code'],
          required: true
        }
      ],
      attributes: [
        'id',
        'district_id',
        'created_at',
        'status'
      ]
    };

    const isCrossDistrictRole =
      userRole === 'rcs_district' || userRole === 'jt_rcs_district';

    // Add district filter if user has a district and is not admin (and not cross-district roles)
    if (userDistrictId && userRole !== 'admin' && userRole !== 'super_admin' && !isCrossDistrictRole) {
      baseQuery.where.district_id = userDistrictId;
      logger.info(`Filtering societies by user district: ${userDistrictId}`);
    } else if (userRole === 'admin' || userRole === 'super_admin') {
      logger.info('Admin user - bypassing district filter for graph data');
    } else {
      logger.info('No district filter applied for graph data');
    }

    // Get society registrations with district information
    const societyRegistrations = await SocietyRegistration.findAll(baseQuery);

    // Initialize monthly data structure
    const monthlyData = [
      { month: 'Jan', filings: 0 },
      { month: 'Feb', filings: 0 },
      { month: 'Mar', filings: 0 },
      { month: 'Apr', filings: 0 },
      { month: 'May', filings: 0 },
      { month: 'Jun', filings: 0 },
      { month: 'Jul', filings: 0 },
      { month: 'Aug', filings: 0 },
      { month: 'Sep', filings: 0 },
      { month: 'Oct', filings: 0 },
      { month: 'Nov', filings: 0 },
      { month: 'Dec', filings: 0 }
    ];

    // Process society registrations to count monthly filings
    societyRegistrations.forEach(registration => {

      if (registration.created_at) {
        const month = new Date(registration.created_at).getMonth();
        if (month >= 0 && month < monthlyData.length && monthlyData[month]) {
          monthlyData[month].filings += 1;
        }
      }
    });

    // Get district-wise breakdown using a simpler approach
    const districtData = await SocietyRegistration.findAll({
      where: baseQuery.where,
      include: [
        {
          model: District,
          as: 'district',
          attributes: ['id', 'name', 'district_code'],
          required: false
        }
      ],
      attributes: ['district_id']
    });

    // Group and count district data manually
    const districtCounts = new Map<string, { name: string; code: number | null; count: number }>();

    districtData.forEach(item => {
      const districtId = item.district_id || 'unknown';
      const districtName = item.district?.name || 'Unknown District';
      const districtCode = item.district?.district_code || null;

      if (districtCounts.has(districtId)) {
        const existing = districtCounts.get(districtId);
        if (existing) {
          existing.count += 1;
        }
      } else {
        districtCounts.set(districtId, {
          name: districtName,
          code: districtCode,
          count: 1
        });
      }
    });

    // Convert to array and sort by count
    const formattedDistrictData = Array.from(districtCounts.entries())
      .map(([districtId, data]) => ({
        district_id: districtId,
        district_name: data.name,
        district_code: data.code,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count);



    // Get total counts
    const totalSocieties = societyRegistrations.length;
    const totalDistricts = formattedDistrictData.length;

    logger.info(`District-wise society graph data generated successfully. Total societies: ${totalSocieties}, Total districts: ${totalDistricts}`);

    return monthlyData;

  } catch (error) {
    logger.error('Error in getDistrictWiseSocietyGraphData:', error);
    throw error;
  }
};
