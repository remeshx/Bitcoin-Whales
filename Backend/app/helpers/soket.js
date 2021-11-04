const BlockChainModel = require('../Models/blockchain');

function socketUpdateProgress(socket, step, currPos, finalPos) {
    let progressStatus = {
        'step': step,
        'currPos': currPos,
        'finalPos': finalPos
    }
    socket.emit("UPDATE_STARTUP_PROGRESS", progressStatus);
}


async function socketUpdateRichListStatus(socket) {

    let richlistTbl = await BlockChainModel.getRichListTable(100);
    let getLastBlock = await BlockChainModel.getLastBlockDetail();

    let richlist = {
        'richlisttbl': richlistTbl,
        'blockInfo': getLastBlock
    }

    socket.emit("UPDATE_RICH_LIST", richlist);
}

module.exports = { socketUpdateProgress, socketUpdateRichListStatus }