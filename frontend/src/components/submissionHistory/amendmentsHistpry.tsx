import moment from "moment";
import { Card } from "../ui/Card";
import { getStatusColor } from "../../utils/getStatusByKey";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { Button } from "../ui/Button";
import { useNavigate } from "react-router-dom";

export const AmendmentsHistory = ({ history, loading }: { history: any, loading: boolean }) => {

    const { mode } = useSelector((state: RootState) => state.theme);
    const navigate = useNavigate();
    if(history.length <= 1) {
        return null;
    }

    return (
        <Card className="p-4 mt-3 pb-0">
            <h1 className='text-lg font-semibold mb-3'>Amendments History</h1>
            {loading ? <div>Loading...</div> : <div>
                {history.map((item: any) => (
                    <div key={item.id}>
                        <div className="flex items-center justify-between mb-2 border-b border-gray-200 pb-2">
                            <div>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status?.title || item.status?.key, mode)}`}>{item.status?.title || item.status?.key}</span>
                                <div className="">
                                    <h3>Chief Promoter Name: {item.chairperson_name || '-'} {item.chairperson_contact ? `(${item.chairperson_contact})` : ''}</h3>
                                </div>
                            </div>
                            <div className="text-right gap-2">
                                <Button variant="outline" size="sm" onClick={() => navigate(`/amendments/${item.id}`)}>View</Button>
                                <p>{moment(item.created_at).format('MMM DD, YYYY hh:mm a')}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>}
        </Card>
    );
};
