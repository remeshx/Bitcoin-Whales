const {getBlockByHeight,gettransaction,deriveaddresses,getLastBlock} = require('../../helpers/btcnode');
const BlockChainModel = require('../../Models/blockChain');

class Blockchain {

    static getLastBlockHeight() {
        return new Promise((resolve,reject) =>{
            settingModel.loadSetting('BlockChain','LastBlockHeightRead')
            .then(()=>{
                const msg = 'LastBlockHeightRead is ' + global.settings['LastBlockHeightRead'];
                resolve({'message' : msg});
            }).catch(error=>reject(error));
           
        });        
    }

    static async getLastBlock() {
        //return new Promise((resolve,reject) =>{        
            
            // gettransaction('04857418393e77f8060291bc2faaac30facefbfcd50f1f64df4e2dc2b5f57ecf').then(res=>{
            //     console.log('res',res);
            //     const hex=res.result.vout[0].scriptPubKey.hex;
            //     const type=res.result.vout[0].scriptPubKey.type;
            //     deriveaddresses(hex,type ).then(res=>{
            //         console.log(deriveaddresses,res);
            //         resolve(res);
            //         }
            //     )
                
            // }).catch(error=>reject(error));

            
            // getBlockByHeight(666678).then(block=>{
            //         this.analyzeBlock(block);
            //         resolve(block);
            //     });
            // });  



            //return this.checkForNewblocks();
            let blockCount  =  await getLastBlock();
            return {
                lastBlockRead: global.settings['BitcoinNode_LastBlockHeightRead'],
                lastBlock: blockCount
            }
    }

    static async checkForNewblocks() {

        let blockCount  =  await getLastBlock();
        global.transactions=[];

        console.log('blockCount',blockCount);
        let ourheight   = 182010;//global.settings['BitcoinNode_LastBlockHeightRead'];
        let readHeight  =  ourheight;
        let coinBaseReward = 0;
        while(ourheight<blockCount) {
            readHeight ++;
            const block = await getBlockByHeight(readHeight);
            console.log('block',block);
            let txcounter=0;
            let txs = block.result.tx;
            const BlockReward = this.getCoinBaseRewardByBlockHeight(readHeight);
        
            console.log('BlockReward',BlockReward);
            let fees = 0;
            for (const tx of txs) {
                //if (txcounter<10)  {
                    
                console.log(`================== ${txcounter}/${txs.length} Start transaction analysis` , tx.txid);
                const vinDetails =[];
                const totalPayment = {increased : 0, decreased :0}
                if (txcounter>0) {
                    for (const vin of tx.vin) {
                        await this.getVInDetails(vin.txid,vin.vout,vinDetails);
                    };
                } 
                console.log('vinDetails:',vinDetails);
                
                for (const vout of tx.vout) {
                    if (txcounter==0 && vout.value>0) {
                        console.log('coinBaseReward',vout.value);
                        coinBaseReward = vout.value;
                    }
                    if (vout.value && vout.value>0)
                    await this.increaseWallet(vout,tx,vinDetails,totalPayment,readHeight);
                };

                for (const vinDetail of vinDetails) {
                    if (vinDetail.vinValue>0) {
                        const decValue = vinDetail.vinValue * -1;
                        const addressId = await BlockChainModel.increaseWallet(vinDetail.vinAddress, decValue);
                        console.log('addressId',addressId);
                        await BlockChainModel.saveAddress(addressId,readHeight);
                        totalPayment.decreased = parseFloat(parseFloat(totalPayment.decreased) + vinDetail.vinValue).toFixed(8);
                        
                        console.log(`totalPayment -  ${vinDetail.vinValue} = ` +  totalPayment.decreased);
                        console.log('VIN doeas not exists in output');
                        console.log(`Decrease wallet ${vinDetail.vinAddress} => ${decValue}`);
                    }
                };

                if (txcounter>0) {
                    console.log('totalPayment.increased',totalPayment.increased);
                    console.log('totalPayment.decreased',totalPayment.decreased);
                    fees = parseFloat(
                        parseFloat(fees) +
                        parseFloat(totalPayment.increased) -
                        parseFloat(totalPayment.decreased)
                        ).toFixed(8)

                    console.log('fees', fees);
                }
                txcounter++;
                //}

                
            };

            const remain = parseFloat(coinBaseReward - BlockReward + parseFloat(fees)).toFixed(8);
            console.log('remain',parseFloat(remain));
            if ( parseFloat(remain) !==0) {
                const msg =`Error balances coinBaseReward : ${coinBaseReward} ,BlockReward: ${BlockReward}, fees: ${fees}`;
                console.log(msg);
               // throw error(msg);
            }
            const msg =`balances coinBaseReward : ${coinBaseReward} ,BlockReward: ${BlockReward}, fees: ${fees}`;
            console.log(msg);

            console.log(`${readHeight},${block.result.hash},${txs.length},${fees}`);
            await BlockChainModel.SaveBlock(readHeight,block.result.hash,txs.length,fees);  
            return block;
            break;
        }
        
    }

