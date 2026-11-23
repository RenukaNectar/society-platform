export const columns = [
  {
    title: "Enquiry ID",
    key: "enquiry_id",
    sortable: true
  },
  {
    title: "Applicant",
    key: "applicant_name",
    sortable: true
  },
  {
    title: "Society",
    key: "society_name",
    sortable: true
  },
  {
    title: "Subject/Reason",
    key: "subject_reason",
    sortable: true
  },
  {
    title: "Request Date",
    key: "created_at",
    sortable: true
  },
  {
    title: "Status",
    key: "status",
    sortable: true
  },
  {
    title: "Actions",
    key: "actions",
    sortable: false
  }
];

const EnquiryInspectionTableColums = (theme: any) => {
  return (
    <tr>
      {columns.map((item: any) => {
        return (
          <th 
            key={item.title} 
            className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${theme}:text-gray-400 uppercase tracking-wider ${
              item.sortable ? 'cursor-pointer hover:text-gray-700' : ''
            }`}
          >
            {item?.title}
          </th>
        )
      })}
    </tr>
  )
}

export default EnquiryInspectionTableColums;
