import React ,{Component,useState} from 'react'; 
import { connect } from 'react-redux';
import {fetchBlocks,updateTime,updateTrxInfo,updateBlkInfo} from '../actions/blocks';

class Blocks extends Component {
    componentDidMount(){
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
        
        return(
            <div>
                <p>Last Block Mined : {this.props.blockInfo.lastBlock}</p>
                <p>Last Block Read : {this.props.blockInfo.lastBlockRead}</p>
                <p>current Block Trx Count : {this.props.trxInfo.trxCount}</p>
                <p>current Block Trx Read : {this.props.trxInfo.trxRead}</p>
            </div>
         );
    }

}

const mapStateToProps = state => {
    const blockInfo = state.blockInfo;
    const trxInfo = state.trxInfo;
    const time = state.time;
    return {blockInfo,time,trxInfo};
}

const componentConnector = connect(mapStateToProps,{fetchBlocks,updateTime,updateTrxInfo,updateBlkInfo});

export default componentConnector(Blocks);