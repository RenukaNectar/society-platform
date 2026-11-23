export const ErrorMsg = ({ message }: any) => {
    return (
        <p className="text-red-500 text-xs">{message || 'error'}</p>
    )
}