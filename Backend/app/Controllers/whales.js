const {getBlockByHeight,getLastBlock} = require('../helpers/btcnode');
const {socketUpdateProgress} = require('../helpers/soket');
const BlockChainModel = require('../Models/blockchain');
const SettingModel = require('../Models/settings');
const {socketUpdateRichListStatus} = require('../helpers/soket');

class Whales {

    constructor() {
        this.LastRead = Date.now();
    }

    
    static async insertBlockData(readHeight){        
        console.log('b: ',readHeight);
        //update clients        

        let trxTotalCounter = global.settings['BitcoinNode_totalTrxRead']; 
        let trxread = global.settings['BitcoinNode_trxRead']; 
        

        //geting block information
        const block = await getBlockByHeight(readHeight); 
        let txs = block.result.tx;
        console.log('trx found : ', txs.length);
        console.log('trx id in tbl : ', trxTotalCounter);
        let txcounter=-1;
        let vtxidx='';
        let txid=0;
        let address='';
        let vAddidx_='';
        let vAddidx='';
        let queryDB=[];

        for await (const tx of txs) {
            txcounter++;
            if (txcounter>10) break;
            while (trxread>=txcounter) continue;
            
            trxTotalCounter++;
                        
            
            console.log('txidx:',tx.txid);
            //mark older transaction as spent where exists in the input
            if (txcounter>0) {
                //skiping coainBase input
                for await (const vin of tx.vin) {                        
                    vtxidx =  vin.txid.substring(0,3);
                    txid = await BlockChainModel.getTransactionId(vtxidx,vin.txid);
                    address = await BlockChainModel.getVInAddress(vin.txid,vin.vout);
                    vAddidx_ = address.trim().slice(-2); 
                    vAddidx = vAddidx_.charCodeAt(0) +''+ vAddidx_.charCodeAt(1); 

                    //mark input transaction as spend in addresses table
                    queryDB.push(`update ${'addresses_' + vAddidx} set spend=1,spend_time=${block.result.time} where txid=${txid} and vout=${vin.vout};`);


                    if (!this.updatedTbls.includes(vAddidx))
                    {
                        this.updatedTbls.push(vAddidx);
                    }

                    if (!this.updatedAddrs.includes(address))
                    {
                        this.updatedAddrs.push(address);
                    }
                };
            }

            voutCounter =0;
            for await (const vout of tx.vout) {
                if (vout.value>0)
                    address = await Blockchain.getAddressFromVOUT(vout,readHeight); 
                else continue;  

                vAddidx_ = address.trim().slice(-2); 
                vAddidx = vAddidx_.charCodeAt(0) +''+ vAddidx_.charCodeAt(1); 

                //insert output as new address transaction
                queryDB.push(`INSERT INTO ${'addresses_' + vAddidx} (blockheight,btc_address,created_time,amount,txid,vout) 
                VALUES (${readHeight},'${address}',${block.result.time},${vout.value},${trxTotalCounter},${voutCounter})`);
                
                if (!this.updatedTbls.includes(vAddidx))
                {
                    this.updatedTbls.push(vAddidx);
                }

                if (!this.updatedAddrs.includes(address))
                {
                    this.updatedAddrs.push(address);
                }
            } 

            try {
                await BlockChainModel.BeginTransaction();
                for await (const sql of queryDB) {
                    console.log('queryDB:' , sql);
                    await BlockChainModel.query(sql);
                }
                await BlockChainModel.EndTransaction();
           

                txidx = tx.txid.substring(0,3);   
                console.log('insertTransaction:' , `${txidx},${trxTotalCounter},${readHeight},${tx.txid},${txcounter})`);
                await BlockChainModel.insertTransaction(txidx,trxTotalCounter,readHeight,tx.txid,txcounter);            
                await SettingModel.updateSettingVariable('BitcoinNode','totalTrxRead',trxTotalCounter);            
                await SettingModel.updateSettingVariable('BitcoinNode','trxRead',txcounter);            

                global.settings['BitcoinNode_totalTrxRead'] = trxTotalCounter;           
                global.settings['BitcoinNode_trxRead'] = txcounter;   
            } catch(e) {
                await BlockChainModel.RollBack();
                throw error('error : ' + e);
            }        
            queryDB.length=0;
            queryDB = [];
        }
        
        console.log('SaveBulkBlock:' , `${readHeight},${block.result.time},${block.result.hash},${txs.length})`);
        await BlockChainModel.SaveBulkBlock(`( ${readHeight},${block.result.time}, '${block.result.hash}',${txs.length},0,0,0) `);
        await SettingModel.updateSettingVariable('BitcoinNode','LastBlockHeightRead',readHeight-1);
        await SettingModel.updateSettingVariable('BitcoinNode','trxRead',-1);
        global.settings['BitcoinNode_LastBlockHeightRead'] = readHeight-1;
        global.settings['BitcoinNode_trxRead'] = -1;
    }

