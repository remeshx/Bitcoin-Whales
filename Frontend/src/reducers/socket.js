
const DEFAULT_STATUS = {
    socketStatus: 'Connecting...',
    socketStatusCol: 'badge-warning'
};


export const socketReducer = (state = DEFAULT_STATUS, action) => {
    const newState = { ...state };

    if (action.type == 'UPDAT_SOCKET_STATUS') {
        newState.socketStatus = action.socket.socketStatus;
        if (action.socket.socketStatus=='connected') newState.socketStatusCol='badge-success';
        else newState.socketStatusCol='badge-warning';
    }

    return newState;
}

export default socketReducer;