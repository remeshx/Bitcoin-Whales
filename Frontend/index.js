import React from 'react';
import { createStore, compose, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import { render } from 'react-dom';
import socketIOClient from "socket.io-client";
import appReducer from './src/reducers';
import { ENDPOINT } from './config';
import Blocks from './src/components/Blocks';
import Whales from './src/components/Whales';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link, useRoutes
} from "react-router-dom";

const composeEnhancer = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
    appReducer,
    composeEnhancer(applyMiddleware(thunk))
);

console.log('ENDPOINT', ENDPOINT);
const socket = socketIOClient(ENDPOINT);
var progressForTheFirstTime = true;

const App = () => {
    let routes = useRoutes([
        { path: "/", element: <Blocks socket={socket} /> },
        { path: "/whales", element: <Whales socket={socket} /> }
    ]);
    return routes;
};

render(

    <Provider store={store}>
        <Router>
            <App />
        </Router>
    </Provider>
    ,
    document.getElementById('root')
);