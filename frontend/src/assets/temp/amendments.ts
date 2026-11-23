const data = [
    {
        id: '1',
        amendment_id: 'AMD-2024-001',
        amendment_type: 'Bye-laws Amendment',
        chairperson_name: 'John Doe',
        chairperson_address: '123 Main Street, City, State 12345',
        chairperson_contact: '+91-9876543210',
        signatory_name: 'Jane Smith',
        signatory_address: '456 Oak Avenue, City, State 12345',
        signatory_contact: '+91-9876543211',
        board_members: [
            'John Doe - President',
            'Jane Smith - Vice President',
            'Mike Johnson - Secretary',
            'Sarah Wilson - Treasurer'
        ],
        resolution_extract: 'Resolution passed to amend Article 5 of the society bye-laws to increase promoters fees.',
        general_body_meeting_date: '2024-01-15',
        notice_days: 21,
        notice_date: '2023-12-25',
        total_members: 150,
        quorum_required: 38,
        members_present: 45,
        members_voted: 42,
        votes_in_favor: 38,
        votes_against: 4,
        bylaw_number: 'Article 5',
        existing_bylaw: 'Membership fees shall be Rs. 500 per annum.',
        new_proposed_bylaw: 'Membership fees shall be Rs. 750 per annum.',
        reason_for_amendment: 'To meet increased operational costs and maintain society facilities.',
        proposed_bylaw_text: 'Article 5: Membership fees shall be Rs. 750 per annum, payable in advance.',
        status: 'pending',
        priority: 'high',
        created_at: '2024-01-12',
        updated_at: '2024-01-12',
        documents: [
            {
                id: '1',
                name: 'Resolution Document.pdf',
                type: 'application/pdf',
                size: 245760,
                url: '/documents/resolution.pdf'
            },
            {
                id: '2',
                name: 'Meeting Minutes.pdf',
                type: 'application/pdf',
                size: 189440,
                url: '/documents/minutes.pdf'
            }
        ]
    },
    {
        id: '2',
        amendment_id: 'AMD-2024-002',
        amendment_type: 'Rules Amendment',
        chairperson_name: 'Robert Brown',
        chairperson_address: '789 Pine Street, City, State 12345',
        chairperson_contact: '+91-9876543212',
        signatory_name: 'Lisa Davis',
        signatory_address: '321 Elm Street, City, State 12345',
        signatory_contact: '+91-9876543213',
        board_members: [
            'Robert Brown - President',
            'Lisa Davis - Vice President',
            'Tom Wilson - Secretary',
            'Emily Johnson - Treasurer'
        ],
        resolution_extract: 'Resolution passed to amend Rule 3 regarding meeting attendance requirements.',
        general_body_meeting_date: '2023-12-20',
        notice_days: 15,
        notice_date: '2023-12-05',
        total_members: 120,
        quorum_required: 30,
        members_present: 35,
        members_voted: 33,
        votes_in_favor: 30,
        votes_against: 3,
        bylaw_number: 'Rule 3',
        existing_bylaw: 'Promoters must attend at least 50% of general body meetings.',
        new_proposed_bylaw: 'Promoters must attend at least 60% of general body meetings.',
        reason_for_amendment: 'To improve promoter participation and engagement in society activities.',
        proposed_bylaw_text: 'Rule 3: Promoters must attend at least 60% of general body meetings annually.',
        status: 'approved',
        priority: 'medium',
        created_at: '2023-12-28',
        updated_at: '2024-01-05',
        documents: [
            {
                id: '3',
                name: 'Amendment Proposal.pdf',
                type: 'application/pdf',
                size: 156672,
                url: '/documents/proposal.pdf'
            }
        ]
    },
    {
        id: '3',
        amendment_id: 'AMD-2024-003',
        amendment_type: 'Memorandum Amendment',
        chairperson_name: 'David Miller',
        chairperson_address: '654 Maple Drive, City, State 12345',
        chairperson_contact: '+91-9876543214',
        signatory_name: 'Rachel Green',
        signatory_address: '987 Cedar Lane, City, State 12345',
        signatory_contact: '+91-9876543215',
        board_members: [
            'David Miller - President',
            'Rachel Green - Vice President',
            'Chris Lee - Secretary',
            'Amanda White - Treasurer'
        ],
        resolution_extract: 'Resolution passed to amend the society memorandum regarding object clauses.',
        general_body_meeting_date: '2024-01-10',
        notice_days: 30,
        notice_date: '2023-12-11',
        total_members: 200,
        quorum_required: 50,
        members_present: 55,
        members_voted: 52,
        votes_in_favor: 48,
        votes_against: 4,
        bylaw_number: 'Object Clause 2',
        existing_bylaw: 'The society shall promote cultural activities only.',
        new_proposed_bylaw: 'The society shall promote cultural, educational, and social activities.',
        reason_for_amendment: 'To expand the scope of society activities and better serve promoter interests.',
        proposed_bylaw_text: 'Object Clause 2: The society shall promote cultural, educational, and social activities for the benefit of its promoters.',
        status: 'pending',
        priority: 'low',
        created_at: '2024-01-08',
        updated_at: '2024-01-08',
        documents: [
            {
                id: '4',
                name: 'Memorandum Amendment.pdf',
                type: 'application/pdf',
                size: 198656,
                url: '/documents/memorandum.pdf'
            },
            {
                id: '5',
                name: 'Legal Opinion.pdf',
                type: 'application/pdf',
                size: 223232,
                url: '/documents/legal-opinion.pdf'
            }
        ]
    },
    {
        id: '4',
        amendment_id: 'AMD-2024-004',
        amendment_type: 'Bye-laws Amendment',
        chairperson_name: 'Maria Garcia',
        chairperson_address: '111 Oak Street, City, State 12345',
        chairperson_contact: '+91-9876543216',
        signatory_name: 'Carlos Rodriguez',
        signatory_address: '222 Pine Avenue, City, State 12345',
        signatory_contact: '+91-9876543217',
        board_members: [
            'Maria Garcia - President',
            'Carlos Rodriguez - Vice President',
            'Ana Martinez - Secretary',
            'Luis Hernandez - Treasurer'
        ],
        resolution_extract: 'Resolution passed to amend Article 8 regarding election procedures.',
        general_body_meeting_date: '2024-01-20',
        notice_days: 25,
        notice_date: '2023-12-26',
        total_members: 180,
        quorum_required: 45,
        members_present: 52,
        members_voted: 50,
        votes_in_favor: 47,
        votes_against: 3,
        bylaw_number: 'Article 8',
        existing_bylaw: 'Elections shall be held every two years.',
        new_proposed_bylaw: 'Elections shall be held every three years.',
        reason_for_amendment: 'To provide more stability in leadership and reduce election costs for promoters.',
        proposed_bylaw_text: 'Article 8: Elections shall be held every three years, with terms beginning on January 1st.',
        status: 'rejected',
        priority: 'medium',
        created_at: '2024-01-18',
        updated_at: '2024-01-25',
        documents: [
            {
                id: '6',
                name: 'Election Amendment.pdf',
                type: 'application/pdf',
                size: 178432,
                url: '/documents/election.pdf'
            }
        ]
    },
    {
        id: '5',
        amendment_id: 'AMD-2024-005',
        amendment_type: 'Rules Amendment',
        chairperson_name: 'James Wilson',
        chairperson_address: '333 Elm Drive, City, State 12345',
        chairperson_contact: '+91-9876543218',
        signatory_name: 'Patricia Taylor',
        signatory_address: '444 Maple Lane, City, State 12345',
        signatory_contact: '+91-9876543219',
        board_members: [
            'James Wilson - President',
            'Patricia Taylor - Vice President',
            'Michael Anderson - Secretary',
            'Jennifer Davis - Treasurer'
        ],
        resolution_extract: 'Resolution passed to amend Rule 7 regarding financial reporting requirements.',
        general_body_meeting_date: '2024-01-25',
        notice_days: 20,
        notice_date: '2024-01-05',
        total_members: 160,
        quorum_required: 40,
        members_present: 48,
        members_voted: 45,
        votes_in_favor: 42,
        votes_against: 3,
        bylaw_number: 'Rule 7',
        existing_bylaw: 'Financial reports shall be submitted quarterly.',
        new_proposed_bylaw: 'Financial reports shall be submitted monthly.',
        reason_for_amendment: 'To improve financial transparency and accountability.',
        proposed_bylaw_text: 'Rule 7: Financial reports shall be submitted monthly to the board of directors.',
        status: 'pending',
        priority: 'high',
        created_at: '2024-01-22',
        updated_at: '2024-01-22',
        documents: [
            {
                id: '7',
                name: 'Financial Amendment.pdf',
                type: 'application/pdf',
                size: 201728,
                url: '/documents/financial.pdf'
            },
            {
                id: '8',
                name: 'Audit Report.pdf',
                type: 'application/pdf',
                size: 156672,
                url: '/documents/audit.pdf'
            }
        ]
    }
];

export const amendmentsTemp = {
    status: 200,
    pagination: {
        limit: 10,
        from: 0,
        to: 10,
        total: data.length
    },
    data: data
}