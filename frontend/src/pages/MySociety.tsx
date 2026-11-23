import { useSelector } from "react-redux";
import { RootState } from "../store";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { getMySociety } from "../lib/data/users/api";
import { getConversionById } from "../lib/data/conversionSociety/api";
import { SocietyDetails } from "../components/details/SocietyDetails";
import { readConvertedSocietyIdentity } from "../utils/conversionIdentity";

export const MySociety = () => {
    const user = useSelector((state: RootState) => state.auth.user);    
    const navigate = useNavigate();
    const [societyData, setSocietyData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchSociety = async () => {
        try {
            setLoading(true);
            const response = await getMySociety();
            const payload = response.data;
            const societyId = payload?.society?.id;
            let next = payload;

            if (societyId) {
                try {
                    const conversionResponse: any = await getConversionById(societyId);
                    const identity = readConvertedSocietyIdentity(
                        conversionResponse?.data?.data,
                    );
                    if (identity.name || identity.address) {
                        next = {
                            ...payload,
                            society: {
                                ...payload.society,
                                ...(identity.name
                                    ? { cooperative_society_name: identity.name }
                                    : {}),
                                ...(identity.address
                                    ? { full_address: identity.address }
                                    : {}),
                            },
                        };
                    }
                } catch {
                    // Society has no conversion yet.
                }
            }

            setSocietyData(next);
        } catch (error) {
            console.error('Error fetching society:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role !== 'applicant') {
            toast.error('You are not authorized to access this page');
            navigate(-1);
        }
    }, [user, navigate]);

    useEffect(() => {
        if (user?.role === 'applicant') {
            fetchSociety();
        }
    }, [user]);

    return <SocietyDetails societyData={societyData} loading={loading} user={user} reload={fetchSociety} />
};