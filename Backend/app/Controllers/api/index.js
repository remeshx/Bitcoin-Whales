const settingModel = require('../../Models/settings');
const BlockChainModel = require('../../Models/blockchain');

class Api {
        static async getRichListStatus() {
                let richlistTbl = await BlockChainModel.getRichListTable(100);
                let getLastBlock = await BlockChainModel.getLastBlockDetail();

                return new Promise((resolve, reject) => {


                        console.log('getLastBlock: ', getLastBlock);
                        let richlist = {
                                'richlisttbl': richlistTbl,
                                'blockInfo': getLastBlock
                        }

                        console.log('getRichListStatus Result: ', richlist);
                        resolve(richlist);
                });
        }

        static getLoadingStatus() {

                return new Promise((resolve, reject) => {
                        let action = global.settings['BitcoinNode_CurrentStage'];
                        // let action = 2;
                        // global.settings['BitcoinNode_LastFileWritten']=2090;

                        console.log('getLoadingStatus : ', action);
                        let step = action;
                        let currPos = 0;
                        let finalPos = 0;

                        switch (action) {
                                case '1':
                                        step = 1;
                                        currPos = global.settings['BitcoinNode_currBlockHeightRead'];
                                        finalPos = global.settings['BitcoinNode_blockCount'];
                                        break;
                                case '2':
                                        step = 2;
                                        currPos = global.settings['BitcoinNode_LastFileWritten'];
                                        finalPos = 4096;
                                        break;
                                case '3':
                                        step = 3;
                                        currPos = global.settings['BitcoinNode_LastFileWritten'];
                                        finalPos = 4096;
                                        break;
                                case '4':
                                        step = 4;
                                        currPos = global.settings['BitcoinNode_LastFileWritten'];
                                        finalPos = 3844;
                                        break;
                                case '5':
                                        step = 5;
                                        currPos = 0;
                                        finalPos = 3844;
                                        break;
                                case '6':
                                        step = 6;
                                        currPos = 0;
                                        finalPos = 3844;
                                        break;
                                case '7':
                                case '10':
                                        step = 7;
                                        currPos = 0;
                                        finalPos = 0;
                                        break;
                        }

                        let progressStatus = {
                                'step': step,
                                'currPos': currPos,
                                'finalPos': finalPos
                        }
                        console.log('getLoadingStatus Result: ', progressStatus);
                        resolve(progressStatus);
                });
        }

}

module.exports = Api;