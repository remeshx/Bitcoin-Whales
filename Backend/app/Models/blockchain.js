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

    static SaveBlock(height,blockTime,blockHash,txCount,fee,maxFee,minFee,rewardAddress) {
        return new Promise((resolve,reject)=> {
            db.query(
                `INSERT INTO block_details ( block_height,block_time, block_hash,tx_count,block_fee,max_fee,min_fee,reward_address_id) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
            [height,blockTime,blockHash,txCount,fee,maxFee,minFee,rewardAddress],
            (error,response)=>{
                if (error) {
                    console.log('error',error);
                    reject(error);
                }
                resolve(true);
            });
        })
    }

    static saveAddress(address,height) {
        return new Promise((resolve,reject)=> {
            db.query(
                `INSERT INTO address_blocks ( address_id, block_height) 
                    VALUES ($1, $2);`,
            [address,height],
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