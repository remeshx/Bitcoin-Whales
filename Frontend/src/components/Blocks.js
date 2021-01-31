import React ,{Component,useState} from 'react'; 
import { connect } from 'react-redux';
import {fetchBlocks,updateTime} from '../actions/blocks';

class Blocks extends Component {
    componentDidMount(){
        this.props.socket.on("FromAPI", data => {
            this.props.updateTime(data.time);
         });
    }

    updateState(){
        this.props.fetchBlocks();
        console.log(this.props);
    }

    render() {
        console.log(this.props);
        this.props.socket.on()
        return(
            <div>
                <p>Time is : {this.props.time}</p>
                <button onClick={()=> this.updateState()}>Inc</button>
                <p>Last Block Read : {this.props.blockInfo.lastBlockRead}</p>
                <p>Last Block Mined : {this.props.blockInfo.lastBlock}</p>
            </div>
         );
    }

}

const mapStateToProps = state => {
    const blockInfo = state.blockInfo;
    const time = state.time;
    return {blockInfo,time};
}

const componentConnector = connect(mapStateToProps,{fetchBlocks,updateTime});

export default componentConnector(Blocks);