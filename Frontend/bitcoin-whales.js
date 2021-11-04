import React from 'react';
import { createStore, compose, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import { render } from 'react-dom';
import Whales from './src/components/Whales';
import socketIOClient from "socket.io-client";
import appReducer from './src/reducers';
import ENDPOINT from './config';

const composeEnhancer = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
    appReducer,
    composeEnhancer(applyMiddleware(thunk))
);

const socket = socketIOClient(ENDPOINT);
var progressForTheFirstTime = true;

render(
    <Provider store={store}>
        <div>
            <Whales socket={socket} />
        </div>
    </Provider>,
    document.getElementById('root')
);