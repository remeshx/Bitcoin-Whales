//import {BLOCKS} from '../actions/types';
//import fetchStates from './fetchStates';

const DEFAULT_BLOCK = {
    blockInfo : {
        lastBlockRead: 0,
        lastBlock: 999
    },
    time: '0000-00-00 00:00:00.000'
};


export const blockReducer = (state = DEFAULT_BLOCK, action) => {
    const newState= {...state};
    console.log('blockreducer', state);
    if (action.type=='FETCH_LAST_BLOCK_SUCCESS') {
        console.log('action',action);
         newState.blockInfo = {...action.blockInfo}
    }

    if (action.type=='UPDATE_TIME') {
        newState.time = action.time;
    }
    return newState;
}

export default blockReducer;