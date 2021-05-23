const {Router} = require('express');
const Api = require('../Controllers/api/index');
const Blockchain = require('../Controllers/api/blockChain');

router = new Router();

router.get('/test', (req,res, next)=> {
    Api.getApiOutput().then(str=>{
        res.json({message: str});
    });
});

router.get('/setting', (req,res, next)=> {
    Api.loadSettings().then(str=>{
        res.json({message: str});
    })
});

router.get('/blockchain/LastBlockHeightRead', (req,res, next)=> {
    Blockchain.getLastBlock(res.io).then();
    res.json(str);
});

router.get('/blockchain/checkForNewblocks', (req,res, next)=> {
    Blockchain.checkForNewblocks_new(res.io).then(str=>{
        res.json({msg: str});
    })
});

router.get('/blockchain/savefiles', (req,res, next)=> {
    Blockchain.WriteTrxFilesToDB(res.io).then(str=>{
        res.json({msg: str});
    })
});

router.get('/blockchain/updatespent', (req,res, next)=> {
    Blockchain.updateSpentTransactions(res.io).then(str=>{
        res.json({msg: str});
    })
});

router.get('/blockchain/findwhalesaddresses', (req,res, next)=> {
    Blockchain.findWhalesAddresses(res.io).then(str=>{
        res.json({msg: str});
    })
});

module.exports = router;



