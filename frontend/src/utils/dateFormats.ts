import moment from 'moment';

export const formatCalenderDate = (date: string) => {
    return moment(date).format('DD MMM, YYYY h:mm A');
}