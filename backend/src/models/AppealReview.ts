import {
    Model,
    DataTypes,
    Optional,
    Sequelize
  } from 'sequelize';
import Appeal from './Appeal';
import sequelize from '../config/sequelize';
  
  // ---- Interface ----
  export interface AppealReviewAttributes {
    id: string;
    appeal_id: string;
    officer_remarks?: string | null;
    hearing_date?: Date | null;
  
    final_decision_remarks?: string | null;
    decision_order?: string | null; // UUID of media
    date_of_decision?: Date | null;
  
    created_at?: Date;
    updated_at?: Date;
    created_by?: string | null;
    updated_by?: string | null;
    active?: boolean;
    status?: string;
    status_updated_at?: Date | null;
    status_updated_by?: string | null;
  }
  
interface AppealReviewCreationAttributes {
    appeal_id: string;
    officer_remarks?: string | null;
    hearing_date?: Date | null;
    final_decision_remarks?: string | null;
    decision_order?: string | null;
    date_of_decision?: Date | null;
    created_by?: string | null;
    updated_by?: string | null;
}

class AppealReview extends Model<AppealReviewAttributes, AppealReviewCreationAttributes> implements AppealReviewAttributes {
    public id!: string;
    public appeal_id!: string;
    public officer_remarks!: string | null;
    public hearing_date!: Date | null;
    public final_decision_remarks!: string | null;
    public decision_order!: string | null;
    public date_of_decision!: Date | null;
    public created_by!: string | null;
    public updated_by!: string | null;
    public active!: boolean;
    public status?: string;
    public status_updated_at!: Date | null;
    public status_updated_by!: string | null;
    public static associate(models: any) {
        AppealReview.belongsTo(models.Appeal, { foreignKey: 'appeal_id', as: 'appeal' });
        AppealReview.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });
        AppealReview.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedByUser' });
        AppealReview.belongsTo(models.User, { foreignKey: 'status_updated_by', as: 'statusUpdatedByUser' });
        AppealReview.belongsTo(models.Status, { foreignKey: 'status', as: 'appealStatus' });
    }
}

AppealReview.init({
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false
    },
    appeal_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'appeals',
            key: 'id'
        }
    },
    officer_remarks: {  
        type: DataTypes.TEXT,
        allowNull: true
    },
    hearing_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    final_decision_remarks: {   
        type: DataTypes.TEXT,
        allowNull: true
    },
    decision_order: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
            model: 'media',
            key: 'id'
        }
    },
    date_of_decision: {
        type: DataTypes.DATE,
        allowNull: true
    },
    created_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    updated_by: {
        type: DataTypes.UUID,
        allowNull: false,   
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
    status: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
            model: 'statuses',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    },
    status_updated_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    status_updated_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
}, {
    sequelize,
    modelName: 'AppealReview',
    tableName: 'appeal_reviews',
    timestamps: true,
    paranoid: false
});

export default AppealReview;
