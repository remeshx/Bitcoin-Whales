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



    static saveInputs(values) {
        return new Promise((resolve,reject)=> {
            db.query(
                `INSERT INTO inputs ( blockheight ,txid, vouttxidx, vouttxid, vout) 
                    VALUES ${values}`,
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


    static saveOutputs(values) {
        return new Promise((resolve,reject)=> {
            db.query(
                `INSERT INTO outputs ( blockheight , txidx, txid, outaddress, vout, amount) 
                    VALUES ${values}`,
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

    
}

module.exports = BlockChainModel;