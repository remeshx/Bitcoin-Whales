import React ,{Component,useState} from 'react'; 
import { connect } from 'react-redux';
import fetchBlocks from '../actions/blocks';

class Blocks extends Component {
    state = { lastBlockHeight : this.props.initblock }

    componentDidMount(){
        //this.updateState();
    }

    updateState(){
        this.props.fetchBlocks();
        console.log(this.props);
    }

    render() {
        console.log(this.props);
        return(
            <div>
                <button onClick={()=> this.updateState()}>Inc</button>
                <p>Last Block Read : {this.props.blockInfo.lastBlockRead}</p>
                <p>Last Block Mined : {this.props.blockInfo.lastBlock}</p>
            </div>
         );
    }

}

const mapStateToProps = state => {
    const blockInfo = state.blockInfo;
    return {blockInfo};
}

const componentConnector = connect(mapStateToProps,{fetchBlocks});

export default componentConnector(Blocks);