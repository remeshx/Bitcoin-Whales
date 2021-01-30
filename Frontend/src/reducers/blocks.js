//import {BLOCKS} from '../actions/types';
//import fetchStates from './fetchStates';

const DEFAULT_BLOCK = {
    blockInfo : {
        lastBlockRead: 0,
        lastBlock: 999
    }
    
};


export const blockReducer = (state = DEFAULT_BLOCK, action) => {
    const newState= {...state};
    console.log('blockreducer', state);
    if (action.type=='FETCH_LAST_BLOCK_SUCCESS') {
        console.log('action',action);
         newState.blockInfo = {...action.blockInfo}
    }
    return newState;
}

export default blockReducer;