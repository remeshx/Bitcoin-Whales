import React ,{Component,useState} from 'react'; 
import { connect } from 'react-redux';
import {fetchBlocks,updateTime,updateTrxInfo,updateBlkInfo} from '../actions/blocks';
import {fetchProgressStatus} from '../actions/progress';

class Blocks extends Component {
    componentDidMount(){
        console.log('componentDidMount');
        this.props.fetchProgressStatus();

        this.props.socket.on("UPDATE_BLK", data => {
            this.updateState(data);
         });

         this.props.socket.on("UPDATE_TRX", data => {
             this.updateTrxState(data);
         });
    }

    updateState(data){
        this.props.updateBlkInfo(data);
    }

    updateTrxState(data){
        this.props.updateTrxInfo(data);
     }
    

    render() {
     
        console.log('rebder');
        return(
            
<div class="layout-wrapper layout-1 layout-without-sidenav">
    <div class="layout-inner">
       
        <div class="layout-container">
            <div class="layout-content">
                <div class="container flex-grow-1 container-p-y">
            
        
                    <div class="col-xl-12 col-md-12 px-0">
                        <div class="card ui-timeline mb-4">
                            <h5 class="card-header">Loading For The First Time ...</h5>
                            <div class="card-body">
                                <div class="timelines-box">
                                    <div class="row pt-3 pb-4">
                                        <div class="col-auto text-right update-meta">
                                            <p class="text-muted mb-0 d-inline">STEP 1</p>
                                            <i className={`ion ${this.props.progress.step1_icon_class} update-icon`}></i>
                                        </div>
                                        <div class="col">
                                            <h6 class="mb-1">Anylyzing Bitcoin Blockchain</h6>
                                            <p class="text-muted mb-2">{this.props.progress.step1_status}</p>
                                            <div class="progress">
                                                <div class="progress-bar bg-warning" style={{width: `${this.props.progress.step1_progress}%`}}></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row pb-4">
                                        <div class="col-auto text-right update-meta">
                                            <p class="text-muted mb-0 d-inline">STEP 2</p>
                                            <i className={`ion ${this.props.progress.step2_icon_class} update-icon`}></i>
                                        </div>
                                        <div class="col">
                                            <h6 class="mb-1">Writing Transactions To Database</h6>
                                            <p class="text-muted mb-0">{this.props.trxInfo.trxRead}/{this.props.trxInfo.trxCount}</p>
                                            <div class="progress">
                                                <div class="progress-bar bg-warning" style={{width: `${this.props.progress.step2_progress}%`}}></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row pb-4">
                                        <div class="col-auto text-right update-meta">
                                            <p class="text-muted mb-0 d-inline">STEP 3</p>
                                            <i className={`ion ${this.props.progress.step3_icon_class} update-icon`}></i>
                                        </div>
                                        <div class="col">
                                            <h6 class="mb-1">Finding Spent Transactions</h6>
                                            <p class="text-muted mb-0">Not Started</p>
                                            <div class="progress">
                                            <div class="progress-bar bg-warning" style={{width: `${this.props.progress.step3_progress}%`}}></div>
                                        </div>
                                        </div>
                                    </div>
                                    <div class="row p-b-0">
                                        <div class="col-auto text-right update-meta">
                                            <p class="text-muted mb-0 d-inline">STEP 4</p>
                                            <i className={`ion ${this.props.progress.step4_icon_class} update-icon`}></i>
                                        </div>
                                        <div class="col">
                                            <h6 class="mb-1">Generating Address Tables</h6>
                                            <p class="text-muted mb-2">Not Started</p>
                                            <div class="progress">
                                                <div class="progress-bar bg-warning" style={{width: `${this.props.progress.step4_progress}%`}}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
);
    }

}

const mapStateToProps = state => {
    const blockInfo = state.blockInfo;
    const trxInfo = state.trxInfo;
    const progress = state.progress;
    const time = state.time;
    return {blockInfo,time,trxInfo,progress};
}

const componentConnector = connect(mapStateToProps,{fetchBlocks,updateTime,updateTrxInfo,updateBlkInfo,fetchProgressStatus});

export default componentConnector(Blocks);