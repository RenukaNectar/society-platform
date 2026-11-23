import { api } from "../../api";

    
export const getBodList = async (society_id: string,module_name:string): Promise<any> => {
  console.log("id:",society_id);
  
  const response = await api.get(`/members/bod/${society_id}`, {
    module_name
  });
 
 
  return response;
};

export const verifyBodOtp = async (
  members_id: string,
  society_id: string,
  otp: string,
  module_name:string
  
): Promise<any> => {
  const response = await api.post(`/members/bod/verify-otp`, {
    members_id,
    society_id,
    otp,
    module_name

  });

  return response;
};



export const sendBodOtp = async (members_id: string, society_id: string,module_name:string) => {
  const response = await api.post(`/members/bod/send-otp`, {
    members_id,
    society_id,
    module_name
  });

  return response;
};
