import React from 'react';
import { createStore, compose, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import { render } from 'react-dom';
import Blocks from './src/components/Blocks';
import socketIOClient from "socket.io-client";
import appReducer from './src/reducers';
import { ENDPOINT } from './config';
import Whales from './src/components/Whales';

import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link
} from "react-router-dom";

const composeEnhancer = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
    appReducer,
    composeEnhancer(applyMiddleware(thunk))
);

console.log('ENDPOINT', ENDPOINT);
const socket = socketIOClient(ENDPOINT);
var progressForTheFirstTime = true;

render(
    <Provider store={store}>
        <Router>
            <div>
                <Switch>
                    <Route exact path="/">
                        <Blocks socket={socket} />
                    </Route>
                    <Route path="/whales">
                        <Whales socket={socket} />
                    </Route>
                </Switch>
            </div>
        </Router>
    </Provider>,
    document.getElementById('root')
);