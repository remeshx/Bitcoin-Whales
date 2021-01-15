const {Router} = require('express');
const Api = require('../Controllers/api/index');

router = new Router();

router.get('/test', (req,res, next)=> {
    res.json({message: Api.getApiOutput()});
});

module.exports = router;



