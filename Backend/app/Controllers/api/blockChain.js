const {getBlockByHeight,gettransaction,deriveaddresses,getLastBlock} = require('../../helpers/btcnode');
const {range} = require('../../helpers/math');
const BlockChainModel = require('../../Models/blockchain');
const SettingModel = require('../../Models/settings');
const fs = require('fs');
const path = require('path');
const util = require('util');     
const { json } = require('body-parser');
const { exit } = require('process');

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
    

    static async findWhalesAddresses(){
       
        //Phase 6 :check each of addresses tables for richest addresses
        var addCount = 1000;
        var chs = [...range(48,57), ...range(65,90), ...range(97,122)];
        var key='';
        var tblName='';
        var addresses='';
        var richest=[];
        var temp=[];
        var i=0;
        for await(const ch of chs) {
            for await(const ch2 of chs) {
                key = String.fromCharCode(ch,ch2);
                tblName='addresses_' + key;
                addresses = await BlockChainModel.getRichestAddresses(tblName,addCount);

                temp = [...richest];
                for await(const address of addresses) 
                {
                    temp = [ ...temp , [address.btc_address,address.balance,address.maxtime,address.mintime,]];
                }
                temp.sort((a,b)=>{
                    return (a[1] > b[1]) ? -1 : 1;
                });
                richest = temp.slice(0,addCount);
            }   
        }

        var query = '';
        for await(const rich of richest) { 
            query= `,('${rich[0]}',${rich[3]},${rich[2]},${rich[1]})`;
        }
        query = query.replace(/(^,)|(,$)/g, "");
        await BlockChainModel.saveRichestAddresses(query);
    }

    static async WriteAddressFilesToDB(socket){
        //Phase5 : import written address files to DB
        //          and also set an index on each Table
        const directoryPath = path.join('outputs');
        let chs =  [...range(48,57), ...range(65,90), ...range(97,122)];
        //passsing directoryPath and callback function

        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStage','4');
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStageTitle','WriteAddressFilesToDB');
        let lastWritten  = global.settings['BitcoinNode_LastFileWritten'];
        const readdir = util.promisify(fs.readdir);

        let files = await readdir(directoryPath);
        let key='';
        //listing all files using forEach
        console.log('files : ' + files.length); 
           
        socket.emit("UPDATE_BLK", {lastBlock: 'Writing To Database...', lastBlockRead: ''});
        let i=0;
        let filepath='';
        let tblName='';
        
        for await (const ch of chs){
            for await (const ch2 of chs){
               
                i++;
                if (i<=lastWritten) continue;
                //if (i>10) process.exit(0);
                key = ch + '' + ch2;
                tblName = 'addresses_' + key;
                
                socket.emit("UPDATE_TRX", {trxCount: files.length, trxRead :i });
                console.log('import:',  4000 + '/' + i + '   >> '+ tblName);
                filepath = path.dirname(require.main.filename) + '/outputs/'  + tblName + '.csv'; 
                console.log('key:', key);
                console.log('filepath:', filepath);
                console.log('tblName:', tblName);

                if (fs.existsSync(filepath)) {
                    await BlockChainModel.importAddressFile(filepath,tblName); 
                    await BlockChainModel.createIndex('idx_'+tblName+'_addr',tblName,'btc_address'); 
                    await BlockChainModel.createIndex('idx_'+tblName+'_spn',tblName,'spend');
                    fs.unlinkSync(filepath);
                } else {
                    console.log('File Not Exists : ' + filepath);
                }
                global.settings['BitcoinNode_LastFileWritten']=i;
                await SettingModel.updateCurrentFile(i);
                
            }  
        }
        global.settings['BitcoinNode_LastFileWritten']=0;
        await SettingModel.updateCurrentFile(0);
        global.settings['BitcoinNode_CurrentStage']=5;
        global.settings['BitcoinNode_CurrentStageTitle']='findWhalesAddresses';
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStage','5');
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStageTitle','findWhalesAddresses');
        console.log('Done');
    }

    static async GenerateBitcoinAddressFiles(socket){
        //Phase4 : generate bitcoin address csv file
        console.log('Phase 4 - GenerateBitcoinAddressFiles ');           
        this.fileStream = [];
        let chs = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
        let key='';
        let sql='';
        let tblNameOut='';
        let transactions='';
        let i=0;
        let j=0;
        let addQuery = [];
        let addQueryKeys = [];
        let lastWritten  = global.settings['BitcoinNode_LastFileWritten'];
        let address = '';
        let addkeyCHAR = '';
        let addKey = '';
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStage','3');
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStageTitle','GenerateBitcoinAddressFiles');

        for await (const ch of chs){
            for await (const ch2 of chs){
                for await (const ch3 of chs){
                    i++;
                    if (i<=lastWritten) continue;

                    key = ch + ch2 + ch3;
                    tblNameOut = 'outputs_' + key;
                    socket.emit("UPDATE_BLK", {lastBlock: 'Inserting Bitcoin addresses ...', lastBlockRead: 'Reading data...'});
                    socket.emit("UPDATE_TRX", {trxCount: '4096', trxRead :i });                
                    console.log('insertaddresses ' + i + '/4096');     

                    transactions = await BlockChainModel.getAllTransactions(tblNameOut);
                    for await(const transaction of transactions) 
                    {
                        //j++;
                        //if (j>100) process.exit(0);
                        //address = 'A'+  + '';
                        addkeyCHAR = transaction.outaddress.trim().slice(-2);// partitioned by two last character of address
                        //console.log('outaddress', address);
                        //console.log('addkeyCHAR', addkeyCHAR);
                        addKey = addkeyCHAR.charCodeAt(0) +''+ addkeyCHAR.charCodeAt(1); 
                        //console.log('addKey', addKey);
                        sql = `0,'${transaction.outaddress.trim()}',0,${transaction.amount},${transaction.spend},'${transaction.txid}',${transaction.vout}` + "\n";
                        if (typeof addQuery[addKey] !== 'undefined' && addQuery[addKey] !== null)
                        {
                            addQuery[addKey] = addQuery[addKey] + sql;
                        } else {
                            addQuery[addKey] = sql;
                            addQueryKeys.push(addKey);
                        }
                    }       
                    
                    socket.emit("UPDATE_BLK", {lastBlock: 'Inserting Bitcoin addresses ...', lastBlockRead: 'writing data...'});
                    await this.writeAllAddresses(addQuery,addQueryKeys);
                    addQuery.length=0;
                    addQueryKeys.length=0;
                    addQuery = [];
                    addQueryKeys = [];
                    sql='';
                    global.settings['BitcoinNode_LastFileWritten']=i;
                    await SettingModel.updateCurrentFile(i);
                }
            }   
        }
        global.settings['BitcoinNode_LastFileWritten']=0;
        await SettingModel.updateCurrentFile(0);
        global.settings['BitcoinNode_CurrentStage']=4;
        global.settings['BitcoinNode_CurrentStageTitle']='WriteAddressFilesToDB';
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStage','4');
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStageTitle','WriteAddressFilesToDB');
        console.log('DONE 4096 files');   
    }

    static async updateSpentTransactions(socket){
        //Phase2 & 3 : update outputs table and check each row to see if it has spent or not.
        var chs = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
        var key='';
        var tblNameOut='';
        var tblNameIn='';
        var tblNameTrx='';
        var i=0;
        let lastWritten  = global.settings['BitcoinNode_LastFileWritten'];
        var filepath = ''; 
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStage','2');
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStageTitle','updateSpentTransactions');

        socket.emit("UPDATE_BLK", {lastBlock: 'Updateing Spend transactions ...', lastBlockRead: ''});
        
        for await (const ch of chs){
            for await (const ch2 of chs){
                for await (const ch3 of chs){
                    i++;
                    if (i<=lastWritten) continue;
                    key = ch + ch2 + ch3;
                    tblNameOut = 'outputs_' + key;
                    tblNameIn = 'inputs_' + key;
                    tblNameTrx = 'transactions_' + key;
                    
                    
                    filepath = path.dirname(require.main.filename) + '/outputs/' + 'inputs_a' + key + '.csv';
                    if (fs.existsSync(filepath)) {
                        console.log('importing file: ', filepath);
                        await BlockChainModel.dropIndex('idx_'+tblNameIn+'_vouttx'); 
                        await BlockChainModel.importInputFile(filepath,tblNameIn); 
                        await BlockChainModel.createIndex('idx_'+tblNameIn+'_vouttx',tblNameIn,'vouttx'); 
                        fs.unlinkSync(filepath);           
                    }
                   
                    filepath = path.dirname(require.main.filename) + '/outputs/' + 'outputs_a' + key + '.csv';
                    if (fs.existsSync(filepath)) {
                        console.log('importing file: ', filepath);
                        await BlockChainModel.dropIndex('idx_'+tblNameOut+'_txid'); 
                        await BlockChainModel.importOutputFile(filepath,tblNameOut); 
                        await BlockChainModel.createIndex('idx_'+tblNameOut+'_txid',tblNameOut,'txid,vout');
                        fs.unlinkSync(filepath);
                    }          
                    
                    filepath = path.dirname(require.main.filename) + '/outputs/' + 'trx_a' + key + '.csv';
                    if (fs.existsSync(filepath)) {
                        console.log('importing file: ', filepath);
                        await BlockChainModel.dropIndex('idx_'+tblNameTrx+'_txid'); 
                        await BlockChainModel.importTrxFile(filepath,tblNameTrx); 
                        await BlockChainModel.createIndex('idx_'+tblNameTrx+'_txid',tblNameTrx,'txid'); 
                        fs.unlinkSync(filepath);           
                    }
                    
                    console.log('updateInputTrx :' + tblNameIn + ' >> ', tblNameOut);
                    await BlockChainModel.dropIndex('idx_'+tblNameIn+'_vouttxid'); 
                    await BlockChainModel.updateInputTrx(tblNameTrx,tblNameIn);
                    await BlockChainModel.createIndex('idx_'+tblNameIn+'_vouttxid',tblNameIn,'vouttxid'); 

                    console.log('updateSpendTrx :' + tblNameIn + ' >> ', tblNameOut);
                    await BlockChainModel.updateSpendTrx(tblNameOut,tblNameIn);

                    console.log('drop table : ',tblNameIn);
                    await BlockChainModel.dropTable(tblNameIn);

                    socket.emit("UPDATE_TRX", {trxCount: '8194', trxRead :i });                
                    console.log('updateSpentTransactions ' + i + '/8194');  
                

                    await SettingModel.updateCurrentFile(i);
                    global.settings['BitcoinNode_LastFileWritten']= i;
                }
            }   
        }

        socket.emit("UPDATE_TRX", {trxCount: 'DONE', trxRead :0 });      
        console.log('Done : updateSpentTransactions');         
        global.settings['BitcoinNode_LastFileWritten']=0;
        await SettingModel.updateCurrentFile(0);
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStage','3');
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStageTitle','GenerateBitcoinAddressFiles');

    }

    static async WriteTrxFilesToDB(socket){
        //Phase2 : import written files to DB
        //          and also set an index on each Table
        const directoryPath = path.join('outputs');
        //passsing directoryPath and callback function

        const readdir = util.promisify(fs.readdir);

        let files = await readdir(directoryPath);

        //listing all files using forEach
        console.log('files : ' + files.length); 
           
        socket.emit("UPDATE_BLK", {lastBlock: 'Writing To Database...', lastBlockRead: ''});
        let lastWritten  = global.settings['BitcoinNode_LastFileWritten'];
        var i=0;
        var filepath='';
        var tblName='';
        
        for await( const file of files) {
            
            // Do whatever you want to do with the file
            i++;
            if (i<=lastWritten) continue;
            socket.emit("UPDATE_TRX", {trxCount: files.length, trxRead :i });
            console.log('import:',  files.length + '/' + i + '   >> '+ file);
            filepath = path.dirname(require.main.filename) + '/outputs/'  + file; 
            tblName = file.substring(0,6);
            
            if (tblName=='inputs') {         
             tblName = 'inputs_' + file.substring(8,11);
             await BlockChainModel.importInputFile(filepath,tblName); 
             await BlockChainModel.createIndex('idx_'+tblName+'_vouttxid',tblName,'vouttxid,vout'); 
             //await BlockChainModel.createIndex('idx_'+tblName+'_vout',tblName,'vout'); 
            } else if (tblName=='output') {              
             tblName = 'outputs_' + file.substring(9,12);
             await BlockChainModel.importOutputFile(filepath,tblName); 
             await BlockChainModel.createIndex('idx_'+tblName+'_txid',tblName,'txid,vout'); 
             //await BlockChainModel.createIndex('idx_'+tblName+'_vout',tblName,'vout'); 
            }
            else continue;

            await SettingModel.updateCurrentFile(i);
            fs.unlinkSync(filepath);
        }   
        

        console.log('done');
    }


    
    
    static async checkForNewblocks_new(socket) {
        //phase 1 : read transactions and save to file
        let blockCount  =  await getLastBlock();
        global.settings['BitcoinNode_blockCount'] = blockCount;

        console.log('blockCount',blockCount);
        //let ourheight   = 182010;//global.settings['BitcoinNode_LastBlockHeightRead'];
        
        this.fileStream = [];
        let ourheight   = global.settings['BitcoinNode_LastBlockHeightRead'];
        global.settings['BitcoinNode_currBlockHeightRead'] = ourheight;
        //ourheight   = 680097;
        let trxRead = global.settings['BitcoinNode_trxRead'];
        trxRead = -1;
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
        let voutQuery=[];
        let vinQuery=[];
        let txQuery=[];
        
        let voutQueryKeys=[];
        let vinQueryKeys=[];
        let txQueryKeys=[];

        let skipBalance= false;
        let vinQueryCount =[];
        let voutQueryCount =[];

        let vtxidx='';
        let txidx='';
        let vtxidx_='';
        let txidx_='';
        let record=false;
        let sql='';
        let blksql='';
        let trxTotalCounter=global.settings['BitcoinNode_totalTrxRead'];        
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStage','1');
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStageTitle','checkForNewblocks_new');

        while(readHeight<blockCount) {
           
            readHeight ++;
            console.log('b: ',readHeight);

            if ((readHeight % 500)==0 && readHeight>(Number(ourheight)+1)){
                console.log('writing trxs');
                await this.writeAllTransaction(vinQuery,voutQuery,txQuery,vinQueryKeys,voutQueryKeys,txQueryKeys,socket,fs);
                
                vinQueryCount.length=0;
                voutQueryCount.length=0;
                voutQuery.length=0;
                vinQuery.length=0;
                txQuery.length=0;
                voutQueryKeys.length=0;
                vinQueryKeys.length=0;
                txQueryKeys.length=0;

                vinQueryCount =[];
                voutQueryCount =[];
                voutQuery=[];
                vinQuery=[];
                txQuery=[];
                voutQueryKeys=[];
                vinQueryKeys=[];
                txQueryKeys=[];
                console.log(1);
                blksql = blksql.replace(/(^,)|(,$)/g, "");
                await BlockChainModel.SaveBulkBlock(blksql); 
                console.log(2);
                await SettingModel.updateCurrentBlock(readHeight-1);
                console.log(3);
                await SettingModel.updateTrxRead(-1);
                console.log(4);
                await SettingModel.updateTotalTrxRead(trxTotalCounter);
                console.log(5);
                global.settings['BitcoinNode_LastBlockHeightRead'] = readHeight-1;
                global.settings['BitcoinNode_trxRead'] = -1;
                global.settings['BitcoinNode_totalTrxRead'] = trxTotalCounter;
                blksql = '';
                console.log(6);
            }

            Object.keys(coinBaseAddress).forEach(function(key) { delete coinBaseAddress[key]; });
            global.transactions.length=0;
            global.transactions=[];
            //blockCount  =  await getLastBlock();
            coinBaseReward=0;
            coinBaseAddress = {};
            ///socket.emit("UPDATE_BLK", {lastBlock: blockCount, lastBlockRead: readHeight});
                
            const block = await getBlockByHeight(readHeight);
            console.log(7);
            txcounter=0;
            transactionId=0;
            txs = block.result.tx;
            const BlockReward = this.getCoinBaseRewardByBlockHeight(readHeight);
            ///socket.emit("UPDATE_TRX", {trxCount: txs.length, trxRead :0 });
            //console.log('BlockReward',BlockReward);
            //return block;
            fee = 0;
            fees = 0;
            maxFee = 0;
            minFee = 999;
            console.log(8);
            for await (const tx of txs) {
                trxTotalCounter++;
                txidx_ = tx.txid.substring(0,3);
                txidx = 'a' + txidx_;
                console.log(9);
                sql =  `${trxTotalCounter},${readHeight},${tx.txid},${txcounter}` + "\n";
                if (typeof txQuery[txidx] !== 'undefined' && txQuery[txidx] !== null)
                {
                    txQuery[txidx] = txQuery[txidx] + sql;
                } else {
                    txQuery[txidx] = sql;
                    txQueryKeys.push(txidx);
                }
                console.log(10);
                //if (txcounter<10)  {
                //if (txcounter>trxRead) transactionId = await BlockChainModel.saveTransaction(readHeight,tx.txid,txcounter);
                
               
                //console.log(`================== ${txcounter}/${txs.length} Start transaction analysis` , tx.txid);
                //console.log(`===== ${txcounter}/${txs.length} TRX ` , tx.txid);
                Object.keys(addresses).forEach(function(key) { delete addresses[key]; });
                Object.keys(vouts).forEach(function(key) { delete vouts[key]; });
                vinDetails.length=0;
                vinDetails =[];
                addresses ={};
                vouts ={};
                totalPayment = {increased : 0, decreased :0}

                //BlockChainModel.saveInputs(transactionId,vin.vout);
                if (txcounter>0) {
                    for await (const vin of tx.vin) {
                        console.log(11);
                        vtxidx_ =  vin.txid.substring(0,3);
                        vtxidx = 'a' + vtxidx_;
                        
                        //sql =  `,(${readHeight},'${tx.txid}','${vtxidx_}','${vin.txid}',${vin.vout})`;
                        sql =  `${trxTotalCounter},${vin.txid},${vin.vout}` + "\n";

                        if (typeof vinQuery[vtxidx] !== 'undefined' && vinQuery[vtxidx] !== null)
                        {
                            vinQuery[vtxidx] = vinQuery[vtxidx] + sql;
                            vinQueryCount[vtxidx]++;
                        } else {
                            vinQuery[vtxidx] = sql;
                            vinQueryKeys.push(vtxidx);
                            vinQueryCount[vtxidx]=1;
                        }
                        console.log(12);
                        
                        //console.log('vtxidx:' + vtxidx + ' > ' + vinQueryCount[vtxidx]);
            
                        
                        
                            
                        // if (vinQueryCount[vtxidx]>1000) {
                        //     //await this.saveInputTransaction(vinQuery[vtxidx],vtxidx_,socket);
                        //     this.writeout(fs,'inputs',vinQuery[vtxidx],vtxidx);
                        //     vinQuery[vtxidx] = null;
                        //     vinQueryCount[vtxidx]= null;
                        //     vinQueryKeys.pop(vtxidx);
                        // }   
                    };
                } 
                console.log(13);
                voutCounter =0;
                for await (const vout of tx.vout) {        
                    //console.log('vout',vout);            
                    if (vout.value>0)
                      address = await this.getAddressFromVOUT(vout,readHeight); 
                    else address=='errorAddress';

                    if (address=='errorAddress') {
                        //console.log('vout',vout); 
                        //console.log('error TRX',tx.txid);
                   }  
                   console.log(14);
                    
                    
                    //sql =  `,(${readHeight},'${txidx_}','${tx.txid}','${address}',${voutCounter},${vout.value})`;
                    sql =  `${trxTotalCounter},${address},${voutCounter},${vout.value}` + "\n";
                    
                    if (typeof voutQuery[txidx] !== 'undefined' && voutQuery[txidx] !== null)
                    {
                        voutQuery[txidx] = voutQuery[txidx] + sql;    
                        voutQueryCount[txidx]++;   
                    } else {
                        voutQuery[txidx] = sql;
                        voutQueryKeys.push(txidx);  
                        voutQueryCount[txidx]=1;
                    }
                    console.log(15);
                    //console.log('txidx:' + txidx + ' > ' + voutQueryCount[txidx]);
                   
                              
                  
                  
                //   if ((voutQueryCount[txidx]>4000)) {
                //     //await this.saveOutputTransaction(voutQuery[txidx],txidx_,socket);
                //     this.writeout(fs,'outputs',voutQuery[txidx],txidx);
                //     voutQuery[txidx] =null;
                //     voutQueryCount[txidx]= null;
                //     voutQueryKeys.pop(txidx);
                //   }   
                    
                  voutCounter++;
                  
                };

                console.log(16);
        /*
                if (record) {
                    await this.saveTransaction(vinQuery,voutQuery,vinQueryCount,voutQueryCount,vinQueryKeys,voutQueryKeys);
                    record=false;                                            
                    SettingModel.updateTrxRead(txcounter);
                    socket.emit("UPDATE_TRX", {trxCount: txs.length, trxRead :txcounter+1 }); 
                    vinQuery=[];
                    voutQuery=[];
                    vinQueryCount=[];
                    voutQueryCount=[];
                }
*/


                
                txcounter++;
                
            };

            
            // console.info('vinQuery',vinQuery);
            // console.info('voutQuery',voutQuery);
            // console.info('vinQueryCount',vinQueryCount);
            //console.info('voutQueryCount',voutQueryCount);
            // console.info('vinQueryKeys',vinQueryKeys);
            // console.info('voutQueryKeys',voutQueryKeys);
                                                 
            ///socket.emit("UPDATE_TRX", {trxCount: txs.length, trxRead :txcounter+1 }); 
                 
            blksql = blksql + `,( ${readHeight},${block.result.time}, '${block.result.hash}',${txs.length},${fees},${maxFee},${minFee}) `;
           // await BlockChainModel.SaveBlock(readHeight,block.result.time,block.result.hash,txs.length,fees,maxFee,minFee); 
           console.log(17);
            
            trxRead = -1;
            global.settings['BitcoinNode_currBlockHeightRead'] = readHeight;
        }
        console.log(18);
        //await this.writeAllTransaction(vinQuery,voutQuery,vinQueryKeys,voutQueryKeys,socket,fs);
        await this.writeAllTransaction(vinQuery,voutQuery,txQuery,vinQueryKeys,voutQueryKeys,txQueryKeys,socket,fs);
        console.log(19);
        vinQueryCount =[];
        voutQueryCount =[];
        voutQuery=[];
        vinQuery=[];
        voutQueryKeys=[];
        vinQueryKeys=[];
        await SettingModel.updateCurrentBlock(readHeight);
        console.log(20);
        await SettingModel.updateTrxRead(-1);
        console.log(21);
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStage','2');
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStageTitle','updateSpentTransactions');
        await this.updateSpentTransactions();
    }

    static async writeAllAddresses(addQueries,addQueriesKeys) {
        
        let sql='';
         var i=0;
         for  await(var key of addQueriesKeys) { 
           // console.log('VIN');
            if (!key) continue;
            i++;
            sql = addQueries[key];
            sql = sql.replace(/(^,)|(,$)/g, "");
            //key =  key.substring(1,4);
         
            await this.writeout('addresses',sql,key);
          }
    }

    static async writeAllTransaction(vinQuery,voutQuery,txQuery,vinQueryKeys,voutQueryKeys,txQueryKeys, socket) {
        
        let sql='';
         var i=0;
         ///socket.emit("UPDATE_TRX", {trxCount: 'writing inputs', trxRead :i }); 
         console.log(23);
         for  await(var key of vinQueryKeys) { 
           // console.log('VIN');
            if (!key) continue;
            i++;
            sql = vinQuery[key];
            sql = sql.replace(/(^,)|(,$)/g, "");
            //key =  key.substring(1,4);
            console.log(24);
            await this.writeout('inputs',sql,key);
            console.log(25);
          }

          i=0;
          ///socket.emit("UPDATE_TRX", {trxCount: 'writing outputs', trxRead :i }); 
          for await (var key of voutQueryKeys) { 
            if (!key) continue;
            i++;
            sql = voutQuery[key];
            sql = sql.replace(/(^,)|(,$)/g, "");
            //key =  key.substring(1,4);        \
            console.log(26);   
            await this.writeout('outputs',sql,key);
            console.log(27);
          }   


          i=0;
          ///socket.emit("UPDATE_TRX", {trxCount: 'writing trxs', trxRead :i }); 
          for await (var key of txQueryKeys) { 
            if (!key) continue;
            i++;
            sql = txQuery[key];
            sql = sql.replace(/(^,)|(,$)/g, "");
            //key =  key.substring(1,4);          
            console.log(28); 
            await this.writeout('trx',sql,key);
            console.log(29);
          }   
    }


    static async saveAllTransaction(vinQuery,voutQuery,vinQueryKeys,voutQueryKeys,socket) {
        let sql='';
        //console.log('saveTransaction');
         
         var i=0;
         socket.emit("UPDATE_TRX", {trxCount: 'writing input trx', trxRead :i }); 
         for await (var key of vinQueryKeys) { 
           // console.log('VIN');
            if (!key) continue;
            i++;
            sql = vinQuery[key];
            sql = sql.replace(/(^,)|(,$)/g, "");
            key =  key.substring(1,4);        
            //this.writeout('zzzz',sql,'1111');    
            if (sql!='')
                await BlockChainModel.saveInputs(sql,key); 
            
                              
          }

          i=0;
          socket.emit("UPDATE_TRX", {trxCount: 'writing output trx', trxRead :i }); 
          for await (var key of voutQueryKeys) { 
            if (!key) continue;
            i++;
            sql = voutQuery[key];
            sql = sql.replace(/(^,)|(,$)/g, "");
            key =  key.substring(1,4);
            //this.writeout('zzzz',sql,'1111');  
            if (sql!='')
                await BlockChainModel.saveOutputs(sql,key); 
          }
    }

    static async writeout(type,line,key) {
       
        try {
            await this.fileStream[type+key].write(line);
        } catch (error) {
            
            this.fileStream[type+key] = fs.createWriteStream('outputs/'+ type +'_'+ key +'.csv', {flags:'a'});
            await this.fileStream[type+key].write(line);
        }
        /*
        var fs = require('fs');
        await fs.appendFile('outputs/'+ type +'_'+ key +'.csv', line, function (err) {
            if (err) {
              console.log('error','write error' + '> outputs/'+ type +'_'+ key +'.csv > ' + err);
            } 
          })*/
    }

    // static async streamToFile = (inputStream, filePath) => {
    //     return new Promise((resolve, reject) => {
    //       const fileWriteStream = fs.createWriteStream(filePath)
    //       inputStream
    //         .pipe(fileWriteStream)
    //         .on('finish', resolve)
    //         .on('error', reject)
    //     })
    //   }

    static async saveInputTransaction(vinQuery,key,socket) {
        let sql=''
        sql = vinQuery;
        sql = sql.replace(/(^,)|(,$)/g, "");
        socket.emit("UPDATE_TRX", {trxCount: 'writing input trx', trxRead :key }); 
        if (sql!='')
            await BlockChainModel.saveInputs(sql,key); 
    }


    static async saveOutputTransaction(voutQuery,key,socket) {
        let sql=''
        sql = voutQuery;
        sql = sql.replace(/(^,)|(,$)/g, "");
        socket.emit("UPDATE_TRX", {trxCount: 'writing output trx', trxRead :key });
        if (sql!='')
            await BlockChainModel.saveOutputs(sql,key); 
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

    static getLoadingStatus(){

        return new Promise((resolve,reject) => {
                let action = global.settings['BitcoinNode_CurrentStage'];
                // let action = 2;
                // global.settings['BitcoinNode_LastFileWritten']=2090;

                console.log('getLoadingStatus : ', action);
                let step=0;
                let progress=0;
                let status='';
                switch (action) {
                case '1': 
                        step=1;
                        progress= Math.round((10000 * global.settings['BitcoinNode_currBlockHeightRead']) / global.settings['BitcoinNode_blockCount']) /100;
                        status = 'Reading block ' + global.settings['BitcoinNode_currBlockHeightRead'];
                        break;
                case '2': 
                        step=2;
                        progress=Math.round((10000 * global.settings['BitcoinNode_LastFileWritten']) / 8194) /100;
                        status='importing files';
                        break;
                }

                let progressStatus = {
                    'step' : step,
                    'progress' : progress,
                    'status' : status
                }
                console.log('getLoadingStatus Result: ', progressStatus);
                resolve(progressStatus); 
        });


       
    }
}

module.exports  = Blockchain;