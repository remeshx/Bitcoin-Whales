const { getBlockByHeight, gettransaction, deriveaddresses, getLastBlock } = require('../helpers/btcnode');
const BlockChainModel = require('../Models/blockchain');

class Blockchain {

    static getLastBlockHeight() {

        return new Promise((resolve, reject) => {
            settingModel.loadSetting('BlockChain', 'LastBlockHeightRead')
                .then(() => {
                    const msg = 'LastBlockHeightRead is ' + global.settings['LastBlockHeightRead'];
                    resolve({ 'message': msg });
                }).catch(error => reject(error));

        });
    }

    static async getLastBlock(socket) {
        let blockCount = await getLastBlock();
        return {
            lastBlockRead: global.settings['BitcoinNode_LastBlockHeightRead'],
            lastBlock: blockCount
        }
    }


    static getCoinBaseRewardByBlockHeight(blockHeight) {

        const a = Math.floor(blockHeight / 210000);
        let blockReward = 50;
        for (let i = 1; i <= a; i++) {
            blockReward = blockReward / 2;
        }
        return blockReward;
    }

    static async getVInDetails(txid, vout, vinDetails) {
        // console.log('txid',txid);    
        // console.log('vout',vout); 
        let found = true;
        let txkey = await BlockChainModel.getTransactionKey(txid);
        let addDetail = '';
        let address = '';
        let value = 0;
        //console.log('txkey',txkey);    
        if (txkey != '') {
            addDetail = await BlockChainModel.getAddressKey(txkey, vout);

            //console.log('addDetail',addDetail);   
            if (addDetail != '') {
                address = await BlockChainModel.getAddressFromKey(addDetail.id);
            } else found = false;
        } else found = false;

        if (found && address != '') {
            //console.log('address',address);    
            vinDetails.push({
                vinAddress: address,
                vinValue: addDetail.amount
            });
        } else {
            //console.log('gettransaction txid :', txid);
            let tx = await gettransaction(txid);
            if (tx) {
                const address = await this.getAddressFromVOUT(tx.result.vout[vout]);
                if (address == 'errorAddress') {
                    console.log('error TRX', txid);
                }
                value = tx.result.vout[vout].value;
                let found = false;

                let counter = 0;
                for (const vinDetail of vinDetails) {
                    if (vinDetail.vinAddress == address) {
                        vinDetails[counter].vinValue += value;
                        found = true;
                    }
                    counter++;
                }
            }
            if (!found)
                vinDetails.push({
                    vinAddress: address,
                    vinValue: value
                });
        }

        return true;
    }

    static async getVInAddress(txid, vout) {
        console.log('gettransaction txid :', txid);
        let tx = await gettransaction(txid);
        if (tx) {
            const address = await this.getAddressFromVOUT(tx.result.vout[vout]);
            if (address == 'errorAddress') {
                console.log('error TRX', txid);
                return '';
            }
            return address;
        }
        return '';
    }



    static async getAddressFromVOUT(vout) {
        let address = '';
        let hex = '';
        let type = '';
        if (vout.scriptPubKey.addresses) {
            if (vout.scriptPubKey.addresses.length > 1) {
                return 'errorAddress';
            }
            address = vout.scriptPubKey.addresses[0];
        } else {
            hex = vout.scriptPubKey.hex;
            type = vout.scriptPubKey.type;
            address = await deriveaddresses(hex, type);
        }
        return address;
    }



}

module.exports = Blockchain;