export const conversionColumns = [
  { title: "Registration Number" },
  { title: "Society Name" },
  { title: "Conversion From" },
  { title: "Conversion To" },
  { title: "Status" },
  { title: "Created At" },
  { title: "Actions" },
];

const ConversionTableColumns = ({ theme }: { theme: string }) => {
  return (
    <tr>
      {conversionColumns.map((item, index) => (
        <th
          key={index}
          className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${theme}:text-gray-400 uppercase tracking-wider`}
        >
          {item.title}
        </th>
      ))}
    </tr>
  );
};

export default ConversionTableColumns;

