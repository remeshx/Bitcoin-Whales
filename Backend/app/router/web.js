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
    Blockchain.getLastBlock(res.io).then(str=>{
        
        res.json(str);
    })
});


module.exports = router;



