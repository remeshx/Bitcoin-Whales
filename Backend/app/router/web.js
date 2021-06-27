const {Router} = require('express');
const Api = require('../Controllers/api/index');
router = new Router();

router.get('/getLoadingStatus', (req,res, next)=> {
    Api.getLoadingStatus(res.io).then(str=>{
        res.json(str);
    })
});

router.get('/getRichListStatus', (req,res, next)=> {
    Api.getRichListStatus(res.io).then(str=>{
        res.json(str);
    })
});




module.exports = router;



