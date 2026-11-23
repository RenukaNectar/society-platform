import { store } from "../store"

export const getStatusByKey = (key: string) => {
  const data = store.getState()
  const foundStatus = data?.statuses?.statuses?.filter((item) => item?.key == key)
  return foundStatus?.length ? foundStatus[0]?.id : null
}

export const getStatusColor = (role: string, mode: string) => {
  switch (role) {
    case 'Under Review':
    case 'challan_uploaded':
    case 'resubmit':
    case 'Challan Uploaded':
      return `bg-purple-100 text-purple-800 ${mode}:bg-purple-900 ${mode}:text-purple-200`;
    case 'Rejected':
    case 'Returned':
    case 'Return / Re-View':
    case 'return / re-view':
    case 'Registrar Rejected':
    case 'Inspector Rejected':
    case 'rejected':
    case 'returned':
      return `bg-red-100 text-red-800 ${mode}:bg-red-900 ${mode}:text-red-200`;
    case 'registrar_rejected':
      return `bg-red-100 text-red-800 ${mode}:bg-red-900 ${mode}:text-red-200`;
    case 'Approved':
    case 'approved':
    case 'Submitted':
    case 'Registrar Approved':
    case 'Inspector Approved':
    case 'certificate_issued':
    case 'Certificate Issued':
      return `bg-green-100 text-green-800 ${mode}:bg-green-900 ${mode}:text-green-200`;
    case 'Pending':
    case 'pending':
    case 'challan_pending':
    case 'Re-Submit':
      return `bg-amber-100 text-amber-800 ${mode}:bg-amber-900 ${mode}:text-amber-200`;
    case 'forwarded':
    case 'Forwarded':
    case 'submitted':
    case 'Submitted':
      return `bg-blue-100 text-blue-800 ${mode}:bg-blue-900 ${mode}:text-blue-200`;
    default:
      return `bg-gray-100 text-gray-800 ${mode}:bg-gray-900 ${mode}:text-gray-200`;
  }
};