const db = require('./db');

class BlockChainModel {


    static increaseWallet(address,value) {
        return new Promise((resolve,reject)=> {
            db.query(
                `INSERT INTO addresses ( btc_address, last_update,deposits) 
                    VALUES ($1, NOW(), $2)
                    ON CONFLICT (btc_address) DO UPDATE 
                    SET last_update = NOW(), 
                    deposits = addresses.deposits +  excluded.deposits RETURNING id;`,
            [address,value],
            (error,response)=>{
                
                const addressId = response.rows[0].id;
                if (error) {
                    console.log('error 7',error);
                    reject(error);
                }
                //console.log('addressId',addressId);
                resolve(addressId);
            });
        })
    }

    static decreaseWallet(address,value) {
        return new Promise((resolve,reject)=> {
            db.query(
                `INSERT INTO addresses ( btc_address, last_update,withdrawals) 
                    VALUES ($1, NOW(), $2)
                    ON CONFLICT (btc_address) DO UPDATE 
                    SET last_update = NOW(), 
                    withdrawals = addresses.withdrawals +  excluded.withdrawals RETURNING id;`,
            [address,value],
            (error,response)=>{
                const addressId = response.rows[0].id;
                if (error) {
                    console.log('error 6',error);
                    reject(error);
                }
                resolve(addressId);
            });
        })
    }


    static logTransactionSend(txid,vout,address='') {
        return new Promise((resolve,reject)=> {
            db.query(
                `INSERT INTO TxIdOut ( txid, vout,outaddress) 
                    VALUES ($1, $2, $3);`,
            [txid,vout,address],
            (error,response)=>{
                if (error) {
                    console.log('error 5',error);
                    reject(error);
                }
                resolve(true);
            });
        })
    }

    static SaveBlock(height,blockTime,blockHash,txCount,fee,maxFee,minFee) {
        return new Promise((resolve,reject)=> {
            db.query(
                `INSERT INTO block_details ( block_height,block_time, block_hash,tx_count,block_fee,max_fee,min_fee) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7);`,
            [height,blockTime,blockHash,txCount,fee,maxFee,minFee],
            (error,response)=>{
                if (error) {
                    console.log('error 4',error);
                    reject(error);
                }
                resolve(true);
            });
        })
    }

    static SaveBulkBlock(sql) {
        return new Promise((resolve,reject)=> {
            db.query(
                `INSERT INTO block_details ( block_height,block_time, block_hash,tx_count,block_fee,max_fee,min_fee) 
                    VALUES ${sql};`,
            [],
            (error,response)=>{
                if (error) {
                    console.log('error 4',error);
                    reject(error);
                }
                resolve(true);
            });
        })
    }

    static SaveReward(height,reward,rewardAddress,rewardTime) {
        return new Promise((resolve,reject)=> {
            db.query(
                `INSERT INTO block_rewards 
                    (block_height,block_reward_total, reward_address_id, reward_time) 
                    VALUES ($1, $2, $3, $4);`,
            [height,reward,rewardAddress,rewardTime],
            (error,response)=>{
                if (error) {
                    console.log('error 3',error);
                    reject(error);
                }
                resolve(true);
            });
        })
    }

    static saveAddress(addressId,transactionId,vout,amount) {
        return new Promise((resolve,reject)=> {
            db.query(
                `INSERT INTO addresses_input ( address_id, txid, vout, amount) 
                    VALUES ($1, $2, $2, $3 ,$4);`,
            [addressId,transactionId,vout,amount],
            (error,response)=>{
                if (error) {
                    console.log('error 1',error);
                    reject(error);
                }
                resolve(true);
            });
        })
    }

    static saveAddresses(values) {
        return new Promise((resolve,reject)=> {
            //console.log('values',values);
            db.query(
                `INSERT INTO addresses_input ( addressid, txid, vout, amount) 
                    VALUES ${values}`,
            [],
            (error,response)=>{
                if (error) {
                    console.log('values ',values);
                    console.log('error 2',error);
                    reject(error);
                }
                resolve(true);
            });
        })
    }


