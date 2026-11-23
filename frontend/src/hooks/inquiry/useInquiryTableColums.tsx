export const columns = [
    {
        title: "Inspection ID"
    },
    {
        title: "Society Name"
    },
    {
        title: "Type"
    },
    {
        title: "Inspection Date"
    },
    {
        title: "Inspector Name"
    },
    {
        title: "Status"
    },
    {
        title: "Actions"
    }
]

const InquiryTableColums = (theme: any) => {
    return (
        <tr>
            {columns.map((item: any) => {
                return (
                    <th key={item.title} className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${theme}:text-gray-400 uppercase tracking-wider`}>
                        {item?.title}
                    </th>
                )
            })}
        </tr>
    )
}

export default InquiryTableColums