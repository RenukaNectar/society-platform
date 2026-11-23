export const societyRegistrations = [
    {
        id: "skhfkd",
        applicationId: "APP-1001",
        societyName: "Green Valley Cooperative",
        mobileNumber: "9876543210",
        typeOfSociety: "Housing",
        status: "Pending",
        createdAt: "2025-06-01",
        actions: "View",
        isActive: '1'
    },
    {
        id: "skhfkd",
        applicationId: "APP-1002",
        societyName: "Blue Ocean Welfare",
        mobileNumber: "9123456780",
        typeOfSociety: "Welfare",
        status: "Approved",
        createdAt: "2025-06-02",
        actions: "View",
        isActive: '1'
    },
    {
        id: "skhfkd",
        applicationId: "APP-1003",
        societyName: "Sunshine Educational Trust",
        mobileNumber: "9988776655",
        typeOfSociety: "Educational",
        status: "Rejected",
        createdAt: "2025-06-03",
        actions: "View",
        isActive: '1'
    },
    {
        id: "skhfkd",
        applicationId: "APP-1004",
        societyName: "Tech Innovators Cooperative",
        mobileNumber: "9001122334",
        typeOfSociety: "Industrial",
        status: "Under Review",
        createdAt: "2025-06-04",
        actions: "View",
        isActive: '1'
    },
    {
        id: "skhfkd",
        applicationId: "APP-1005",
        societyName: "Unity Farmers Group",
        mobileNumber: "9812345678",
        typeOfSociety: "Agricultural",
        status: "Approved",
        createdAt: "2025-06-05",
        actions: "View",
        isActive: '1'
    },
    {
        id: "skhfkd",
        applicationId: "APP-1006",
        societyName: "Eco Builders Cooperative",
        mobileNumber: "9823445566",
        typeOfSociety: "Construction",
        status: "Pending",
        createdAt: "2025-06-06",
        actions: "View",
        isActive: '1'
    },
    {
        id: "skhfkd",
        applicationId: "APP-1007",
        societyName: "Rising Stars Education",
        mobileNumber: "9898989898",
        typeOfSociety: "Educational",
        status: "Approved",
        createdAt: "2025-06-07",
        actions: "View",
        isActive: '1'
    },
    {
        id: "skhfkd",
        applicationId: "APP-1008",
        societyName: "Healthy Living Group",
        mobileNumber: "9000000001",
        typeOfSociety: "Welfare",
        status: "Rejected",
        createdAt: "2025-06-08",
        actions: "View",
        isActive: '1'
    }
];

export const registrationTempData = {
    status: 200,
    pagination: {
        limit: 10,
        from: 0,
        to: 10,
        total: societyRegistrations.length
    },
    data: societyRegistrations
}