    static saveTransaction(height,txid,txseq) {
        return new Promise((resolve,reject)=> {
            db.query(
                `INSERT INTO transactions ( blockid, txid, txseq) 
                    VALUES ($1, $2,$3) RETURNING id;`,
            [height,txid,txseq],
            (error,response)=>{
                if (error) {
                    console.log('error',error);
                    reject(error);
                }
                const transactionId = response.rows[0].id;
                resolve(transactionId);
            });
        })
    }


    static getTransactionKey(txid){
        return new Promise((resolve,reject) => {
            db.query(`SELECT id
            FROM transactions
            WHERE txid = $1`,
                [txid],
                (error,response)=>{
                    if (error) {
                        console.log('error 9',error);
                        resolve('');
                    }
                    if (response.rows.length === 0) resolve('');
                    if (response.rows[0])  resolve(response.rows[0].id);
                    else resolve('');
                })
        });
    }

    static getAddressKey(txKey,vout){
        return new Promise((resolve,reject) => {
            db.query(`SELECT addressid,amount
            FROM addresses_input
            WHERE txid = $1 and vout=$2`,
                [txKey,vout],
                (error,response)=>{
                    if (error) {
                        console.log('error 10',error);
                        resolve('');
                    }
                    if (response.rows.length === 0) resolve('');
                    if (response.rows[0]) resolve({id: response.rows[0].addressid, amount : response.rows[0].amount} );
                    else resolve('');
                })
        });
    }


    static getAddressFromKey(addKey){
        return new Promise((resolve,reject) => {
            db.query(`SELECT btc_address
            FROM addresses
            WHERE id = $1`,
                [addKey],
                (error,response)=>{
                    if (error) {
                        console.log('error 11',error);
                        resolve('');
                    }
                    if (response.rows.length === 0) resolve('');
                    if (response.rows[0]) resolve(response.rows[0].btc_address);
                    else resolve('');
                })
        });
    }



    static saveInputs(values,key) {
        return new Promise((resolve,reject)=> {
            db.query(
                `INSERT INTO inputs_${key} ( blockheight ,txid, vouttxidx, vouttxid, vout) 
                    VALUES ${values}`,
            [],
            (error,response)=>{
                if (error) {
                    console.log('error',error);
                    
                    console.log('values',values);
                    console.log('key',key);
                    reject(error);
                }
                resolve(true);
            });
        })
    }

    static updateSpendTrx(outputTbl,inputTbl){
        //update outputs_387 As A set spend=1 where id IN (select B.id from outputs_387 As B left join inputs_387 As C ON B.txid=C.vouttxid and B.vout=C.vout where C.txid is not null);
        //update outputs_387 set spend=1 where concat(txid,vout) IN (select concat(vouttxid,vout) from inputs_387) ;
        //update outputs_055 set spend=1 where concat(txid,vout)=any(select concat(vouttxid,vout) from outputs_055) ;
        //`update outputs_055 As A set spend=1 from inputs_055 As B where A.txid=B.vouttxid and A.vout=B.vout`,
        return new Promise((resolve,reject)=> {
            db.query(
                `update ${outputTbl} set spend=1 where concat(txid,vout)=any(select concat(vouttxid,vout) from ${inputTbl}) ;`,
            [],
            (error,response)=>{
                if (error) {
                    console.log('error',error);
                    reject(error);
                }
                resolve(true);
            });
        })
    }


    static updateInputTrx(trxTbl,inputTbl){
        return new Promise((resolve,reject)=> {
            db.query(
                `update ${inputTbl} As A set vouttxid=B.id from ${trxTbl} As B where A.vouttx=B.txid`,
            [],
            (error,response)=>{
                if (error) {
                    console.log('error',error);
                    reject(error);
                }
                resolve(true);
            });
        })
    }

