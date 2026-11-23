export const columns = [
    {
        title: "Society"
    },
    {
        title: "Chief Promoter Name"
    },
    {
        title: "Chief Promoter Contact"
    },
    {
        title: "Meeting Date"
    },
    {
        title: "Notice Days"
    },
    {
        title: "Total Promoters"
    },
    {
        title: "Quorum Required"
    },
    {
        title: "Promoters Present"
    },
    {
        title: "Votes in Favor"
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

const AmendmentTableColumns = (theme: any) => {
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

export default AmendmentTableColumns