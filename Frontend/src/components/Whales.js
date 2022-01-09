import React, { Component, useState } from 'react';
import { connect } from 'react-redux';
import { fetchRichListStatus, updateRichList } from '../actions/richlist';
import { updateSocketStatus } from '../actions/socket';

class Whales extends Component {
    componentDidMount() {

        console.log('componentDidMount');
        this.props.fetchRichListStatus();

        console.log(this.props.socket);
        this.props.socket.on("UPDATE_RICH_LIST", data => {
            this.props.updateRichList(data);
            this.props.updateSocketStatus({ 'socketStatus': 'connected' });
            console.log('connected');
        });

        this.props.socket.on("disconnect", data => {
            this.props.updateSocketStatus({ 'socketStatus': 'connecting...' });
            console.log('disconnect');
        });

        this.props.socket.on("connect", data => {
            this.props.updateSocketStatus({ 'socketStatus': 'connected' });
            console.log('connected');
        });
    }

    render() {
        let counter = 0;
        const richTBL = this.props.richlist.map(function (rich) {
            counter++;
            return (<TblRow key={rich.address} rich={rich} counter={counter} />);
        });


        return (
            <div class="layout-wrapper layout-1 layout-without-sidenav">
                <div class="layout-inner">

                    <div class="layout-container">
                        <div class="layout-content">
                            <div class="container flex-grow-1 container-p-y">

                                <div class="card mb-4">
                                    <h4 class="card-header bg-warning">
                                        <i class="ion ion-logo-bitcoin bg-warning"></i>
                                        Bitcoin Whales
                                    </h4>
                                    <div class="card-body">

                                        <p class="card-text">
                                            This table shows the most richest addresses of Bitcoin (BTC/XBT) blockchain and will update automatically when ever a new block mines.
                                        </p>
                                        <p class="card-text">
                                            <small class="text-muted">Last block mined :  {this.props.blockInfo.lastBlockHeight} <br />
                                                Last block time : {new Date(this.props.blockInfo.lastBlockTime).toLocaleString('en-GB', { timeZone: 'UTC' })}<br />
                                                Socket status : <span className={`badge ${this.props.socketStatusCol}`}> {this.props.socketStatus} </span>
                                            </small>
                                        </p>
                                    </div>
                                </div>



                                <small>
                                    <div class="card mb-4">
                                        <h6 class="card-header">
                                            Top 100 Richest Bitcoin Addresses

                                        </h6>
                                        <div class="card-datatable table-responsive p-4">
                                            <table class="datatables-demo table table-striped table-bordered" id="richest">
                                                <thead>
                                                    <tr>
                                                        <th>No.</th>
                                                        <th>BTC Address</th>
                                                        <th>Blance</th>
                                                        <th>First Input</th>
                                                        <th>Last Update</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {richTBL}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </small>


                                <p class="text-muted p-2">
                                    <small>
                                        This application has published online and is completely open source.<br />
                                        It uses following technologies : NodeJS, Express.js, ReactJs, Redux, Socket.io, PostgreSQL <br />
                                        You can find the source on <a href="https://github.com/remeshx/Bitcoin-Whales">https://github.com/remeshx/Bitcoin-Whales</a><br />

                                        If you like it you can donate me with your beutiful Bitcoins at : bc1qyu5ucpt3626z68xqre740lna4nu38t2w4xjuhz<br />
                                        If you own one of the above addresses, lucky you :)<br />
                                        <br />
                                        Author : Reza Zavi @ 2020
                                    </small>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        );
    }

}



class TblRow extends React.Component {
    render() {

        return (
            <tr className="eachRow">
                <td>{this.props.counter}</td>
                <td>{this.props.rich.address}</td>
                <td>{this.props.rich.balance}</td>
                <td>{new Date(this.props.rich.created_at).toLocaleString('en-GB', { timeZone: 'UTC' })}</td>
                <td>{new Date(this.props.rich.updated_at).toLocaleString('en-GB', { timeZone: 'UTC' })}</td>
            </tr>
        );

    }

}

const mapStateToProps = state => {
    const blockInfo = state.richlistReducer.blockInfo;
    const richlist = state.richlistReducer.richlist;
    const socketStatus = state.socketReducer.socketStatus;
    const socketStatusCol = state.socketReducer.socketStatusCol;
    return { blockInfo, richlist, socketStatus, socketStatusCol };
}

const componentConnector = connect(mapStateToProps, { fetchRichListStatus, updateRichList, updateSocketStatus });

export default componentConnector(Whales);