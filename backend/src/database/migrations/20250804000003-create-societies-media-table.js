'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('societies_media', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      society_id: {
        type: Sequelize.STRING(40),
        allowNull: false,
        references: {
          model: 'society_registrations',
          key: 'society_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      media_type: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      media_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'media',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('societies_media', ['society_id']);
    await queryInterface.addIndex('societies_media', ['media_id']);
    await queryInterface.addIndex('societies_media', ['media_type']);
    await queryInterface.addIndex('societies_media', ['active']);
    
    // Add unique constraint to prevent duplicate associations
    await queryInterface.addIndex('societies_media', ['society_id', 'media_id', 'media_type'], {
      unique: true,
      name: 'unique_society_media_type'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('societies_media');
  }
}; 