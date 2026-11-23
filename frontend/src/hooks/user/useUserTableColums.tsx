export const columns = [
    {
        title: "#"
    },
    {
        title: "User Name"
    },
    {
        title: "Mobile Number"
    },
    {
        title: "Email"
    },
    {
        title: "Role"
    },
    {
        title: "H.O."
    },
    {
        title: "State"
    },
    {
        title: "District"
    },
    {
        title: "Created At"
    },
    {
        title: "Actions"
    }
]

const UserTableColumns = (theme: any) => {
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

export default UserTableColumns