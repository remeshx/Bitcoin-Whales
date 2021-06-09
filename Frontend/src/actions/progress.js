import { Blocks } from './types';
import {URL_PROGRESS_STATUS} from '../../config'; 

export const fetchProgressStatus = () => dispatch => {
    console.log('fetchProgressStatus');
    fetch(URL_PROGRESS_STATUS)
        .then(response => response.json())
        .then(json => dispatch({type:'FETCH_PROGRESS_STATUS',progress: json}))
        .catch(error=> console.log('error',error));
}

export const updateTime = (time) => dispatch => {

    dispatch({type:'UPDATE_TIME',time: time});
}

export const updateTrxInfo = (data) => dispatch => {
    dispatch({type:'UPDATE_TRX',trxInfo: data} );
}

export const updateBlkInfo = (data) => dispatch => {
    dispatch({type:'UPDATE_BLK',blockInfo: data} );
}


