import CooperativeRegistrationsAgriculture from "./CooperativeRegistrationsAgriculture";
import CooperativeRegistrationsProcessing from "./CooperativeRegistrationsProcessing";
import CooperativeRegistrationsConsumer from "./CooperativeRegistrationsConsumer";
import CooperativeRegistrationsCreditThrift from "./CooperativeRegistrationsCreditThrift";
import CooperativeRegistrationsBee from "./CooperativeRegistrationsBee";
import CooperativeRegistrationDairy from "./CooperativeRegistrationDairy";
import CooperativeRegistrationsEducation from "./CooperativeRegistrationsEducation";
import CooperativeRegistrationFarmer from "./CooperativeRegistrationFarmer";
import CooperativeRegistrationFishery from "./CooperativeRegistrationFishery";
import CooperativeRegistrationsHandicraft from "./CooperativeRegistrationsHandicraft";
import CooperativeRegistrationsHandloom from "./CooperativeRegistrationsHandloom";
import CooperativeRegistrationsHousing from "./CooperativeRegistrationsHousing";
import CooperativeRegistrationsJute from "./CooperativeRegistrationsJute";
import CooperativeRegistrationsLabour from "./CooperativeRegistrationsLabour";
import CooperativeRegistrationLargeArea from "./CooperativeRegistrationLargeArea";
import CooperativeRegistrationsLivestock from "./CooperativeRegistrationsLivestock";
import CooperativeRegistrationsMarketing from "./CooperativeRegistrationsMarketing";
import CooperativeRegistrationsCmiscellaneous from "./CooperativeRegistrationsCmiscellaneous";
import CooperativeRegistrationsMiscellaneous from "./CooperativeRegistrationsMiscellaneous";
import CooperativeRegistrationsMulti from "./CooperativeRegistrationsMulti";
import CooperativeRegistrationsPrimary from "./CooperativeRegistrationsPrimary";
import CooperativeRegistrationsSericulture from "./CooperativeRegistrationsSericulture";
import CooperativeRegistrationsSocial from "./CooperativeRegistrationsSocial";
import CooperativeRegistrationsSugar from "./CooperativeRegistrationsSugar";
import CooperativeRegistrationsTourism from "./CooperativeRegistrationsTourism";
import CooperativeRegistrationsTransport from "./CooperativeRegistrationsTransport";
import CooperativeRegistrationsTribal from "./CooperativeRegistrationsTribal";
import CooperativeRegistrationsUcb from "./CooperativeRegistrationsUcb";
import CooperativeRegistrationsWocoop from "./CooperativeRegistrationsWocoop";
import CooperativeRegistrationsKhadiGram from "./CooperativeRegistrationsKhadiGram";

export const CoorporativeMapping = ({ societyType, data, onCancel, onClose, onSubmit }: { societyType: string, data: any, onCancel: () => void, onClose: () => void, onSubmit: (data: any) => void }) => {

    const onCancelModal = () => {
        onCancel();
    }

    const onSubmitCallback = (data: any) => {
        onSubmit(data);
    }

    switch (societyType) {
        case 'cooperative_registrations_agriculture':
            return <CooperativeRegistrationsAgriculture data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        case 'cooperative_registrations_processing':
            return <CooperativeRegistrationsProcessing data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        case 'cooperative_registrations_bee':
            return <CooperativeRegistrationsBee data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        case 'cooperative_registrations_consumer':
            return <CooperativeRegistrationsConsumer data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        case 'cooperative_registrations_credit_thrift':
            return <CooperativeRegistrationsCreditThrift data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        case 'cooperative_registration_dairy':
            return <CooperativeRegistrationDairy data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        case 'cooperative_registrations_education':
            return <CooperativeRegistrationsEducation data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        case 'cooperative_registration_farmer':
            return <CooperativeRegistrationFarmer data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        case 'cooperative_registration_fishery':
            return <CooperativeRegistrationFishery data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        case 'cooperative_registrations_handicraft':
            return <CooperativeRegistrationsHandicraft data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        case 'cooperative_registrations_handloom':
            return <CooperativeRegistrationsHandloom data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        case 'cooperative_registrations_housing':
            return <CooperativeRegistrationsHousing data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        case 'cooperative_registrations_jute':
            return <CooperativeRegistrationsJute data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        case 'cooperative_registrations_labour':
            return <CooperativeRegistrationsLabour data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        case 'cooperative_registration_large_area':
            return <CooperativeRegistrationLargeArea data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        case 'cooperative_registrations_livestock':
            return <CooperativeRegistrationsLivestock data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        case 'cooperative_registrations_marketing':
            return <CooperativeRegistrationsMarketing data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        case 'cooperative_registrations_cmiscellaneous':
            return <CooperativeRegistrationsCmiscellaneous data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        case 'cooperative_registrations_miscellaneous':
            return <CooperativeRegistrationsMiscellaneous data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        case 'cooperative_registrations_multi':
            return <CooperativeRegistrationsMulti data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        case 'cooperative_registration_primary':
            return <CooperativeRegistrationsPrimary data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        case 'cooperative_registrations_sericulture':
            return <CooperativeRegistrationsSericulture data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        case 'cooperative_registrations_social':
            return <CooperativeRegistrationsSocial data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        case 'cooperative_registrations_sugar':
            return <CooperativeRegistrationsSugar data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        case 'cooperative_registrations_tourism':
            return <CooperativeRegistrationsTourism data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        case 'cooperative_registrations_transport':
            return <CooperativeRegistrationsTransport data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        case 'cooperative_registrations_tribal':
            return <CooperativeRegistrationsTribal data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        case 'cooperative_registrations_ucb':
            return <CooperativeRegistrationsUcb data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        case 'cooperative_registrations_wocoop':
            return <CooperativeRegistrationsWocoop data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        case 'cooperative_registrations_khadi_gram':
            return <CooperativeRegistrationsKhadiGram data={data} onCancel={onCancelModal} onClose={onClose} onSubmit={onSubmitCallback} />;
        default:
            return <div>No mapping found</div>;
    }
}