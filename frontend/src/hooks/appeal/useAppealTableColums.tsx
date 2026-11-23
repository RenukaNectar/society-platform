export const columns = [
  {
    title: "Appeal ID",
    key: "appeal_id",
    sortable: true
  },
  {
    title: "Appellant",
    key: "appellant_name",
    sortable: true
  },
  {
    title: "Type",
    key: "appellant_type",
    sortable: true
  },
  {
    title: "Order Details",
    key: "order_type",
    sortable: true
  },
  {
    title: "Filing Date",
    key: "filing_date",
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

const AppealTableColums = (theme: any) => {
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

export default AppealTableColums;