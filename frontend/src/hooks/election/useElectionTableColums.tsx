export const columns = [
    {
        title: "Society"
    },
    {
        title: "Reason"
    },
    {
        title: "Proposed Date"
    },
    {
        title: "Status"
    },
    {
        title: "Submitted"
    },
    {
        title: "Actions"
    }
]

const ElectionTableColums = (theme: any) => {
    return (
        <tr>
            {columns.map((item: any, index: number) => {
                return (
                    <th key={index} className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${theme}:text-gray-400 uppercase tracking-wider`}>
                        {item?.title}
                    </th>
                )
            })}
        </tr>
    )
}

export default ElectionTableColums