/*#############################################################
PRELOADING CLASS
This class is the most important and the most complicated class of this project.
at the time of this production, Bitcoin blockchain consists of near 700,000 Blocks
and millions of transactions and addresses. the total Blockchain size is above 400 GB.
when you run this script for the first time , the script tries to get all of this data
and create a very simple table based on addresses. this final table which is partitioned
using custom methods, have all the transactions, addresses and whether they has spent or not.

During development of this script i tries different methods for achieving mentioned goals.
However simplest ways would cause scripts to preloading for couple of weeks. I used different
method to maximize the preloading speed. this methods are including determining tables structures, 
methods of writing to DB, custom table partitioning , method for finding spent transactions and many more ...

Now total preloading process would takes around 4 to 5 days maximum to analyze and extract data
from millions of rows.
###############################################################*/


const {getBlockByHeight,getLastBlock} = require('../helpers/btcnode');
const {range} = require('../helpers/math');
const {socketUpdateProgress} = require('../helpers/soket');
const {writeAllTransaction,writeAllAddresses} = require('../helpers/fsutils');

const BlockChain = require('./blockChain');
const BlockChainModel = require('../Models/blockchain');
const SettingModel = require('../Models/settings');
const fs = require('fs');
const path = require('path');  
const Blockchain = require('./blockChain');
const Whales = require('./whales');

class PRELOADING {
  
    static async preloading_stage1_getblockinfo(socket) {
        //phase 1 : read transactions and save to file

        //get Last Mined Block from the BTC Blockchain
        let blockCount  =  await getLastBlock();
        global.settings['BitcoinNode_blockCount'] = blockCount;

        console.log('blockCount',blockCount);

        //Getting the last block we have already Read.
        let ourheight   = global.settings['BitcoinNode_LastBlockHeightRead'];
        let trxTotalCounter = global.settings['BitcoinNode_totalTrxRead'];      


        let readHeight  =  ourheight;
        let txcounter = 0;
        let voutCounter=0;
        
        let addresses ={};
        let vouts ={};
        
        this.fileStream = [];
        let vinDetails =[];
        let voutQuery=[];
        let vinQuery=[];
        let txQuery=[];
        let voutQueryKeys=[];
        let vinQueryKeys=[];
        let txQueryKeys=[];
        let vinQueryCount =[];
        let voutQueryCount =[];

        let address = '';
        let vtxidx='';
        let txidx='';
        let vtxidx_='';
        let txidx_='';
        let sql='';
        let blksql='';
        
        let txs = null;

          
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStage','1');
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStageTitle','preloading_stage1_getblockinfo');

        while(readHeight<blockCount) {
           
            readHeight ++;
            console.log('b: ',readHeight);
            socketUpdateProgress(socket,1,readHeight,blockCount);
            
            if ((readHeight % 500)==0 && readHeight>(Number(ourheight)+1)){
                //writing block and transaction details to files
                console.log('writing trxs');
                blksql = blksql.replace(/(^,)|(,$)/g, "");
                await BlockChainModel.SaveBulkBlock(blksql);
                await writeAllTransaction(this.fileStream,vinQuery,voutQuery,txQuery,vinQueryKeys,voutQueryKeys,txQueryKeys,socket,fs);
                await SettingModel.updateCurrentBlock(readHeight-1);              
                await SettingModel.updateTrxRead(-1);            
                await SettingModel.updateTotalTrxRead(trxTotalCounter);
             
                global.settings['BitcoinNode_LastBlockHeightRead'] = readHeight-1;
                global.settings['BitcoinNode_trxRead'] = -1;
                global.settings['BitcoinNode_totalTrxRead'] = trxTotalCounter;
                blksql = '';
 
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

                //update blockcount to the latest block
                blockCount  =  await getLastBlock();
            }
            if (readHeight>160000) break;//temp break 
            global.transactions.length=0;
            global.transactions=[];            

            const block = await getBlockByHeight(readHeight); 
            txs = block.result.tx;
            txcounter=0;

            for await (const tx of txs) {
                trxTotalCounter++;
                txidx_ = tx.txid.substring(0,3);
                txidx = 'a' + txidx_;                
                sql =  `${trxTotalCounter},${readHeight},${tx.txid},${txcounter}` + "\n";

                if (typeof txQuery[txidx] !== 'undefined' && txQuery[txidx] !== null)
                {
                    txQuery[txidx] = txQuery[txidx] + sql;
                } else {
                    txQuery[txidx] = sql;
                    txQueryKeys.push(txidx);
                }

                Object.keys(addresses).forEach(function(key) { delete addresses[key]; });
                Object.keys(vouts).forEach(function(key) { delete vouts[key]; });
                vinDetails.length=0;
                vinDetails = [];
                addresses = {};

                if (txcounter>0) {
                    for await (const vin of tx.vin) {                        
                        vtxidx_ =  vin.txid.substring(0,3);
                        vtxidx = 'a' + vtxidx_;
                        sql =  `${trxTotalCounter},${vin.txid},${vin.vout},${block.result.time}` + "\n";

                        if (typeof vinQuery[vtxidx] !== 'undefined' && vinQuery[vtxidx] !== null)
                        {
                            vinQuery[vtxidx] = vinQuery[vtxidx] + sql;
                            vinQueryCount[vtxidx]++;
                        } else {
                            vinQuery[vtxidx] = sql;
                            vinQueryKeys.push(vtxidx);
                            vinQueryCount[vtxidx]=1;
                        }
                    };
                } 
                
                voutCounter =0;
                for await (const vout of tx.vout) {          
                    if (vout.value>0)
                      address = await Blockchain.getAddressFromVOUT(vout,readHeight); 
                    else address=='errorAddress';

                    sql =  `${trxTotalCounter},${address},${voutCounter},${vout.value},${block.result.time}` + "\n";
                    
                    if (typeof voutQuery[txidx] !== 'undefined' && voutQuery[txidx] !== null)
                    {
                        voutQuery[txidx] = voutQuery[txidx] + sql;    
                        voutQueryCount[txidx]++;   
                    } else {
                        voutQuery[txidx] = sql;
                        voutQueryKeys.push(txidx);  
                        voutQueryCount[txidx]=1;
                    }
                  voutCounter++;                  
                };

                txcounter++;                
            };
            blksql = blksql + `,( ${readHeight},${block.result.time}, '${block.result.hash}',${txs.length},0,0,0) `;  
            global.settings['BitcoinNode_currBlockHeightRead'] = readHeight;
        }        

        blksql = blksql.replace(/(^,)|(,$)/g, "");
        await BlockChainModel.SaveBulkBlock(blksql);
        await writeAllTransaction(this.fileStream,vinQuery,voutQuery,txQuery,vinQueryKeys,voutQueryKeys,txQueryKeys,socket,fs);
        await SettingModel.updateCurrentBlock(readHeight);
        await SettingModel.updateTrxRead(-1);        
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStage','2');
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStageTitle','preloading_stage2_ImportFilesToDB');
        await SettingModel.updateSettingVariable('BitcoinNode','totalTrxRead',trxTotalCounter);
        global.settings['BitcoinNode_totalTrxRead'] = trxTotalCounter;
        

        vinQueryCount =[];
        voutQueryCount =[];
        voutQuery=[];
        vinQuery=[];
        voutQueryKeys=[];
        vinQueryKeys=[];

        console.log('######################## DONE Step 1');
        this.preloading_stage2_ImportFilesToDB(socket);
    }


