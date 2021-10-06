const { getBlockByHeight, getLastBlock } = require('../helpers/btcnode');
const { socketUpdateProgress } = require('../helpers/soket');
const Blockchain = require('./blockChain');
const BlockChainModel = require('../Models/blockchain');
const SettingModel = require('../Models/settings');
const { socketUpdateRichListStatus } = require('../helpers/soket');
const { writeout } = require('../helpers/fsutils');
const path = require('path');
const fs = require('fs');
class Whales {

    constructor() {
        this.LastRead = Date.now();
    }


    static async insertBlockData(readHeight) {
        console.log('b: ', readHeight);
        //update clients        

        let trxTotalCounter = global.settings['BitcoinNode_totalTrxRead'];
        let trxread = global.settings['BitcoinNode_trxRead'];


        //geting block information
        const block = await getBlockByHeight(readHeight);
        let txs = block.result.tx;
        console.log('trx found : ', txs.length);
        console.log('trx id in tbl : ', trxTotalCounter);
        let txcounter = -1;
        let vtxidx = '';
        let txid = 0;
        let voutCounter = 0;
        let address = '';
        let vAddidx_ = '';
        let vAddidx = '';
        let txidx = '';
        let queryDB = [];

        for await (const tx of txs) {
            txcounter++;

            if (trxread >= txcounter) continue;

            trxTotalCounter++;


            console.log('txidx:', tx.txid);
            //mark older transaction as spent where exists in the input
            if (txcounter > 0) {
                //skiping coainBase input
                for await (const vin of tx.vin) {
                    vtxidx = vin.txid.substring(0, 3);
                    txid = await BlockChainModel.getTransactionId(vtxidx, vin.txid);
                    if (!txid) {
                        throw 'TXid not found for ' + vin.txid;
                    }
                    address = await Blockchain.getVInAddress(vin.txid, vin.vout);
                    vAddidx_ = address.trim().slice(-2);
                    vAddidx = vAddidx_.charCodeAt(0) + '' + vAddidx_.charCodeAt(1);

                    //mark input transaction as spend in addresses table
                    queryDB.push(`update ${'addresses_' + vAddidx} set spend=1,spend_time=${block.result.time} where txid=${txid} and vout=${vin.vout};`);


                    if (!this.updatedTbls.includes(vAddidx)) {
                        this.updatedTbls.push(vAddidx);
                    }

                    if (!this.updatedAddrs.includes(address)) {
                        this.updatedAddrs.push(address);
                    }
                };
            }

            voutCounter = 0;
            for await (const vout of tx.vout) {
                if (vout.value > 0)
                    address = await Blockchain.getAddressFromVOUT(vout, readHeight);
                else continue;

                vAddidx_ = address.trim().slice(-2);
                vAddidx = vAddidx_.charCodeAt(0) + '' + vAddidx_.charCodeAt(1);

                //insert output as new address transaction
                queryDB.push(`INSERT INTO ${'addresses_' + vAddidx} (blockheight,btc_address,created_time,amount,txid,vout) VALUES (${readHeight},'${address}',${block.result.time},${vout.value},${trxTotalCounter},${voutCounter})`);

                if (!this.updatedTbls.includes(vAddidx)) {
                    this.updatedTbls.push(vAddidx);
                }

                if (!this.updatedAddrs.includes(address)) {
                    this.updatedAddrs.push(address);
                }
            }

            try {
                console.log('try');
                await BlockChainModel.BeginTransaction();
                console.log('BeginTransaction');
                for await (const sql of queryDB) {
                    console.log('queryDB:', sql);
                    await BlockChainModel.query(sql);
                }
                console.log('EndTransaction');
                await BlockChainModel.EndTransaction();


                txidx = tx.txid.substring(0, 3);
                await SettingModel.updateSettingVariable('BitcoinNode', 'totalTrxRead', trxTotalCounter);
                await SettingModel.updateSettingVariable('BitcoinNode', 'trxRead', txcounter);
                console.log('insertTransaction:', `${txidx},${trxTotalCounter},${readHeight},${tx.txid},${txcounter})`);
                await BlockChainModel.insertTransaction(txidx, trxTotalCounter, readHeight, tx.txid, txcounter);


                global.settings['BitcoinNode_totalTrxRead'] = trxTotalCounter;
                global.settings['BitcoinNode_trxRead'] = txcounter;
            } catch (e) {
                await BlockChainModel.RollBack();
                throw e;
            }
            queryDB.length = 0;
            queryDB = [];
        }

        console.log('SaveBulkBlock:', `${readHeight},${block.result.time},${block.result.hash},${txs.length})`);
        await BlockChainModel.SaveBulkBlock(`( ${readHeight},${block.result.time}, '${block.result.hash}',${txs.length},0,0,0) `);
        await SettingModel.updateSettingVariable('BitcoinNode', 'LastBlockHeightRead', readHeight);
        await SettingModel.updateSettingVariable('BitcoinNode', 'trxRead', -1);
        global.settings['BitcoinNode_LastBlockHeightRead'] = readHeight;
        global.settings['BitcoinNode_trxRead'] = -1;
    }

