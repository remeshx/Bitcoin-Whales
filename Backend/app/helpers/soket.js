function socketUpdateProgress(socket,step,currPos,finalPos) {
    let progressStatus = {
        'step' : step,
        'currPos' : currPos,
        'finalPos' : finalPos
    }
    socket.emit("UPDATE_STARTUP_PROGRESS", progressStatus);
}

module.exports = {socketUpdateProgress}