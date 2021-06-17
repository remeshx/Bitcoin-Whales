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
}

module.exports = BlockChainModel;