    static async startup(socket,step=6) {
        /* preloading would take several days to complete during this period we would have couple of blocks that have not been analized.
        startup function is going to load those blocks one by one to reach the last mined block. 
        we could use these startup from the first block . However despite Preloading Class, this method is not optimized for analyzing 
        tousands of block and it may lead to longer preloading step.*/
        console.log('startup : ',step);

        // if (this.LastRead+60<Date.now()) setTimeout(startup(socket,7), 10000);
        // this.LastRead = Date.now();
        
        this.updatedTbls  =  [];

        global.settings['BitcoinNode_CurrentStage']=step;
        global.settings['BitcoinNode_CurrentStageTitle']='startup';
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStage',step);
        await SettingModel.updateSettingVariable('BitcoinNode','CurrentStageTitle','startup');

        //Get Last Mined Block from the BTC Blockchain
        let blockCount  =  await getLastBlock();
        global.settings['BitcoinNode_blockCount'] = blockCount;

        console.log('blockCount',blockCount);
        

        //Getting the last block we have already Read.
        let readHeight   = global.settings['BitcoinNode_LastBlockHeightRead'];        
        

        while(readHeight<blockCount) {
            readHeight ++;
            console.log('readHeight:',readHeight);
            if (step==6) socketUpdateProgress(socket,6,readHeight,blockCount);
            socketUpdateProgress(socket,step,readHeight,blockCount);
            this.insertBlockData(readHeight);

            let blockCount  =  await getLastBlock(); 
            global.settings['BitcoinNode_blockCount'] = blockCount;
        }

        //update richest list
        await this.checkForRichest();

        if (step==6) socketUpdateProgress(socket,6,readHeight,blockCount);
        else socketUpdateRichListStatus(socket);
        process.exit(0);
        startup(socket,step);
    }


    static async checkForRichest(){

        //get richest minimum balance
        
        let minRichBalance = await BlockChainModel.getRichestMinimumBlance();
        console.log('minRichBalance 1: ',minRichBalance);
        var addCount = 1000;
        let addressIsRich = false;
        let addressBalance = 0;
        let addresses = [];
        let richest = [];
        let richestUpdated = false;

        //check if updated addresses exists inthe richest trable
        console.log('this.updatedAddrs : ',this.updatedAddrs);
        for await (const address of this.updatedAddrs) {
            addressIsRich = await BlockChainModel.addressIsRich(address);
            if (addressIsRich) {
                console.log('addressIsRich: ',address);
                addressDetails = await BlockChainModel.getAddressDetails(address);
                if (addressDetails.balance<minRichBalance) await BlockChainModel.removeRichAddress(address);     
                else await BlockChainModel.UpdateRichAddressDetails(addressDetails);   
            }
        }


        richest = await BlockChainModel.getRichestTable();

        console.log('this.updatedTbls : ',this.updatedTbls);
        for await (const tbl of this.updatedTbls) {
            Object.keys(addresses).forEach(function(key) { delete addresses[key]; });                
            addresses = await BlockChainModel.getRichestAddressesBasedOnMinBalance(tbl,minRichBalance);
            if(addresses.length>0) 
            {
                console.log('getRichestAddressesBasedOnMinBalance: ',minRichBalance);
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
                minRichBalance = richest[richest.length -1][1];
                richestUpdated = true;
                console.log('minRichBalance: ',minRichBalance);
            }
        }

        if (richestUpdated) {
            console.info('richest: ',richest);
            var query = '';
            for await(const rich of richest) { 
                query= query + `,('${rich[0]}',${rich[3]},${rich[2]},${rich[1]})`;
            }
            query = query.replace(/(^,)|(,$)/g, "");
            await BlockChainModel.saveRichestAddresses(query);
        }
    }


}

module.exports  = Whales;