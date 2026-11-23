import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

interface IMedia {
  id: string;
  url: string;
  created_by: string | null;
  updated_by: string | null;
  active: boolean;
  readonly created_at: Date;
  readonly updated_at: Date;
}

interface IMediaCreate {
  url: string;
  created_by?: string | null;
  updated_by?: string | null;
  active?: boolean;
}

class Media extends Model<IMedia, IMediaCreate> implements IMedia {
  public id!: string;
  public url!: string;
  public created_by!: string | null;
  public updated_by!: string | null;
  public active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association properties
  public createdByUser?: any;
  public updatedByUser?: any;
  public societyRegistrations?: any[];
  public amendments?: any[];
  public circularNoticeAmendments?: any[];
  public minutesOfMeetingAmendments?: any[];
  public attendanceSheetAmendments?: any[];
  public certificateSocieties?: any[];
  public notificationSocieties?: any[];

  public static associate(models: any) {
    Media.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'createdByUser'
    });

    Media.belongsTo(models.User, {
      foreignKey: 'updated_by',
      as: 'updatedByUser'
    });


    // Society Registration associations
    Media.hasMany(models.SocietyRegistration, { foreignKey: 'bye_laws', as: 'byeLawsSocieties' });
    Media.hasMany(models.SocietyRegistration, { foreignKey: 'bank_certificate', as: 'bankCertificateSocieties' });
    Media.hasMany(models.SocietyRegistration, { foreignKey: 'economic_scheme', as: 'economicSchemeSocieties' });
    Media.hasMany(models.SocietyRegistration, { foreignKey: 'contributor_list', as: 'contributorListSocieties' });
    Media.hasMany(models.SocietyRegistration, { foreignKey: 'custom_documents', as: 'customDocumentsSocieties' });
    Media.hasMany(models.SocietyRegistration, { foreignKey: 'circular_for_promoters_meeting', as: 'circularForPromotersMeetingSocieties' });
    Media.hasMany(models.SocietyRegistration, { foreignKey: 'minutes_of_meeting_of_promoters_meeting', as: 'minutesOfMeetingOfPromotersMeetingSocieties' });
    Media.hasMany(models.SocietyRegistration, { foreignKey: 'full_particulars_of_the_promoter', as: 'fullParticularsOfThePromoterSocieties' });

    // Amendment associations
    Media.hasMany(models.Amendment, { foreignKey: 'existing_byelaw_media_id', as: 'existingByelawAmendments' });
    Media.hasMany(models.Amendment, { foreignKey: 'new_proposed_byelaw_media_id', as: 'newProposedByelawAmendments' });
    Media.hasMany(models.Amendment, { foreignKey: 'bye_laws', as: 'byeLawsAmendments' });
    // Optional media associations (only if migrations are applied)
    Media.hasMany(models.Amendment, { foreignKey: 'circular_notice_media_id', as: 'circularNoticeAmendments' });
    Media.hasMany(models.Amendment, { foreignKey: 'minutes_of_meeting_media_id', as: 'minutesOfMeetingAmendments' });
    Media.hasMany(models.Amendment, { foreignKey: 'attendance_sheet_media_id', as: 'attendanceSheetAmendments' });
    Media.hasMany(models.SocietyRegistration, { foreignKey: 'certificate_media_id', as: 'certificateSocieties' });
    Media.hasMany(models.SocietyRegistration, { foreignKey: 'notification_media_id', as: 'notificationSocieties' });

    // Society Conversion associations
    Media.hasMany(models.SocietyConversion, { foreignKey: 'bye_laws', as: 'byeLawsSocietyConversions' });

    Media.hasMany(models.AnnualForm, { foreignKey: 'balance_sheet', as: 'balanceSheetAnnualForms' });
    Media.hasMany(models.AnnualForm, { foreignKey: 'bye_laws', as: 'byeLawsAnnualForms' });
    Media.hasMany(models.AuditRequest, { foreignKey: 'bye_laws', as: 'byeLawsAuditRequests' });
    Media.hasMany(models.ElectionRequest, { foreignKey: 'bye_laws', as: 'byeLawsElectionRequests' });
    Media.hasMany(models.Appeal, { foreignKey: 'bye_laws', as: 'byeLawsAppeals' });
    Media.hasMany(models.GeneralBodyMeeting, { foreignKey: 'media_id', as: 'generalBodyMeetings' });
    Media.hasMany(models.GeneralBodyMeeting, { foreignKey: 'bye_laws', as: 'byeLawsGeneralBodyMeetings' });
    Media.hasMany(models.SpecialGeneralBoardMeeting, { foreignKey: 'notice_id', as: 'specialGeneralBoardMeetings' });
    Media.hasMany(models.SpecialGeneralBoardMeeting, { foreignKey: 'bye_laws', as: 'byeLawsSpecialGeneralBoardMeetings' });
    Media.hasMany(models.Amendment, { foreignKey: 'meeting_notice_agenda_media_id', as: 'meetingNoticeAgendaAmendments' });
    Media.hasMany(models.Amendment, { foreignKey: 'copy_of_notice_form_g_media_id', as: 'copyOfNoticeFormGAmendments' });
    Media.hasMany(models.Amendment, { foreignKey: 'district_drcs_arcs_recommendation_media_id', as: 'districtDrcsArcsRecommendationAmendments' });
    // Media.hasMany(models.User, { foreignKey: 'signature_media_id', as: 'signatureMedia'});
  }
}

Media.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  updated_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  tableName: 'media',
  modelName: 'Media',
  underscored: true,
  indexes: [
    {
      fields: ['url']
    },
    {
      fields: ['active']
    },
    {
      fields: ['created_by']
    },
    {
      fields: ['updated_by']
    }
  ],
  hooks: {
    beforeCreate: (media: Media) => {
      if (!media.id) {
        media.id = require('uuid').v4();
      }
    }
  }
});

export default Media; 