    static async insertBlockData_bulk(socket, step, readHeight, blockCount) {
        console.log('b: ', readHeight);
        //update clients        

        let trxTotalCounter = global.settings['BitcoinNode_totalTrxRead'];
        let trxread = global.settings['BitcoinNode_trxRead'];
        let block;
        let txs;
        let sql = '';
        let txcounter = -1;
        let vtxidx = '';
        let txid = 0;
        let voutCounter = 0;
        let address = '';
        let vAddidx_ = '';
        let vAddidx = '';
        let txidx = '';
        let blockSQL = '';
        //geting block information
        let tempTrxIds = [];
        let queryTxt_addresses_insert = [];
        let queryTxt_addresses_update = [];
        let queryTxt_transaction_insert = [];

        let queryTxt_addresses_insert_keys = [];
        let queryTxt_addresses_update_keys = [];
        let queryTxt_transaction_insert_keys = [];

        let queryTxt_addresses_insert_len = [];
        let queryTxt_addresses_update_len = [];
        let queryTxt_transaction_insert_len = [];
        socketUpdateProgress(socket, 6, readHeight, blockCount);
        socketUpdateProgress(socket, step, readHeight, blockCount);

        let write = false;
        while (readHeight <= blockCount) {

            block = await getBlockByHeight(parseInt(readHeight));
            console.log(block);
            txs = block.result.tx;
            console.log('trx found : ', txs.length);
            console.log('trx id in tbl : ', trxTotalCounter);
            txcounter = -1;
            vtxidx = '';
            txid = 0;
            voutCounter = 0;
            address = '';
            vAddidx_ = '';
            vAddidx = '';
            txidx = '';

            for await (const tx of txs) {

                txcounter++;

                if (trxread >= txcounter) continue;

                trxTotalCounter++;

                console.log(txcounter);
                console.log('txidx:', tx.txid);
                //mark older transaction as spent where exists in the input
                if (txcounter > 0) {

                    //skiping coainBase input
                    for await (const vin of tx.vin) {
                        vtxidx = vin.txid.substring(0, 3);
                        //console.log('vtxidx:', vtxidx);
                        //console.log('vin.txid:', vin.txid);

                        txid = await BlockChainModel.getTransactionId(vtxidx, vin.txid);

                        if (!txid) {
                            //txid = 1;
                            //%% the trx may be in current block and we should save current block tx ids.
                            if (tempTrxIds[vin.txid]) txid = tempTrxIds[vin.txid];
                            else throw 'TXid not found for ' + vin.txid;
                        }
                        address = await Blockchain.getVInAddress(vin.txid, vin.vout);

                        if (address == '' || address == undefined) continue;
                        //console.log(`${vtxidx}, ${txid}, ${vin.vout}`);
                        //address = await BlockChainModel.getVInAddress(vtxidx, txid, vin.vout);
                        vAddidx_ = address.trim().slice(-2);
                        vAddidx = vAddidx_.charCodeAt(0) + '' + vAddidx_.charCodeAt(1);

                        //mark input transaction as spend in addresses table
                        sql = `(${txid},${vin.vout},${block.result.time})`;
                        if (typeof queryTxt_addresses_update[vAddidx] !== 'undefined' && queryTxt_addresses_update[vAddidx] !== null) {
                            queryTxt_addresses_update[vAddidx] = queryTxt_addresses_update[vAddidx] + ' or ' + sql;
                            queryTxt_addresses_update_len[vAddidx] += 1;
                        } else {
                            queryTxt_addresses_update[vAddidx] = sql;
                            queryTxt_addresses_update_keys.push(vAddidx);
                            queryTxt_addresses_update_len[vAddidx] = 1;
                        }

                        if (queryTxt_addresses_update_len[vAddidx] > 500) write = true;
                        // queryDB = queryDB + `update ${'addresses_' + vAddidx} set spend=1,spend_time=${block.result.time} where txid=${txid} and vout=${vin.vout};\n`;


                        if (!this.updatedTbls.includes(vAddidx)) {
                            this.updatedTbls.push(vAddidx);
                        }

                        if (!this.updatedAddrs.includes(address)) {
                            this.updatedAddrs.push(address);
                        }

                    };
                }
                voutCounter = 0;
                for await (const vout of tx.vout) {
                    if (vout.value > 0)
                        address = await Blockchain.getAddressFromVOUT(vout, readHeight);
                    else continue;
                    vAddidx_ = address.trim().slice(-2);
                    vAddidx = vAddidx_.charCodeAt(0) + '' + vAddidx_.charCodeAt(1);

                    //insert output as new address transaction
                    sql = `(${readHeight},'${address}',${block.result.time},${vout.value},${trxTotalCounter},${voutCounter})`;
                    if (typeof queryTxt_addresses_insert[vAddidx] !== 'undefined' && queryTxt_addresses_insert[vAddidx] !== null) {
                        queryTxt_addresses_insert[vAddidx] = queryTxt_addresses_insert[vAddidx] + ',' + sql;
                        queryTxt_addresses_insert_len[vAddidx] += 1;
                    } else {
                        queryTxt_addresses_insert[vAddidx] = sql;
                        queryTxt_addresses_insert_keys.push(vAddidx);
                        queryTxt_addresses_insert_len[vAddidx] = 1;
                    }

                    if (queryTxt_addresses_insert_len[vAddidx] > 500) write = true;


                    // queryDB = queryDB + `INSERT INTO ${'addresses_' + vAddidx} (blockheight,btc_address,created_time,amount,txid,vout) VALUES (${readHeight},'${address}',${block.result.time},${vout.value},${trxTotalCounter},${voutCounter});\n`;

                    if (!this.updatedTbls.includes(vAddidx)) {
                        this.updatedTbls.push(vAddidx);
                    }

                    if (!this.updatedAddrs.includes(address)) {
                        this.updatedAddrs.push(address);
                    }
                }
                txidx = tx.txid.substring(0, 3);

                sql = `(${trxTotalCounter},${readHeight},'${tx.txid}',${txcounter})`;
                if (typeof queryTxt_transaction_insert[txidx] !== 'undefined' && queryTxt_transaction_insert[txidx] !== null) {
                    queryTxt_transaction_insert[txidx] = queryTxt_transaction_insert[txidx] + ',' + sql;
                    queryTxt_transaction_insert_len[txidx] += 1;
                } else {
                    queryTxt_transaction_insert[txidx] = sql;
                    queryTxt_transaction_insert_keys.push(txidx);
                    queryTxt_transaction_insert_len[txidx] = 1;
                }

                if (queryTxt_transaction_insert_len[txidx] > 500) write = true;
                // queryDB = queryDB + `INSERT INTO ${'transactions_' + txidx} (id,block_height,txid,txseq) VALUES (${trxTotalCounter},${readHeight},'${tx.txid}',${txcounter});\n`;

                tempTrxIds[tx.txid] = trxTotalCounter;
                //await writeout(fileStream, 'query', queryDB, 'db', 'sql');
                //queryDB = '';

            }
            blockSQL += `( ${readHeight},${block.result.time}, '${block.result.hash}',${txs.length},0,0,0) `;

            //await BlockChainModel.importSQL(sql);
            if (write) {
                console.log('updateing  addresses ...');
                for await (var key of queryTxt_addresses_update_keys) {
                    if (!key) continue;
                    sql = `update ${'addresses_' + key} as A set A.spend=1,A.spend_time=B.spendtime from (values ${queryTxt_addresses_update[key]}) as B(txid,vout,spendtime) where  A.txid=B.txid and A.vout=B.vout;`;
                    console.log(sql);
                    await BlockChainModel.query(sql);
                }

                console.log('inserting transactions ...');
                for await (var key of queryTxt_transaction_insert_keys) {
                    if (!key) continue;
                    sql = `INSERT INTO ${'transactions_' + key} (id,block_height,txid,txseq) VALUES ${queryTxt_transaction_insert[key]};`;
                    console.log(sql);
                    await BlockChainModel.query(sql);
                }

                console.log('inserting addresses ...');
                for await (var key of queryTxt_addresses_insert_keys) {
                    if (!key) continue;
                    sql = `INSERT INTO ${'addresses_' + key} (blockheight,btc_address,created_time,amount,txid,vout) VALUES ${queryTxt_addresses_insert[key]};`;
                    console.log(sql);
                    await BlockChainModel.query(sql);
                }

                // filepath = path.dirname(require.main.filename) + '/outputs/' + 'query_db' + '.sql';
                // await BlockChainModel.importFile(filepath);
                await BlockChainModel.SaveBulkBlock(blockSQL);
                await SettingModel.updateSettingVariable('BitcoinNode', 'LastBlockHeightRead', readHeight);
                await SettingModel.updateSettingVariable('BitcoinNode', 'trxRead', -1);
                await SettingModel.updateSettingVariable('BitcoinNode', 'totalTrxRead', trxTotalCounter);
                //fs.unlinkSync(filepath);
                global.settings['BitcoinNode_LastBlockHeightRead'] = readHeight;
                global.settings['BitcoinNode_trxRead'] = -1;
                write = false;
                blockSQL = '';
                queryTxt_addresses_insert = [];
                queryTxt_addresses_update = [];
                queryTxt_transaction_insert = [];

                queryTxt_addresses_insert_keys = [];
                queryTxt_addresses_update_keys = [];
                queryTxt_transaction_insert_keys = [];

                queryTxt_addresses_insert_len = [];
                queryTxt_addresses_update_len = [];
                queryTxt_transaction_insert_len = [];
            }

            readHeight++;
            socketUpdateProgress(socket, 6, readHeight, blockCount);
            socketUpdateProgress(socket, step, readHeight, blockCount);
            socketUpdateProgress(socket, 6, readHeight, blockCount);
        }
        console.log('queryTxt_addresses_insert_len', Math.max(...queryTxt_addresses_insert_len));
        console.log('queryTxt_addresses_update_len', Math.max(...queryTxt_addresses_update_len));
        console.log('queryTxt_transaction_insert_keys', Math.max(...queryTxt_transaction_insert_keys));

        console.log('blocked read. importing to db ...');
        //write queries to file
        console.log('updateing  addresses ...');
        for await (var key of queryTxt_addresses_update_keys) {
            if (!key) continue;
            ql = `update ${'addresses_' + vAddidx} as A set A.spend=1,A.spend_time=B.spendtime from (values ${queryTxt_addresses_update[vAddidx]}) as B(txid,vout,spendtime) where  A.txid=B.txid and A.vout=B.vout;`;
            await BlockChainModel.query(sql);
        }

        console.log('inserting transactions ...');
        for await (var key of queryTxt_transaction_insert_keys) {
            if (!key) continue;
            sql = `INSERT INTO ${'transactions_' + key} (id,block_height,txid,txseq) VALUES ${queryTxt_transaction_insert[key]};`;
            console.log(sql);
            await BlockChainModel.query(sql);
        }

        console.log('inserting addresses ...');
        for await (var key of queryTxt_addresses_insert_keys) {
            if (!key) continue;
            sql = `INSERT INTO ${'addresses_' + key} (blockheight,btc_address,created_time,amount,txid,vout) VALUES ${queryTxt_addresses_insert[key]};`;
            console.log(sql);
            await BlockChainModel.query(sql);
        }
        console.log('Done.');
    }


