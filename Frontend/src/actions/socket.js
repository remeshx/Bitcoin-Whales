

export const updateSocketStatus = (data) => dispatch => {
    dispatch({ type: 'UPDAT_SOCKET_STATUS', socket: data });
}


