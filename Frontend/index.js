import React from 'react';
import {createStore, compose, applyMiddleware} from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import {render} from 'react-dom';
import Blocks from './src/components/Blocks';
import Socket from './src/socket';
import appReducer from './src/reducers';  




let initBlock = 50; 

const composeEnhancer = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
    appReducer,
    composeEnhancer(applyMiddleware(thunk))
);




render(
    <Provider store={store}>
    <div>
        <h2>This is Header</h2>      
        <Socket />  
        <Blocks />  
    </div>
    </Provider>,
  document.getElementById('root')
);