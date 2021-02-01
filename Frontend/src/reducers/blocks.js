//import {BLOCKS} from '../actions/types';
//import fetchStates from './fetchStates';

const DEFAULT_BLOCK = {
    blockInfo : {
        lastBlockRead: 0,
        lastBlock: 999
    },
    trxInfo : {
        trxCount : 0,
        trxRead : 0
    },
    time: '0000-00-00 00:00:00.000'
};


export const blockReducer = (state = DEFAULT_BLOCK, action) => {
    const newState= {...state};
    
    //console.log('blockreducer', state);
    if (action.type=='UPDATE_BLK') {
        //console.log('action',action);
         newState.blockInfo = {...action.blockInfo}
         newState.trxInfo = {...DEFAULT_BLOCK.trxInfo}
    }

    if (action.type=='UPDATE_TIME') {
        newState.time = action.time;
    }

    console.log('action.type', action.type);
    if (action.type=='UPDATE_TRX') {
        //console.log('action.trxInfo', action.trxInfo);
        newState.trxInfo = {...action.trxInfo}
    }

    return newState;
}

export default blockReducer;