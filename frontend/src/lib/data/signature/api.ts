import { api } from "../../../lib/api";

// Upload Signature
export const uploadSignature = async (mediaId: string) => {
  return api.post("/users/upload-signature", {
    signature_media_id: mediaId,
  });
};
