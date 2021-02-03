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
                    console.log('error',error);
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
                    console.log('error',error);
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
                    console.log('error',error);
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
                    console.log('error',error);
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
                    console.log('error',error);
                    reject(error);
                }
                resolve(true);
            });
        })
    }

    static saveAddress(addressId,transactionId,vout,amount) {
        return new Promise((resolve,reject)=> {
            db.query(
                `INSERT INTO adresses_input ( address_id, txid, vout, amount) 
                    VALUES ($1, $2, $2, $3 ,$4);`,
            [addressId,transactionId,vout,amount],
            (error,response)=>{
                if (error) {
                    console.log('error',error);
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
                `INSERT INTO adresses_input ( addressid, txid, vout, amount) 
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
                    if (error) reject(error);
                    if (response.rows.length === 0) return reject(new Error('ERROR, No transaction found ' + txid));
                    resolve(response.rows[0].id);
                })
        });
    }

    static getAddressKey(txKey){
        return new Promise((resolve,reject) => {
            db.query(`SELECT addressid,amount
            FROM adresses_input
            WHERE txid = $1`,
                [txKey],
                (error,response)=>{
                    if (error) reject(error);
                    if (response.rows.length === 0) return reject(new Error('ERROR, No addressid found ' + txKey));
                    resolve({id: response.rows[0].addressid, amount : response.rows[0].amount} );
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
                    if (error) reject(error);
                    if (response.rows.length === 0) return reject(new Error('ERROR, No btc_address found ' + addKey));
                    resolve(response.rows[0].btc_address);
                })
        });
    }


    
}

module.exports = BlockChainModel;