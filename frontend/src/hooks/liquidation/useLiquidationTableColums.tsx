export const columns = [
    {
        title: "Society"
    },
    {
        title: "Society Type"
    },
    {
        title: "Liquidation Mode"
    },
    {
        title: "Order Date"
    },
    {
        title: "Status"
    },
    {
        title: "Submitted On"
    },
    {
        title: "Actions"
    }
]

const LiquidationTableColums = (theme: any) => {
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

export default LiquidationTableColums