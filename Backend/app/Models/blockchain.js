const db = require('./db');

class BlockChainModel {

    
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




    static updateSpendTrx(outputTbl,inputTbl){
        return new Promise((resolve,reject)=> {
            db.query(
                `update ${outputTbl} As A set spend=1,spend_time=B.created_time from ${inputTbl} As B where A.txid=B.vouttxid and A.vout=B.vout`,
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

    static dropIndex(indexName){
        return new Promise((resolve,reject)=> {
            db.query(
                `DROP INDEX IF EXISTS ${indexName}`,
            [],
            (error,response)=>{
                if (error) {
                    reject(error);
                }
                resolve(true);
            });
        })
    }


    static createIndex(indexName,tables,columns){
        return new Promise((resolve,reject)=> {
            db.query(
                `CREATE INDEX IF NOT EXISTS ${indexName} ON ${tables} (${columns}) `,
            [],
            (error,response)=>{
                if (error) {
                    reject(error);
                }
                resolve(true);
            });
        })
    }

    static getLastBlockDetail()
    {
        return new Promise((resolve,reject) => {
            // db.query(`SELECT btc_address,SUM((spend*-1) * amount - (spend-1) * amount) as balance, 0 as mintime, 0 as maxtime
            db.query(`SELECT block_height as "lastBlockHeight", to_timestamp(block_time) as "lastBlockTime"
             FROM block_details order by id DESC limit 1`,
                [],
                (error,response)=>{
                    if (error) {
                        console.log('error 11',error);
                        resolve('');
                    }
                    if (response.rows.length === 0) resolve('');
                    else resolve(response.rows[0]);
                })
        });
    }


    static getRichListTable(limits)
    {
        return new Promise((resolve,reject) => {
            // db.query(`SELECT btc_address,SUM((spend*-1) * amount - (spend-1) * amount) as balance, 0 as mintime, 0 as maxtime
            db.query(`SELECT btc_address as address, balance, to_timestamp(created_at) as created_at, to_timestamp(updated_at) as updated_at
             FROM richestAddresses order by balance DESC limit ${limits}`,
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

    static getRichestAddresses(tblName,limits)
    {
        return new Promise((resolve,reject) => {
            // db.query(`SELECT btc_address,SUM((spend*-1) * amount - (spend-1) * amount) as balance, 0 as mintime, 0 as maxtime
            db.query(`SELECT btc_address,SUM((spend*-1) * amount - (spend-1) * amount) as balance, MIN(created_time) as mintime, MAX(created_time) as maxtime
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
                `Truncate Table richestAddresses; 
                 INSERT INTO richestAddresses ( btc_address ,created_at, updated_at, balance) 
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
                `COPY ${table}(blockheight ,btc_address, created_time,spend_time, amount, spend, txid, vout)  FROM '${file}'
                DELIMITER ','  CSV QUOTE '"';
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

    static truncateTable(table) {
        return new Promise((resolve,reject)=> {
            db.query(
                `TRUNCATE ${table}`,
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
            this.truncateTable(table);
            db.query(
                `COPY ${table} ( txid, vouttx, vout, created_time)  FROM '${file}'
                DELIMITER ','  CSV QUOTE '"';
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
            this.truncateTable(table);
            db.query(
                `COPY ${table}(txid,outaddress,vout,amount,created_time) FROM '${file}'
                DELIMITER ','  CSV QUOTE '"';
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
            this.truncateTable(table);
            db.query(
                `COPY ${table}(id,block_height,txid,txseq) FROM '${file}'
                DELIMITER ',' CSV QUOTE '"';
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
            db.query(`Drop Table  IF EXISTS ${tblName}`,
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


    static insertTransaction(tablePartition,id,height,txid,counter) {
        return new Promise((resolve,reject)=> {
            db.query(
                `INSERT INTO ${'transactions_' + tablePartition} (id,block_height,txid,txseq) 
                    VALUES ($1,$2,$3,$4)`,
            [id,height,txid,counter],
            (error,response)=>{
                if (error) {
                    reject(error);
                }
                resolve(true);
            });
        })
    }


    static insertTransactionInput(addTablePartition,blockheight,btc_address,created_time,amount,txid,vout) {
        return new Promise((resolve,reject)=> {
            db.query(
                `INSERT INTO ${'addresses_' + addTablePartition} (blockheight,btc_address,created_time,amount,txid,vout) 
                    VALUES ($1,$2,$3,$4,$5,$6)`,
            [blockheight,btc_address,created_time,amount,txid,vout],
            (error,response)=>{
                if (error) {
                    reject(error);
                }
                resolve(true);
            });
        })
    }

    static transactionMarkSpent(addTablePartition,txid,vout,blkTime) {
        return new Promise((resolve,reject)=> {
            db.query(
                `update ${'addresses_' + addTablePartition} set spend=$1,spend_time=$2 where txid=$3 and vout=$4;`,
            [1,blkTime,txid,vout],
            (error,response)=>{
                if (error) {
                    reject(error);
                }
                resolve(true);
            });
        })
    }

    static getTransactionId(tablePartition,txid) {
        return new Promise((resolve,reject) => {
            db.query(`SELECT id FROM ${'transactions_' + tablePartition} where txid=$1`,
                [txid],
                (error,response)=>{
                    if (error) {
                        console.log('error 11',error);
                        resolve('');
                    }
                    if (response.rows.length === 0) resolve('');
                    else resolve(response.rows[0].id);
                })
        });
    }

    static query(sql){
        return new Promise((resolve,reject) => {
            db.query(sql,
                [],
                (error,response)=>{
                    if (error) {
                        console.log('error 12',error);
                        reject(error);
                    }
                    resolve(true);
                })
        });
    }


    static  BeginTransaction() {
        return new Promise((resolve,reject) => {
            db.query(`BEGIN`,
                [],
                (error,response)=>{
                    if (error) {
                        console.log('error 111',error);
                        resolve('');
                    }
                   resolve(true);
                });                     
        });
        
    }

    static  EndTransaction() {
        return new Promise((resolve,reject) => {
            db.query(`COMMIT`,
                [],
                (error,response)=>{
                    if (error) {
                        console.log('error 111',error);
                        resolve('');
                    }
                   resolve(true);
                });                     
        });
    }

    static async RollBack() {
                return new Promise((resolve,reject) => {
                    db.query(`ROLLBACK`,
                        [],
                        (error,response)=>{
                            if (error) {
                                console.log('error 111',error);
                                resolve('');
                            }
                           resolve(true);
                        });                     
                });
    }



    static getRichestMinimumBlance() {
        return new Promise((resolve,reject) => {
            db.query(`SELECT balance FROM richestAddresses order by balance limit 1`,
                [txid],
                (error,response)=>{
                    if (error) {
                        console.log('error 11',error);
                        resolve('');
                    }
                    if (response.rows.length === 0) resolve('');
                    else resolve(response.rows[0].balance);
                })
        });
    }


    static addressIsRich(address) {
        return new Promise((resolve,reject) => {
            db.query(`SELECT id FROM richestAddresses where btc_address=$1`,
                [address],
                (error,response)=>{
                    if (error) {
                        console.log('error 11',error);
                        resolve('');
                    }
                    if (response.rows.length === 0) resolve(false);
                    else resolve(true);
                })
        });
    }


    static getAddressDetails(address) {
        return new Promise((resolve,reject) => {

            vAddidx_ = address.trim().slice(-2); 
            addTablePartition = vAddidx_.charCodeAt(0) +''+ vAddidx_.charCodeAt(1); 
            db.query(
                `SELECT btc_address,SUM((spend*-1) * amount - (spend-1) * amount) as balance, MIN(created_time) as mintime, MAX(created_time) as maxtime
                FROM  ${'addresses_' + addTablePartition} where btc_address=$1 group by btc_address`,
                [address],
                (error,response)=>{
                    if (error) {
                        console.log('error 11',error);
                        resolve('');
                    }
                    if (response.rows.length === 0) resolve(false);
                    else resolve(response.rows);
                })
        });
    }


    
    static removeRichAddress(address) {
        return new Promise((resolve,reject) => {

            vAddidx_ = address.trim().slice(-2); 
            addTablePartition = vAddidx_.charCodeAt(0) +''+ vAddidx_.charCodeAt(1); 
            db.query(
                `DELETE FROM richestAddresses WHERE btc_address=$1`,
                [address],
                (error,response)=>{
                    if (error) {
                        console.log('error 11',error);
                        resolve('');
                    }
                    if (response.rows.length === 0) resolve(false);
                    else resolve(true);
                })
        });
    }


    static UpdateRichAddressDetails(addressDetails) {
        return new Promise((resolve,reject) => {
            db.query(
                `UPDATE richestAddresses SET balance=$1, created_at=$2, updated_at=$3 WHERE btc_address=$4`,
                [addressDetails.balance, addressDetails.mintime, addressDetails.maxtime, addressDetails.btc_address ],
                (error,response)=>{
                    if (error) {
                        console.log('error 11',error);
                        resolve('');
                    }
                    if (response.rows.length === 0) resolve(false);
                    else resolve(true);
                })
        });
    }

    static getRichestTable() {
        return new Promise((resolve,reject) => {
            db.query(
                `SELECT btc_address,balance,created_at,updated_at  FROM richestAddresses order by balance DESC limit 1000`,
                [],
                (error,response)=>{
                    if (error) {
                        console.log('error 11',error);
                        resolve('');
                    }
                    if (response.rows.length === 0) resolve(false);
                    else resolve(response.rows);
                })
        });
    }


    static getRichestAddressesBasedOnMinBalance(tblName,minRichBalance) {
        return new Promise((resolve,reject) => {
            db.query(`SELECT btc_address,SUM((spend*-1) * amount - (spend-1) * amount) as balance, MIN(created_time) as mintime, MAX(created_time) as maxtime
             FROM ${tblName} group by btc_address HAVING balance>$1 order by balance DESC limit ${limits}`,
                [minRichBalance],
                (error,response)=>{
                    if (error) {
                        console.log('error 11',error);
                        resolve('');
                    }
                    if (response.rows.length === 0) resolve([]);
                    else resolve(response.rows);
                })
        });
    }

    

}

module.exports = BlockChainModel;