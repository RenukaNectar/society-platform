export const columns = [
    {
        title: "Registration Number"
    },
    {
        title: "NCD ID"
    },
    {
        title: "Society Name"
    },
    {
        title: "Functional Status"
    },
    {
        title: "Area of Operation"
    },
    {
        title: 'Reference Year'
    },
    {
        title: "Status"
    },
    {
        title: "Created At"
    },
    {
        title: "Actions"
    }
]

const RegistrationTableColumns = (theme: any) => {
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

export default RegistrationTableColumns