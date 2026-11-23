export const columns = [
  {
    title: "Society Name",
  },
  {
    title: "Meeting Date",
  },
  {
    title: "Chairman Name",
  },
  {
    title: "Total Shareholders",
  },
  {
    title: "Attended Shareholders",
  },
  {
    title: "Status",
  },
  {
    title: "Approved Document",
  },
  {
    title: "Created By",
  },
  {
    title: "Action",
  },
];

const AnnualGeneralMeetingTableColumns = (theme: any) => {
  return (
    <tr>
      {columns.map((item: any, index: number) => {
        return (
          <th
            key={index}
            className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${theme === "dark" ? "text-gray-400" : ""} uppercase tracking-wider`}
          >
            {item?.title}
          </th>
        );
      })}
    </tr>
  );
};

export default AnnualGeneralMeetingTableColumns;
