const fetch = require('node-fetch');
const settingModel = require('../Models/settings');

new Promise ((resolve,reject)=>{
     settingModel.loadSetting('BitcoinNode').catch(error=>reject(error))
});
global.transactions=[];


function getLastBlock() {

    console.log('getLastBlock ');
    return new Promise((resolve,reject)=>{
        callNode('getblockcount',[])
        .then(response => {
            console.log('getLastBlock',response.result);
            resolve(response.result);
        })
        .catch(error => reject(error));
    });

}


function getBlockHash(blockHeight) {
    //console.log('getBlockHash : ',blockHeight);
    return new Promise((resolve,reject)=>{
        callNode('getblockhash',[blockHeight])
        .then(response => {
            //console.log('response',response);
            resolve(response);
        })
        .catch(error => reject(error));
    });
}


function getBlock(blockHash) {
    console.log('getBlock : ',blockHash);
    return new Promise((resolve,reject)=>{
        callNode('getblock',[blockHash,2])
        .then(response => {
            //console.log('response',response);
            resolve(response);
        })
        .catch(error => reject(error));
    });
}

function getBlockByHeight(blockHeight) {

    return new Promise((resolve,reject)=>{
        getBlockHash(blockHeight)
        .then(response => getBlock(response.result))
        .then(response => resolve(response))
        .catch(error => reject(error));
    });       
}


function gettransaction(txid) {
    
    return new Promise((resolve,reject)=>{
        for (tx in global.transactions){
            
            if (tx.id==txid) {
                console.log('transaction exists : ',txid);
                resolve(tx.transactionDetails);
            }
        }
        
        callNode('getrawtransaction',[txid,true])
        .then(response => {
            //console.log('response',response);
            //console.log('getrawtransaction : ',txid);
            if (response)
            global.transactions.push({id:txid,transactionDetails : response});
            resolve(response);
        })
        .catch(error => reject(error));
    });   
}

function deriveaddresses(hex,type) {
    //drive the address base on the type and hex input of vout in a transaction if there are not any address listed in the vout
    //console.log('deriveaddresses' + hex + ' - ' +type);
    return new Promise((resolve,reject)=>{
        let pubkey = '';
        let desc = ''
        switch(type){
            case 'pubkey': {
                pubkey = hex.substring(2, hex.length-2);
                desc = `pk(${pubkey})`;
                //console.log('desc111',desc);
                break;}
            case 'nonstandard': {
                //pubkey = hex.substring(2, hex.length-2);
                
                console.log('error Addrress : ' + type);
                resolve( 'errorAddress');
                
                //console.log('desc111',desc);
                break;}
            case 'nulldata': {
                //pubkey = hex.substring(2, hex.length-2);
                
                console.log('error Addrress : ' + type);
                resolve( 'errorAddress');
                
                //console.log('desc111',desc);
                break;}
            default : {
                console.log('error type : ' + type);
                throw error('error type : ' + type);
            }
        }
        if (type=='nonstandard') {
            resolve('errorAddress');
        }
        //console.log('desc',desc);
        callNode('getdescriptorinfo',[desc])
        .then(response => {
            // console.log('deriveaddresses',response);
            // console.log('descriptor',response.result.descriptor);
            if (!response.result) resolve('Unable to decode output address');
            callNode('deriveaddresses',[response.result.descriptor])
            .then(response => {
                //console.log('Address:',response);
            
                resolve(response.result[0]);
            })
        })
        .catch(error => reject(error));
    });
 }


function callNode(method,params=[]) {
    const nodeurl = 'http://' + global.settings['BitcoinNode_USERNAME'] + ':' + global.settings['BitcoinNode_PASSWORD'] + '@' + global.settings['BitcoinNode_IPPORT'];
    let parameters = {"jsonrpc": "1.0", "id":method, "method": method, "params": params};
    return new Promise((resolve,reject)=>{
        fetch( nodeurl , { 
            method: "POST", 
            body: JSON.stringify(parameters),  
            headers: { 
                "Content-type": "application/json; charset=UTF-8"
            } 
        })
        .then(res => res.json())
        .then(response => {
            //console.log('response',response);
            resolve(response);
        }) 
        .catch(error => reject(error));
    });
}



module.exports = {getLastBlock, getBlockHash , getBlock, getBlockByHeight, gettransaction, deriveaddresses}
