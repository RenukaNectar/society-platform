export const columns = [
    {
        title: "Financial Year"
    },
    {
        title: "Society Name"
    },
    {
        title: "Submitted Date"
    },
    {
        title: "Status"
    },
    {
        title: "Actions"
    }
]

const AnnualReturnTableColumns = (theme: any) => {
    return (
        <tr>
            {columns.map((item: any) => {
                return (
                    <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${theme}:text-gray-400 uppercase tracking-wider`}>
                        {item?.title}
                    </th>
                )
            })}
        </tr>
    )
}

export default AnnualReturnTableColumns