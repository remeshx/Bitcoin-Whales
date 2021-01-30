import React ,{Component} from 'react'; 
import socketIOClient from "socket.io-client";

const ENDPOINT = 'http://localhost:3231';
class Socket extends Component {
    state = { time: '-' }

    componentDidMount(){
         //Very simply connect to the socket
         const socket = socketIOClient(ENDPOINT);
         //Listen for data on the "outgoing data" namespace and supply a callback for what to do when we get one. In this case, we set a state variable
         socket.on("FromAPI", data => {
            console.log('data',data.time);
             this.setState({time: data.time})
         });
         
    }

    render() {
        const {response} = this.state;
        return(
            <div>
                <p>time is : {this.state.time}</p>
            </div>
         );
    }

}

export default Socket;