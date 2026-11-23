const NOTIFICATIONS = {
  notifications: {
    society: {
      registration: {
        created: {
          title: "Society Created",
          path: "/registrations/{id}"
        },
        updated: {
          title: "Society Updated",
          path: "/registrations/{id}"
        },
        approved: {
          title: "Society Approved",
          path: "/registrations/{id}"
        },
        rejected: {
          title: "Society Rejected",
          path: "/registrations/{id}"
        },
        pending_inspector: {
          title: "Pending Inspector Review",
          path: "/registrations/{id}"
        },
        pending_registrar: {
          title: "Pending Registrar Approval",
          path: "/registrations/{id}"
        },
        completed: {
          title: "Society Registration Completed",
          path: "/registrations/{id}"
        },
        draft: {
          title: "Draft Saved",
          path: "/registrations/{id}/edit"
        },
        status_update: {
          title: "Society Registration Status Updated",
          path: "/registrations/{id}"
        },
        challan_uploaded: {
          title: "Challan Uploaded",
          path: "/registrations/{id}"
        },
        challan_rejected: {
          title: "Challan Rejected",
          path: "/registrations/{id}"
        },
        certificate_issued: {
          title: "Society Registration Certificate Issued",
          path: "/registrations/{id}"
        },
        challan_pending: {
          title: "Challan Pending",
          path: "/registrations/{id}"
        },
        challan_approved: {
          title: "Challan Approved",
          path: "/registrations/{id}"
        },
        registrar_approved: {
          title: "Registrar Approved",
          path: "/registrations/{id}"
        },
        registrar_rejected: {
          title: "Registrar Rejected",
          path: "/registrations/{id}"
        },
        inspector_approved: {
          title: "Field Inspector Approved",
          path: "/registrations/{id}"
        },
        inspector_rejected: {
          title: "Field Inspector Rejected",
          path: "/registrations/{id}"
        },
        senior_inspector_approved: {
          title: "Senior Inspector Approved",
          path: "/registrations/{id}"
        },
        senior_inspector_rejected: {
          title: "Senior Inspector Rejected",
          path: "/registrations/{id}"
        },
        ARC_approved: {
          title: "ARC Approved",
          path: "/registrations/{id}"
        },
        ARC_rejected: {
          title: "ARC Rejected",
          path: "/registrations/{id}"
        },
        deputy_registrar_approved: {
          title: "Deputy Registrar Approved",
          path: "/registrations/{id}"
        },
        deputy_registrar_rejected: {
          title: "Deputy Registrar Rejected",
          path: "/registrations/{id}"
        },
        joint_registrar_approved: {
          title: "Joint Registrar Approved",
          path: "/registrations/{id}"
        },
        joint_registrar_rejected: {
          title: "Joint Registrar Rejected",
          path: "/registrations/{id}"
        },
      },
      renewal: {
        created: {
          title: "Renewal Application Created",
          path: "/renewals/{id}"
        },
        updated: {
          title: "Renewal Application Updated",
          path: "/renewals/{id}"
        }
      },
      amendment: {
        requested: {
          title: "Amendment Request Submitted",
          path: "/amendments/{id}"
        },
        updated: {
          title: "Amendment Updated",
          path: "/amendments/{id}"
        },
        approved: {
          title: "Amendment Request Approved",
          path: "/amendments/{id}"
        },
        rejected: {
          title: "Amendment Request Rejected",
          path: "/amendments/{id}"
        },
        pending: {
          title: "Amendment Under Review",
          path: "/amendments/{id}"
        },
        completed: {
          title: "Amendment Process Completed",
          path: "/amendments/{id}"
        }
      },
      annual_filing: {
        due: {
          title: "Annual Filing Due",
          path: "/annual-filings/new"
        },
        overdue: {
          title: "Annual Filing Overdue",
          path: "/annual-filings/create"
        },
        submitted: {
          title: "Annual Filing Submitted",
          path: "/annual-filings/{id}"
        },
        approved: {
          title: "Annual Filing Approved",
          path: "/annual-filings/{id}"
        },
        rejected: {
          title: "Annual Filing Rejected",
          path: "/annual-filings/{id}"
        },
        reminder: {
          title: "Annual Filing Reminder",
          path: "/annual-filings/create"
        }
      }
    },
    audit: {
      requested: {
        title: "Audit Request Submitted",
        path: "/audit-requests/{id}"
      },
      scheduled: {
        title: "Audit Scheduled",
        path: "/audit-requests/{id}"
      },
      completed: {
        title: "Audit Completed",
        path: "/audit-requests/{id}"
      },
      approved: {
        title: "Audit Approved",
        path: "/audit-requests/{id}"
      },
      rejected: {
        title: "Audit Rejected",
        path: "/audit-requests/{id}"
      },
      sics_sacs_approved: {
        title: "Audit Approved by SICS/SACS",
        path: "/audit-requests/{id}"
      },
      sics_sacs_rejected: {
        title: "Audit Rejected by SICS/SACS",
        path: "/audit-requests/{id}"
      },
      jics_jacs_approved: {
        title: "Audit Approved by JICS/JACS",
        path: "/audit-requests/{id}"
      },
      jics_jacs_rejected: {
        title: "Audit Rejected by JICS/JACS",
        path: "/audit-requests/{id}"
      },
      registrar_approved: {
        title: "Audit Approved by Registrar",
        path: "/audit-requests/{id}"
      },
      registrar_rejected: {
        title: "Audit Rejected by Registrar",
        path: "/audit-requests/{id}"
      }
    },
    election: {
      requested: {
        title: "Election Request Submitted",
        path: "/election-requests/{id}"
      },
      approved: {
        title: "Election Request Approved",
        path: "/election-requests/{id}"
      },
      rejected: {
        title: "Election Request Rejected",
        path: "/election-requests/{id}"
      },
      scheduled: {
        title: "Election Scheduled",
        path: "/election-requests/{id}"
      },
      updated: {
        title: "Election Request Updated",
        path: "/election-requests/{id}"
      }
    },
    liquidation: {
      requested: {
        title: "Liquidation Request Submitted",
        path: "/liquidations/{id}"
      },
      approved: {
        title: "Liquidation Request Approved",
        path: "/liquidations/{id}"
      },
      rejected: {
        title: "Liquidation Request Rejected",
        path: "/liquidations/{id}"
      },
      completed: {
        title: "Liquidation Process Completed",
        path: "/liquidations/{id}"
      }
    },
    enquiry: {
      created: {
        title: "Enquiry Request Created",
        path: "/inquiries/{id}"
      },
      updated: {
        title: "Enquiry Request Updated",
        path: "/inquiries/{id}"
      },
      completed: {
        title: "Enquiry Request Completed",
        path: "/inquiries/{id}"
      }
    },
    appeal: {
      requested: {
        title: "Appeal Request Submitted",
        path: "/appeals/{id}"
      },
      approved: {
        title: "Appeal Request Approved",
        path: "/appeals/{id}"
      },
      rejected: {
        title: "Appeal Request Rejected",
        path: "/appeals/{id}"
      },
      reviewed: {
        title: "Appeal Reviewed",
        path: "/appeals/{id}"
      }
    },
    annual_general_meeting: {
      created: {
        title: "New Annual General Meeting Submitted",
        path: "/annual-general-meeting/{id}"
      },
    },
    board_of_directors_meeting: {
      created: {
        title: "New BOD Meeting Submitted",
        path: "/board-of-directors-meeting/{id}"
      },
    },
    special_general_board_meeting: {
      created: {
        title: "New Special General Board Meeting Submitted",
        path: "/special-annual-general-meeting/{id}"
      },
    }
  }
} as const;

// Export both ways for maximum compatibility
export { NOTIFICATIONS };
export default NOTIFICATIONS;