    static createIndex(indexName,tables,columns){
        return new Promise((resolve,reject)=> {
            db.query(
                `CREATE INDEX ${indexName} ON ${tables} (${columns}) `,
            [],
            (error,response)=>{
                if (error) {
                    reject(error);
                }
                resolve(true);
            });
        })
    }

    static getRichestAddresses(tblName,limits)
    {
        return new Promise((resolve,reject) => {
            db.query(`SELECT btc_address,SUM((spend*-1) * amount - (spend-1) * amount) as balance, MIN(created_at) as mintime, MAX(created_at) as maxtime
            FROM ${tblName} group by btc_address order by balance DESC limit ${limits}`,
                [],
                (error,response)=>{
                    if (error) {
                        console.log('error 11',error);
                        resolve('');
                    }
                    if (response.rows.length === 0) resolve('');
                    else resolve(response.rows);
                })
        });
    }

    static saveRichestAddresses(values)
    {
        return new Promise((resolve,reject)=> {
            db.query(
                `INSERT INTO richestAddresses ( btc_address ,created_at, updated_at, balance) 
                    VALUES ${values}`,
            [],
            (error,response)=>{
                if (error) {
                    console.log('error',error);
                    
                    console.log('values',values);
                    console.log('key',key);
                    reject(error);
                }
                resolve(true);
            });
        })
    }

    static importAddressFile(file,table) {
        return new Promise((resolve,reject)=> {
            db.query(
                `COPY ${table}(blockheight ,btc_address, created_time, amount, spend, txid, vout)  FROM '${file}'
                DELIMITER ','
                CSV HEADER;
                `,
            [],
            (error,response)=>{
                if (error) {
                    reject(error);
                }
                resolve(true);
            });
        })
    }

    static importInputFile(file,table) {
        return new Promise((resolve,reject)=> {
            db.query(
                `COPY ${table}( txid, vouttx, vout)  FROM '${file}'
                DELIMITER ','
                CSV HEADER;
                `,
            [],
            (error,response)=>{
                if (error) {
                    reject(error);
                }
                resolve(true);
            });
        })
    }

    static importOutputFile(file,table) {
        return new Promise((resolve,reject)=> {
            db.query(
                `COPY ${table}(txid,outaddress,vout,amount) FROM '${file}'
                DELIMITER ','
                CSV HEADER;
                `,
            [],
            (error,response)=>{
                if (error) {
                    reject(error);
                }
                resolve(true);
            });
        })
    }

    
    static importTrxFile(file,table) {
        return new Promise((resolve,reject)=> {
            db.query(
                `COPY ${table}(id,block_height,txid,txseq) FROM '${file}'
                DELIMITER ','
                CSV HEADER;
                `,
            [],
            (error,response)=>{
                if (error) {
                    reject(error);
                }
                resolve(true);
            });
        })
    }


    static saveOutputs(values,key) {
        return new Promise((resolve,reject)=> {
            db.query(
                `INSERT INTO outputs_${key} ( blockheight , txidx, txid, outaddress, vout, amount) 
                    VALUES ${values}`,
            [],
            (error,response)=>{
                if (error) {
                    console.log('error',error);
                    console.log('values',values);
                    console.log('key',key);
                    
                    reject(error);
                }
                resolve(true);
            });
        })
    }

    


    static getAllTransactions(tblName){
        return new Promise((resolve,reject) => {
            db.query(`SELECT * FROM ${tblName}`,
                [],
                (error,response)=>{
                    if (error) {
                        console.log('error 11',error);
                        resolve('');
                    }
                    if (response.rows.length === 0) resolve('');
                    else resolve(response.rows);
                })
        });
    }


    static dropTable(tblName) {
        return new Promise((resolve,reject) => {
            db.query(`Drop Table ${tblName}`,
                [],
                (error,response)=>{
                    if (error) {
                        console.log('error 11',error);
                        reject(false);
                    }
                    resolve(true);               
                })
            });
    }      
}

module.exports = BlockChainModel;