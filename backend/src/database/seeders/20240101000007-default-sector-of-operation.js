'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('sector_of_operations', [
      {
        id: require('uuid').v4(),
        code: '001',
        name: 'Agriculture & Allied Cooperative',
        description: 'Agricultural and allied cooperative societies',
        respective_table: 'cooperative_registrations_agriculture',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        code: '002',
        name: 'Agro Processing / Industrial Cooperative',
        description: 'Agro processing and industrial cooperative societies',
        respective_table: 'cooperative_registrations_processing',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        code: '003',
        name: 'Bee Farming Cooperative',
        description: 'Bee farming and honey production cooperative societies',
        respective_table: 'cooperative_registrations_bee',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        code: '004',
        name: 'Consumer Cooperative',
        description: 'Consumer sector cooperative societies',
        respective_table: 'cooperative_registrations_consumer',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        code: '005',
        name: 'Thrift & Credit Cooperative Society',
        description: 'Credit and thrift cooperative societies',
        respective_table: 'cooperative_registrations_credit_thrift',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        code: '006',
        name: 'Dairy Cooperative',
        description: 'Dairy sector cooperative societies',
        respective_table: 'cooperative_registration_dairy',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        code: '007',
        name: 'Educational & Training Cooperatives',
        description: 'Educational and training cooperative societies',
        respective_table: 'cooperative_registrations_education',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        code: '008',
        name: 'Farmers Service Cooperative Society',
        description: 'Farmers service cooperative societies',
        respective_table: 'cooperative_registration_farmer',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        code: '009',
        name: 'Fishery Cooperative',
        description: 'Fishery sector cooperative societies',
        respective_table: 'cooperative_registration_fishery',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        code: '010',
        name: 'Handicraft Cooperative',
        description: 'Handicraft cooperative societies',
        respective_table: 'cooperative_registrations_handicraft',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        code: '011',
        name: 'Handloom Textile & Weavers Cooperative',
        description: 'Handloom, textile, and weavers cooperative societies',
        respective_table: 'cooperative_registrations_handloom',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        code: '012',
        name: 'Housing Cooperative Society',
        description: 'Housing sector cooperative societies',
        respective_table: 'cooperative_registrations_housing',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        code: '013',
        name: 'Jute and Coir Cooperative',
        description: 'Jute and coir cooperative societies',
        respective_table: 'cooperative_registrations_jute',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        code: '014',
        name: 'Labour Cooperative',
        description: 'Labour sector cooperative societies',
        respective_table: 'cooperative_registrations_labour',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        code: '015',
        name: 'Large Sized Multipurpose Cooperative Society (LAMPS)',
        description: 'Large size multipurpose cooperative societies',
        respective_table: 'cooperative_registration_large_area',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        code: '016',
        name: 'Livestock & Poultry Cooperative',
        description: 'Livestock and poultry cooperative societies',
        respective_table: 'cooperative_registrations_livestock',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        code: '017',
        name: 'Marketing Cooperative Society',
        description: 'Marketing sector cooperative societies',
        respective_table: 'cooperative_registrations_marketing',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        code: '018',
        name: 'Miscellaneous Credit Cooperative',
        description: 'Miscellaneous credit cooperative societies',
        respective_table: 'cooperative_registrations_cmiscellaneous',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        code: '019',
        name: 'Miscellaneous Non-Credit Cooperative',
        description: 'Miscellaneous non-credit cooperative societies',
        respective_table: 'cooperative_registrations_miscellaneous',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        code: '020',
        name: 'Multipurpose Cooperative',
        description: 'Multipurpose sector cooperative societies',
        respective_table: 'cooperative_registrations_multi',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        code: '021',
        name: 'Primary Agricultural Credit Society (PACS)',
        description: 'Primary agricultural credit cooperative societies',
        respective_table: 'cooperative_registration_primary',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        code: '022',
        name: 'Sericulture Cooperative',
        description: 'Sericulture sector cooperative societies',
        respective_table: 'cooperative_registrations_sericulture',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        code: '023',
        name: 'Social Welfare & Cultural Cooperative',
        description: 'Social welfare and cultural cooperative societies',
        respective_table: 'cooperative_registrations_social',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        code: '024',
        name: 'Sugar Mills Cooperative',
        description: 'Sugar mills sector cooperative societies',
        respective_table: 'cooperative_registrations_sugar',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        code: '025',
        name: 'Tourism Cooperative',
        description: 'Tourism sector cooperative societies',
        respective_table: 'cooperative_registrations_tourism',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        code: '026',
        name: 'Transport Cooperative',
        description: 'Transport sector cooperative societies',
        respective_table: 'cooperative_registrations_transport',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        code: '027',
        name: 'Tribal-SC/ST Cooperative',
        description: 'Tribal SC/ST cooperative societies',
        respective_table: 'cooperative_registrations_tribal',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        code: '028',
        name: 'Urban Cooperative Bank (UCB)',
        description: 'Urban cooperative bank societies',
        respective_table: 'cooperative_registrations_ucb',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        code: '029',
        name: 'Women Welfare Cooperative Society',
        description: 'Women welfare sector cooperative societies',
        respective_table: 'cooperative_registrations_wocoop',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        code: '030',
        name: 'Khadi Gramodyog Cooperative',
        description: 'Khadi gramodyog cooperative societies',
        respective_table: 'cooperative_registrations_khadi_gram',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('sector_of_operations', null, {});
  }
}; 