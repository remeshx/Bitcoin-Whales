import { Blocks } from './types';
import { URL_RICHLIST_STATUS } from '../../config';

export const fetchRichListStatus = () => dispatch => {
    console.log('fetchRichListStatus');
    fetch(URL_RICHLIST_STATUS)
        .then(response => response.json())
        .then(json => dispatch({ type: 'FETCH_RICHLIST_STATUS', richlist: json }))
        .catch(error => console.log('error', error));
}


export const updateRichList = (data) => dispatch => {
    dispatch({ type: 'FETCH_RICHLIST_STATUS', richlist: data });
}

export const updateSocketStatus = (data) => dispatch => {
    dispatch({ type: 'UPDAT_SOCKET_STATUS', richlist: data });
}