    static getCoinBaseRewardByBlockHeight(blockHeight){

        const a = Math.floor(blockHeight/210000);
        let blockReward =50;
        for (let i=1; i<=a; i++) 
        {
            blockReward = blockReward/2;
        }
        return blockReward;       
    }

    static async getVInDetails(txid,vout,vinDetails){        
       let tx = await gettransaction(txid);
       const address = await this.getAddressFromVOUT(tx.result.vout[vout]);   
       const value = tx.result.vout[vout].value;
       let found = false;

       let counter=0;
       for (const vinDetail of  vinDetails) {
            if (vinDetail.vinAddress==address) {
                vinDetails[counter].vinValue += value;
                found = true;
            }
            counter++;
       }

       if (!found) 
        vinDetails.push({
            vinAddress : address,
            vinValue : value
        });

       await BlockChainModel.logTransactionSend(txid,vout,address);

       return true;
    }

    
    static async increaseWallet(vout,tx,vinDetails,totalPayment,blockHeight){
        
        console.log(`increase Wallet  ${vout.value}`);
        const address = await this.getAddressFromVOUT(vout);   
        console.log(`DATA Gathered for increase:  ${vout.value} => ${address}`);
        
        const addressId = await BlockChainModel.increaseWallet(address,vout.value);
        console.log('addressId2',addressId);
        await BlockChainModel.saveAddress(addressId,blockHeight);
        console.log(`increase Wallet  ${vout.value} =>` +  address);

        console.log(`totalPayment was = ` +  totalPayment.increased);
        totalPayment.increased = parseFloat(parseFloat(totalPayment.increased) + vout.value).toFixed(8);
        console.log(`totalPayment +  ${vout.value} = ` +  totalPayment.increased);
        
    }

    static async getAddressFromVOUT(vout)
    {
        console.log(`getAddressFromVOUT`);
        let address = ''; 
        let hex='';
        let type='';
        if (vout.scriptPubKey.addresses) 
        {           
            if (vout.scriptPubKey.addresses.length>1) {
                console.log('tx ', tx);
                console.log('addresse ', vout.scriptPubKey.addresses);
                throw new Error('ERROR : TOO MANY ADDRESSESS ' + tx.txid);
            }
            address = vout.scriptPubKey.addresses[0];
            console.log(`address exists =>`, address);
        } else {
            console.log('no address ');
            hex=vout.scriptPubKey.hex;
            type=vout.scriptPubKey.type;
            address = await deriveaddresses(hex,type );          
            console.log(`address derived =>`, address);  
        }
        
        return address;
    }


    static analyzeBlock(block) {
        console.log('VIN', block.result.tx[0].vin);
        console.log('Vout', block.result.tx[0].vout);

    }

}

module.exports  = Blockchain;