    static async preloading_stage2_ImportFilesToDB(socket){
        //Phase 2 : update outputs table and check each row to see if it has spent or not.
        var chs = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
        var key='';
        var tblNameOut='';
        var tblNameIn='';
        var tblNameTrx='';
        var i=0;
        let lastWritten  = global.settings['BitcoinNode_LastFileWritten'];
        var filepath = ''; 
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStage','2');
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStageTitle','preloading_stage2_ImportFilesToDB');

        for await (const ch of chs){
            for await (const ch2 of chs){
                for await (const ch3 of chs){
                    i++;
                    socketUpdateProgress(socket,2,i,4096);
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
                    await SettingModel.updateCurrentFile(i);
                    global.settings['BitcoinNode_LastFileWritten']= i;

                    //await BlockChainModel.dropTable(tblNameIn);               
                    console.log('preloading_stage2_ImportFilesToDB ' + i + '/4096');  
                }
            }   
        }
  
        console.log('Done : preloading_stage2_ImportFilesToDB');         
        global.settings['BitcoinNode_LastFileWritten']=0;
        await SettingModel.updateCurrentFile(0);
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStage','3');
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStageTitle','preloading_stage3_ExtractAddresses');
        console.log('######################## DONE Step 2');
        this.preloading_stage3_ExtractAddresses(socket);
    }


