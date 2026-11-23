export const columns = [
  {
    title: "Society Name"
  },
  {
    title: "Meeting Date"
  },
  {
    title: "Status"
  },
  {
    title: "Created At"
  },
  {
    title: "Created By"
  },
  {
    title: "Action"
  }
]

const SpecialAnnualGeneralMeetingTableColumns = (theme: any) => {
  return (
    <tr>
      {columns.map((item: any, index: number) => {
        return (
          <th key={index} className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${theme === 'dark' ? 'text-gray-400' : ''} uppercase tracking-wider`}>
            {item?.title}
          </th>
        )
      })}
    </tr>
  )
}

export default SpecialAnnualGeneralMeetingTableColumns