    static async startup(socket, step = 6) {
        /* preloading would take several days to complete during this period we would have couple of blocks that have not been analized.
        startup function is going to load those blocks one by one to reach the last mined block. 
        we could use these startup from the first block . However despite Preloading Class, this method is not optimized for analyzing 
        tousands of block and it may lead to longer preloading step.*/
        console.log('startup : ', step);

        //Getting the last block we have already Read.
        let readHeight = global.settings['BitcoinNode_LastBlockHeightRead'];


        //Get Last Mined Block from the BTC Blockchain
        let blockCount = await getLastBlock();
        global.settings['BitcoinNode_blockCount'] = blockCount;


        console.log('blockCount', blockCount);


        if (readHeight == blockCount) {
            setTimeout(this.startup(socket, 7), 10000);
            return;
        }
        this.LastRead = Date.now();

        this.updatedTbls = [];
        this.updatedAddrs = [];

        global.settings['BitcoinNode_CurrentStage'] = step;
        global.settings['BitcoinNode_CurrentStageTitle'] = 'startup';
        await SettingModel.updateSettingVariable('BitcoinNode', 'CurrentStage', step);
        await SettingModel.updateSettingVariable('BitcoinNode', 'CurrentStageTitle', 'startup');
        if (step == 6) socketUpdateProgress(socket, 6, readHeight, blockCount);



        console.log('readHeight:', readHeight);
        socketUpdateProgress(socket, step, readHeight, blockCount);
        //await this.insertBlockData(readHeight);
        await this.insertBlockData_bulk(socket, step, readHeight, blockCount);

        blockCount = await getLastBlock();
        global.settings['BitcoinNode_blockCount'] = blockCount;

        //update richest list
        await this.checkForRichest();

        if (step == 6) socketUpdateProgress(socket, 6, readHeight, blockCount);
        else socketUpdateRichListStatus(socket);

        this.startup(socket, step);
    }