    static async preloading_stage3_ExtractAddresses(socket){
        //Phase3 : generate bitcoin address csv file
        console.log('Phase 4 - preloading_stage3_ExtractAddresses ');           
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
        let addkeyCHAR = '';
        let addKey = '';
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStage','3');
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStageTitle','preloading_stage3_ExtractAddresses');

        for await (const ch of chs){
            for await (const ch2 of chs){
                for await (const ch3 of chs){
                    i++;
                    socketUpdateProgress(socket,3,i,4096);
                    console.log('insertaddresses ' + i + '/4096');     
                    if (i<=lastWritten) continue;

                    key = ch + ch2 + ch3;
                    tblNameOut = 'outputs_' + key;
                    transactions = await BlockChainModel.getAllTransactions(tblNameOut);
                    for await(const transaction of transactions) 
                    {
                        addkeyCHAR = transaction.outaddress.trim().slice(-2);// partitioned by two last character of address
                        addKey = addkeyCHAR.charCodeAt(0) +''+ addkeyCHAR.charCodeAt(1); 
                        sql = `0,${transaction.outaddress.trim()},${transaction.created_time},${transaction.spend_time},${transaction.amount},${transaction.spend},${transaction.txid},${transaction.vout}` + "\n";
                        if (typeof addQuery[addKey] !== 'undefined' && addQuery[addKey] !== null)
                        {
                            addQuery[addKey] = addQuery[addKey] + sql;
                        } else {
                            addQuery[addKey] = sql;
                            addQueryKeys.push(addKey);
                        }
                    }       
                    
                    await writeAllAddresses(this.fileStream,addQuery,addQueryKeys);
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
        global.settings['BitcoinNode_CurrentStageTitle']='preloading_stage4_ImportAddressesToDB';
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStage','4');
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStageTitle','preloading_stage4_ImportAddressesToDB');
        
        console.log('DONE 4096 files'); 
        console.log('######################## DONE Step 3');
        this.preloading_stage4_ImportAddressesToDB(socket);  
    }



    static async preloading_stage4_ImportAddressesToDB(socket){
        //Phase4 : import written address files to DB
        //          and also set an index on each Table
        
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStage','4');
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStageTitle','preloading_stage4_ImportAddressesToDB');
        let lastWritten  = global.settings['BitcoinNode_LastFileWritten'];
      
        let chs =  [...range(48,57), ...range(65,90), ...range(97,122)];
        let key='';
        let i=0;
        let filepath='';
        let tblName='';
        
        for await (const ch of chs){
            for await (const ch2 of chs){
               
                i++;
                socketUpdateProgress(socket,4,i,3844);
                if (i<=lastWritten) continue;
                key = ch + '' + ch2;
                tblName = 'addresses_' + key;
                
                console.log('import:',  3844 + '/' + i + '   >> '+ tblName);
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
        global.settings['BitcoinNode_CurrentStageTitle']='preloading_stage5_FindingWhales';
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStage','5');
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStageTitle','preloading_stage5_FindingWhales');

        console.log('Done');
        console.log('######################## DONE Step 4');
        this.preloading_stage5_FindingWhales(socket);
    }


    
    static async preloading_stage5_FindingWhales(socket){
        //Phase 6 :check each of addresses tables for richest addresses

        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStage','5');
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStageTitle','preloading_stage5_FindingWhales');

        var addCount = 1000;
        var i=0;
        var chs = [...range(48,57), ...range(65,90), ...range(97,122)];
        var key='';
        var tblName='';
        var addresses={};
        var richest=[];
        var temp=[];        

        for await(const ch of chs) {
            for await(const ch2 of chs) {
                i++;
                socketUpdateProgress(socket,5,i,3844);
                console.info('======== i: ',i);
                key = ch + '' + ch2;
                tblName = 'addresses_' + key;
                
                Object.keys(addresses).forEach(function(key) { delete addresses[key]; });
                addresses = await BlockChainModel.getRichestAddresses(tblName,addCount);

                temp = [...richest];
                for await(const address of addresses) 
                {
                    temp = [ ...temp , [address.btc_address,address.balance,address.maxtime,address.mintime]];
                }

                temp.sort((a,b)=>{
                    return (parseFloat(a[1]) > parseFloat(b[1])) ? -1 : 1;
                });

                richest.length=0;
                richest = temp.slice(0,addCount);
                temp.length=0;
            }  
        }

        console.info('richest:',richest);

        var query = '';
        for await(const rich of richest) { 
            query= query + `,('${rich[0]}',${rich[3]},${rich[2]},${rich[1]})`;
        }
        query = query.replace(/(^,)|(,$)/g, "");
        await BlockChainModel.saveRichestAddresses(query);

        console.log('DONE');
        console.log('######################## DONE Step 5');    

        global.settings['BitcoinNode_CurrentStage']=6;
        global.settings['BitcoinNode_CurrentStageTitle']='startup';
        global.settings['BitcoinNode_trxRead'] = -1;     

        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStage','6');
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStageTitle','startup');
        await SettingModel.updateSettingVariable('BitcoinNode','trxRead',-1);           

        Whales.startup(socket);    
    }

    
}

module.exports  = PRELOADING;