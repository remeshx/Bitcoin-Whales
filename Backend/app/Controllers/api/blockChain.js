const {getBlockByHeight,gettransaction,deriveaddresses,getLastBlock} = require('../../helpers/btcnode');
const BlockChainModel = require('../../Models/blockchain');
const SettingModel = require('../../Models/settings');

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

    static async getLastBlock(socket) {
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
            const response = new Date();
            socket.emit("FromAPI", {time: response});
            let blockCount  =  await getLastBlock();
            return {
                lastBlockRead: global.settings['BitcoinNode_LastBlockHeightRead'],
                lastBlock: blockCount
            }
    }

    static async checkForNewblocks(socket) {

        let blockCount  =  await getLastBlock();
        

        console.log('blockCount',blockCount);
        //let ourheight   = 182010;//global.settings['BitcoinNode_LastBlockHeightRead'];
        
        let ourheight   = global.settings['BitcoinNode_LastBlockHeightRead'];
        ourheight   = 140955;
        let trxRead = global.settings['BitcoinNode_trxRead'];
        trxRead = 0
        let readHeight  =  ourheight;
        let coinBaseReward = 0;
        let coinBaseAddress = {};
        let coinBaseAddressId = 0;
        let fee = 0;
        let fees = 0;
        let maxFee = 0;
        let minFee = 999;
        let txcounter = 0;
        let txs = null;
        let vinDetails =[];
        let addresses ={};
        let vouts ={};
        let totalPayment = {increased : 0, decreased :0};
        let address = '';
        let addressesKeys = [];
        let amount =0;
        let addressId=0;
        let decAmount=0;
        let coinBaseAddressesKeys= [];
        let transactionId=0;
        let voutCounter=0;
        let voutQuery='';
        let skipBalance= false;

        while(readHeight<blockCount) {
            readHeight ++;
            global.transactions=[];
            //blockCount  =  await getLastBlock();
            coinBaseReward=0;
            coinBaseAddress = {};
            socket.emit("UPDATE_BLK", {lastBlock: blockCount, lastBlockRead: readHeight});
            const block = await getBlockByHeight(readHeight);
            console.log('readHeight',readHeight);
            txcounter=0;
            transactionId=0;
            txs = block.result.tx;
            const BlockReward = this.getCoinBaseRewardByBlockHeight(readHeight);
            
            //console.log('BlockReward',BlockReward);
            //return block;
            fee = 0;
            fees = 0;
            maxFee = 0;
            minFee = 999;
        
            for await (const tx of txs) {
                //if (txcounter<10)  {
                if (txcounter>trxRead) transactionId = await BlockChainModel.saveTransaction(readHeight,tx.txid,txcounter);
                
                socket.emit("UPDATE_TRX", {trxCount: txs.length, trxRead :txcounter+1 });    
                //console.log(`================== ${txcounter}/${txs.length} Start transaction analysis` , tx.txid);
                console.log(`===== ${txcounter}/${txs.length} TRX ` , tx.txid);
                vinDetails =[];
                addresses ={};
                vouts ={};
                voutQuery='';
                totalPayment = {increased : 0, decreased :0}
                if (txcounter>0) {
                    for await (const vin of tx.vin) {
                        await this.getVInDetails(vin.txid,vin.vout,vinDetails);
                    };
                } 
                //console.log('vinDetails:',vinDetails);
                //console.log('tx.vout:',tx.vout);
                
                voutCounter =0;
                for await (const vout of tx.vout) {                    
                    address = await this.getAddressFromVOUT(vout,readHeight); 
                    if (address=='errorAddress') {
                        console.log('error TRX',tx.txid);
                   }  
                    if (txcounter==0 && vout.value>0) {
                        //console.log('coinBaseReward',vout.value);
                        coinBaseReward += vout.value;
                        coinBaseAddress[address] = {id:0, reward : vout.value};
                    }
                    if (vout.value && vout.value>0) {                        
                        //addressId = await this.increaseWallet(vout,tx,vinDetails,totalPayment,readHeight);
                        if (!addresses[address]) addresses[address] = {increased:0 , decreased:0};
                        addresses[address].increased = parseFloat(
                                    parseFloat(addresses[address].increased) +
                                    parseFloat(vout.value)
                                ).toFixed(8);
                    }
                    if (!vouts[address]) vouts[address] = [];
                    vouts[address].push({id: voutCounter, value: vout.value});
                    voutCounter++;
                };

                for (const vinDetail of vinDetails) {
                    if (vinDetail.vinValue>0) {
                        if (!addresses[vinDetail.vinAddress]) addresses[vinDetail.vinAddress] = {increased:0 , decreased:0};
                        addresses[vinDetail.vinAddress].decreased = parseFloat(
                                    parseFloat(addresses[vinDetail.vinAddress].decreased) +
                                    parseFloat(vinDetail.vinValue)
                                ).toFixed(8);
                        
                        
                        // const addressId = await BlockChainModel.increaseWallet(vinDetail.vinAddress, decValue);
                        // console.log('addressId',addressId);
                        // await BlockChainModel.saveAddress(addressId,readHeight,);
                        // totalPayment.decreased = parseFloat(parseFloat(totalPayment.decreased) + vinDetail.vinValue).toFixed(8);
                        
                        // console.log(`totalPayment -  ${vinDetail.vinValue} = ` +  totalPayment.decreased);
                        // console.log('VIN doeas not exists in output');
                        // console.log(`Decrease wallet ${vinDetail.vinAddress} => ${decValue}`);
                    }
                };

                //console.log('addresses',addresses);


                addressesKeys = [];
                for (var i in addresses) {
                    if (addresses.hasOwnProperty(i)) {
                        addressesKeys.push(i);
                    }
                }
                
                addressId=0;
                decAmount=0;
                for await (const address of addressesKeys) {     
                    amount = parseFloat(
                        parseFloat(addresses[address].increased) -
                        parseFloat(addresses[address].decreased)
                    ).toFixed(8);
                    
                    addressId =0 ;
                    if (amount>0) {
                        //console.log(`increase Wallet  ${amount} =>` +  address);
                        if (txcounter>trxRead)
                            addressId = await BlockChainModel.increaseWallet(address,amount);
                        //console.log(`increase Wallet addressId =>` +  addressId);
                        
                        totalPayment.increased =  parseFloat(
                            parseFloat(totalPayment.increased) +
                            parseFloat(amount)
                        ).toFixed(8);
                    } else {
                        //console.log(`decrease Wallet  ${amount} =>` +  address);
                        amount = Math.abs(amount);
                        if (txcounter>trxRead)
                            addressId = await BlockChainModel.decreaseWallet(address,amount);
                        

                        totalPayment.decreased =parseFloat(
                            parseFloat(totalPayment.decreased) +
                            parseFloat(amount)
                        ).toFixed(8);
                    }          
                    if (coinBaseAddress[address] !== undefined) coinBaseAddress[address].id = addressId;

                     //console.log('address',address);
                     //console.log('vouts',vouts);
                    if (txcounter>trxRead) {
                        if (addresses[address].increased>0)
                        for await(var voutdet of vouts[address]){
                            voutQuery += `,(${addressId},${transactionId},${voutdet.id},${voutdet.value})`;   
                        }
                    } else  {
                        console.log('Skip trx', tx.txid);
                        console.log('Skipping details', `${txcounter}>${trxRead}`);
                    }
                }

                if (txcounter>trxRead) {
                    voutQuery = voutQuery.replace(/(^,)|(,$)/g, "");
                    if (voutQuery!='')
                        await BlockChainModel.saveAddresses(voutQuery);
                    SettingModel.updateTrxRead(txcounter);
                }
               
                if (txcounter>0) {
                    //console.log('totalPayment.increased',totalPayment.increased);
                    //console.log('totalPayment.decreased',totalPayment.decreased);
                    fee =  parseFloat(
                                parseFloat(totalPayment.increased) -
                                parseFloat(totalPayment.decreased)
                            ).toFixed(8);

                    fee = Math.abs(fee);        
                    fees = parseFloat(parseFloat(fees) + fee).toFixed(8);
                    if (fee>maxFee) maxFee = fee;
                    if (fee<minFee) minFee = fee;
                    //console.log('fee', fee);
                    //console.log('fees', fees);
                }
                txcounter++;
                //}

                
            };
            if (minFee==999) minFee=0;
            const remain = parseFloat(coinBaseReward - BlockReward - parseFloat(fees)).toFixed(8);
            //console.log('remain',parseFloat(remain));
            skipBalance=false;
            if (readHeight==124724) skipBalance=true;
            if (readHeight>=162705 && readHeight<=169899) skipBalance=true;
            if (readHeight==501726) skipBalance=true;
            if (readHeight==526591) skipBalance=true;
             if ( parseFloat(remain) !==0) {
                if (skipBalance) {
                    console.log('$$$$$ Skipped, Error Block Balance : ',readHeight);
                } else {
                    const msg =`Error balances coinBaseReward : ${coinBaseReward} ,BlockReward: ${BlockReward}, fees: ${fees}`;
                    console.log(msg);
                    throw error(msg);
                }
            }
            const msg =`balances coinBaseReward : ${coinBaseReward} ,BlockReward: ${BlockReward}, fees: ${fees}`;
            //console.log(msg);

            //console.log(`${readHeight},${block.result.hash},${txs.length},${fees}`);
            coinBaseAddressesKeys = [];
            for (var i in coinBaseAddress) {
                if (coinBaseAddress.hasOwnProperty(i)) {
                    coinBaseAddressesKeys.push(i);
                }
            }
            for await (const address of coinBaseAddressesKeys) {  
                await BlockChainModel.SaveReward(readHeight,coinBaseAddress[address].reward,coinBaseAddress[address].id,block.result.time);
            }

            await BlockChainModel.SaveBlock(readHeight,block.result.time,block.result.hash,txs.length,fees,maxFee,minFee);  
            SettingModel.updateCurrentBlock(readHeight);
            SettingModel.updateTrxRead(-1);
            global.settings['BitcoinNode_LastBlockHeightRead'] = readHeight;
            global.settings['BitcoinNode_trxRead'] = -1;
            trxRead = -1;
        }
        
    }


    
    static async checkForNewblocks_new(socket) {

        let blockCount  =  await getLastBlock();
        

        console.log('blockCount',blockCount);
        //let ourheight   = 182010;//global.settings['BitcoinNode_LastBlockHeightRead'];
        
        let ourheight   = global.settings['BitcoinNode_LastBlockHeightRead'];
        //ourheight   = 165223;
        let trxRead = global.settings['BitcoinNode_trxRead'];
        //trxRead = -1;
        let readHeight  =  ourheight;
        let coinBaseReward = 0;
        let coinBaseAddress = {};
        let coinBaseAddressId = 0;
        let fee = 0;
        let fees = 0;
        let maxFee = 0;
        let minFee = 999;
        let txcounter = 0;
        let txs = null;
        let vinDetails =[];
        let addresses ={};
        let vouts ={};
        let totalPayment = {increased : 0, decreased :0};
        let address = '';
        let addressesKeys = [];
        let amount =0;
        let addressId=0;
        let decAmount=0;
        let coinBaseAddressesKeys= [];
        let transactionId=0;
        let voutCounter=0;
        let voutQuery='';
        let vinQuery='';
        let skipBalance= false;
        let vinQueryCount =0;
        let voutQueryCount =0;

        while(readHeight<blockCount) {
            readHeight ++;
            console.log('readHeight',readHeight);
            global.transactions=[];
            //blockCount  =  await getLastBlock();
            coinBaseReward=0;
            coinBaseAddress = {};
            socket.emit("UPDATE_BLK", {lastBlock: blockCount, lastBlockRead: readHeight});
                
            const block = await getBlockByHeight(readHeight);
            
            txcounter=0;
            transactionId=0;
            txs = block.result.tx;
            const BlockReward = this.getCoinBaseRewardByBlockHeight(readHeight);
            socket.emit("UPDATE_TRX", {trxCount: txs.length, trxRead :0 });
            //console.log('BlockReward',BlockReward);
            //return block;
            fee = 0;
            fees = 0;
            maxFee = 0;
            minFee = 999;
        
            for await (const tx of txs) {
                //if (txcounter<10)  {
                //if (txcounter>trxRead) transactionId = await BlockChainModel.saveTransaction(readHeight,tx.txid,txcounter);
                
               
                //console.log(`================== ${txcounter}/${txs.length} Start transaction analysis` , tx.txid);
                //console.log(`===== ${txcounter}/${txs.length} TRX ` , tx.txid);
                vinDetails =[];
                addresses ={};
                vouts ={};
                totalPayment = {increased : 0, decreased :0}

                //BlockChainModel.saveInputs(transactionId,vin.vout);
                if (txcounter>0) {
                    for await (const vin of tx.vin) {
                        vinQueryCount++;
                        if (txcounter>trxRead) 
                            vinQuery = vinQuery + `,(${readHeight},'${tx.txid}','${vin.txid}',${vin.vout})`;
                    };
                } 
                
                voutCounter =0;
                for await (const vout of tx.vout) {        
                    //console.log('vout',vout);            
                    if (vout.value>0)
                      address = await this.getAddressFromVOUT(vout,readHeight); 
                    else address=='errorAddress';

                    if (address=='errorAddress') {
                        console.log('vout',vout); 
                        console.log('error TRX',tx.txid);
                   }  

                  // BlockChainModel.saveOutputs(transactionId,address,voutCounter,vout.value);
                  if (txcounter>trxRead)
                    voutQuery = voutQuery + `,(${readHeight},'${tx.txid}','${address}',${voutCounter},${vout.value})`;
                  voutQueryCount++;
                  voutCounter++;
                };


                if (vinQueryCount>1000 || voutQueryCount>1000) {
                    console.log(`write blocks inputs ${vinQueryCount}, outputs ${voutQueryCount}`); 
                    vinQuery = vinQuery.replace(/(^,)|(,$)/g, "");
                    if (vinQuery!='')
                        await BlockChainModel.saveInputs(vinQuery);
                    vinQuery='';
                    vinQueryCount=0;                    
               
                    voutQuery = voutQuery.replace(/(^,)|(,$)/g, "");
                    if (voutQuery!='')
                        await BlockChainModel.saveOutputs(voutQuery);
                    voutQuery = '';
                    voutQueryCount =0;                    
                    SettingModel.updateTrxRead(txcounter);
                    socket.emit("UPDATE_TRX", {trxCount: txs.length, trxRead :txcounter+1 });    
                }

                
                txcounter++;
            };

            
            
            if (vinQuery!='') {
                vinQuery = vinQuery.replace(/(^,)|(,$)/g, "");
                await BlockChainModel.saveInputs(vinQuery);
                console.log('write blocks input ',voutQueryCount); 
            }
            vinQuery='';
            vinQueryCount=0;
            
            
            if (voutQuery!='') {
                voutQuery = voutQuery.replace(/(^,)|(,$)/g, "");
                await BlockChainModel.saveOutputs(voutQuery);
                console.log('write blocks output ',voutQueryCount); 
            }
            voutQuery = '';
            voutQueryCount =0;
            
            await BlockChainModel.SaveBlock(readHeight,block.result.time,block.result.hash,txs.length,fees,maxFee,minFee);  
            SettingModel.updateCurrentBlock(readHeight);
            SettingModel.updateTrxRead(-1);
            global.settings['BitcoinNode_LastBlockHeightRead'] = readHeight;
            global.settings['BitcoinNode_trxRead'] = -1;
            trxRead = -1;
            socket.emit("UPDATE_TRX", {trxCount: txs.length, trxRead :txcounter+1 }); 
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
        // console.log('txid',txid);    
        // console.log('vout',vout); 
       let found=true;   
       let txkey = await BlockChainModel.getTransactionKey(txid); 
       let addDetail='';
       let address='';
       let value=0;
       //console.log('txkey',txkey);    
       if (txkey!='') {
            addDetail = await BlockChainModel.getAddressKey(txkey,vout); 
            
            //console.log('addDetail',addDetail);   
            if (addDetail!='') { 
                address =  await BlockChainModel.getAddressFromKey(addDetail.id); 
            } else found= false;
       } else found= false;

       if (found && address!='') { 
            //console.log('address',address);    
            vinDetails.push({
                vinAddress : address,
                vinValue : addDetail.amount
            });
        } else {
            console.log('gettransaction txid :',txid);
            let tx = await gettransaction(txid);
            if (tx) {
                const address = await this.getAddressFromVOUT(tx.result.vout[vout]);
                if (address=='errorAddress') {
                    console.log('error TRX',txid);
                }
                value = tx.result.vout[vout].value;
                let found = false;
        
                let counter=0;
                for (const vinDetail of  vinDetails) {
                    if (vinDetail.vinAddress==address) {
                        vinDetails[counter].vinValue += value;
                        found = true;
                    }
                    counter++;
                }
            }
            if (!found) 
             vinDetails.push({
                 vinAddress : address,
                 vinValue : value
             });

         
        }
        
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
        return addressId;
    }

    static async getAddressFromVOUT(vout,blockheight=0)
    {
        //console.log(`getAddressFromVOUT`);
        let address = ''; 
        let hex='';
        let type='';
        if (vout.scriptPubKey.addresses) 
        {           
            if (vout.scriptPubKey.addresses.length>1) {
                //console.log('tx ', tx);
                return 'errorAddress';
                if (blockheight==164467) return 'errorAddress';
                console.log('addresse ', vout.scriptPubKey.addresses);
                throw new Error('ERROR : TOO MANY ADDRESSESS ' + tx.txid);
            } 
            address = vout.scriptPubKey.addresses[0];
            //console.log(`address exists =>`, address);
        } else {
            //console.log('no address ');
            hex=vout.scriptPubKey.hex;
            type=vout.scriptPubKey.type;
            address = await deriveaddresses(hex,type);   
            
            //console.log(`address derived =>`, address);  
        }
        
        return address;
    }


    static analyzeBlock(block) {
        console.log('VIN', block.result.tx[0].vin);
        console.log('Vout', block.result.tx[0].vout);

    }

}

module.exports  = Blockchain;