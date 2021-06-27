import blocksReducer from './blocks';
import richlistReducer from './whales';
import socketReducer from './socket';
import { combineReducers } from 'redux';

export default combineReducers({ blocksReducer, richlistReducer, socketReducer });
// export default blocksReducer;