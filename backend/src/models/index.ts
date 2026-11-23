import sequelize from '../config/sequelize';
import User from './user';
import Role from './Role';
import Permission from './Permission';
import RolePermission from './RolePermission';
import Session from './Session';
import WaterBodyType from './WaterBodyType';
import State from './State';
import SectorOfOperation from './SectorOfOperation';
import RegistrationAuthority from './RegistrationAuthority';
import District from './District';
import CooperativeSocietyType from './CooperativeSocietyType';
import Block from './Block';
import AreaOfOperationLevel from './AreaOfOperationLevel';
import AreaOfOperationLevelUrban from './AreaOfOperationLevelUrban';
import DistrictsBlocksGpVillage from './DistrictsBlocksGpVillage';
import SocietyRegistration from './SocietyRegistration';
import Member from './Member';
import BodMember from './BodMember';
import Bank from './Bank';
import Notification from './Notification';
import NotificationTemplate from './NotificationTemplate';
import Status from './Status';
import Media from './Media';
import FunctionalStatus from './FunctionalStatus';
import LocationType from './LocationType';
import UrbanLocalBodiesWard from './UrbanLocalBodiesWard';
import UrbanLocalBody from './UrbanLocalBody';
import Amendment from './Amendment';
import AuditRequest from './AuditRequest';
import History from './History';
import UserNotification from './UserNotification';
import AnnualForm from './AnnualForm';
import Auditor from './Auditor';
import ElectionRequest from './ElectionRequest';
import Liquidation from './Liquidation';
import SocietyType from './SocietyType';
import CostOfManagementType from './CostOfManagementType';
import MisappropriationLevel from './MisappropriationLevel';
import ArbitrationAuthority from './ArbitrationAuthority';

import Enquiry from './Enquiry';
import Appeal from './Appeal';
import Activity from './Activity';
import GeneralBodyMeeting from './GeneralBodyMeetings';
import SpecialGeneralBoardMeeting from './SpecialGeneralBoardMeeting';
import SocietyConversion from './SocietyConversion';
import BusinessActivity from './BusinessActivity';
import Setting from './Setting';
import Module from './Module';
import ModuleWorkflow from './ModuleWorkflow';
import SocietyRenewal from './SocietyRenewal';
import MemberOtpVerification from './MemberOtpVerification';
import ApplicationAssignment from './ApplicationAssignment';

// ✅ Properly typed models object
const models = {
  User,
  Role,
  Permission,
  RolePermission,
  Session,
  WaterBodyType,
  State,
  SectorOfOperation,
  RegistrationAuthority,
  District,
  CooperativeSocietyType,
  Block,
  AreaOfOperationLevel,
  AreaOfOperationLevelUrban,
  DistrictsBlocksGpVillage,
  SocietyRegistration,
  Member,
  BodMember,
  Bank,
  Notification,
  NotificationTemplate,
  Status,
  Media,
  FunctionalStatus,
  LocationType,
  UrbanLocalBodiesWard,
  UrbanLocalBody,
  Amendment,
  AuditRequest,
  History,
  UserNotification,
  AnnualForm,
  Auditor,
  ElectionRequest,
  Liquidation,
  SocietyType,
  CostOfManagementType,
  MisappropriationLevel,
  ArbitrationAuthority,
  Enquiry,
  Appeal,
  Activity,
  GeneralBodyMeeting,
  SpecialGeneralBoardMeeting,
  SocietyConversion,
  BusinessActivity,
  Setting,
  Module,
  ModuleWorkflow,
  SocietyRenewal,
  MemberOtpVerification,
  ApplicationAssignment,
};

const setupAssociations = () => {
  // ✅ Call associate method for models that have it
  Object.values(models).forEach((model: any) => {
    if (typeof model.associate === 'function') {
      model.associate(models);
    }
  });
  console.log('All associations have been set up');
};

const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Sequelize connection has been established successfully.');

    // Setup associations
    setupAssociations();

    // Optional: Uncomment for schema sync
    // await sequelize.sync({ alter: true });

  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
};

export { sequelize, initializeDatabase, setupAssociations };
export default models;
