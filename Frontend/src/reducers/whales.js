//import {BLOCKS} from '../actions/types';
//import fetchStates from './fetchStates';

const DEFAULT_LIST = {
    blockInfo: {
        lastBlockHeight: 0,
        lastBlockTime: 0
    },
    richlist: [
        {
            'address': '...',
            'balance': '...',
            'created_at': '...',
            'updated_at': '...',
        }
    ],
    socketStatus: 'Connecting...'
};


export const richlistReducer = (state = DEFAULT_LIST, action) => {
    const newState = { ...state };
    console.log(action.richlist);
    if (action.type == 'FETCH_RICHLIST_STATUS') {
        newState.blockInfo = { ...action.richlist.blockInfo }
        newState.richlist = action.richlist.richlisttbl
    }

    

    return newState;
}

export default richlistReducer;