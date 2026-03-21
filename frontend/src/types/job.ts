export type JobStatus = 
| 'pending'
| 'running'
| 'completed'
| 'failed'
| 'cancelled';



export const getStatusColor = (status:JobStatus):string => {
      switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'running':
      return 'bg-yellow-100 text-yellow-800';
    case 'pending':
      return 'bg-gray-100 text-gray-800';
    case 'cancelled':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusLabel = (status:JobStatus):string => {
      return status.charAt(0).toUpperCase() + status.slice(1);
};