    static async checkForRichest() {

        //get richest minimum balance
        console.log('checkForRichest:');
        let minRichBalance = await BlockChainModel.getRichestMinimumBlance();
        console.log('minRichBalance 1: ', minRichBalance);
        var addCount = 1000;
        let addressIsRich = false;
        let addressBalance = 0;
        let addresses = [];
        let richest = [];
        let richestUpdated = false;
        let shuoldUpdate = true;
        let temp = [];
        let addressDetails = {};

        //check if updated addresses exists inthe richest trable
        console.log('this.updatedAddrs : ', this.updatedAddrs.length);
        for await (const address of this.updatedAddrs) {
            addressIsRich = await BlockChainModel.addressIsRich(address);
            if (addressIsRich) {
                console.log('addressIsRich: ', address);
                addressDetails = await BlockChainModel.getAddressDetails(address);
                if (addressDetails.balance < minRichBalance) await BlockChainModel.removeRichAddress(address);
                else await BlockChainModel.UpdateRichAddressDetails(addressDetails);
            }
        }


        richest = await BlockChainModel.getRichestTable();

        console.log('this.updatedTbls : ', this.updatedTbls.length);

        for await (const tbl of this.updatedTbls) {
            Object.keys(addresses).forEach(function (key) { delete addresses[key]; });
            console.log('richest in tbl: ', `${tbl} >> ${minRichBalance}`);
            addresses = await BlockChainModel.getRichestAddressesBasedOnMinBalance(tbl, minRichBalance);
            if (addresses.length > 0) {
                console.log('new richest addresses: ', addresses);
                temp = [...richest];


                for await (const address of addresses) {
                    shuoldUpdate = true;
                    for await (const rich of temp) {
                        if (rich.btc_address == address.btc_address) {
                            console.info('btc addess already in richest: ', address.btc_address);
                            shuoldUpdate = false;
                            break;
                        }
                    }

                    if (shuoldUpdate) {
                        console.info('inserted: ', `${address.btc_address} , ${address.balance} `);
                        temp = [...temp, [address.btc_address, address.balance, address.maxtime, address.mintime]];
                        richestUpdated = true;
                    }
                }

                temp.sort((a, b) => {
                    return (parseFloat(a[1]) > parseFloat(b[1])) ? -1 : 1;
                });

                if (temp.length > addCount) {
                    richest.length = 0;
                    richest = temp.slice(0, addCount);
                    console.log('richest.length: ', richest.length);
                    minRichBalance = richest[richest.length - 1].balance;
                    console.log('richest[richest.length -1]: ', richest[richest.length - 1]);
                    console.log('minRichBalance: ', minRichBalance);
                }
            }
        }

        if (richestUpdated) {
            console.info('writing new richest table');
            var query = '';
            for await (const rich of richest) {
                query = query + `,('${rich.btc_address}',${rich.balance},${rich.created_at},${rich.updated_at})`;
            }
            query = query.replace(/(^,)|(,$)/g, "");
            await BlockChainModel.saveRichestAddresses(query);
        }
    }


}

module.exports = Whales;