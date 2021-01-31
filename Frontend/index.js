import React from 'react';
import {createStore, compose, applyMiddleware} from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import {render} from 'react-dom';
import Blocks from './src/components/Blocks';
import socketIOClient from "socket.io-client";
import appReducer from './src/reducers';  



const ENDPOINT = 'http://localhost:3231';

const composeEnhancer = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
    appReducer,
    composeEnhancer(applyMiddleware(thunk))
);

const socket = socketIOClient(ENDPOINT);


render(
    <Provider store={store}>
    <div>
        <h2>This is Header</h2>
        <Blocks socket={socket}/>  
    </div>
    </Provider>,
  document.getElementById('root')
);