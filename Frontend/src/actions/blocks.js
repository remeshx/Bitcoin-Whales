import { Blocks } from './types';
import {URL_GET_LAST_BLOCK} from '../../config'; 

export const fetchBlocks = () => dispatch => {
    fetch(URL_GET_LAST_BLOCK)
        .then(response => response.json())
        .then(json => dispatch({type:'FETCH_LAST_BLOCK_SUCCESS',blockInfo: json}))
        .catch(error=> console.log('error',error));
}

export const updateTime = (time) => dispatch => {

    dispatch({type:'UPDATE_TIME',time: time});
}
