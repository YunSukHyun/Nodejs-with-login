var router = require('express').Router();

function isLogin(req, res, next){
    if(req.user){
        next()
    } else{
        res.send('U didn\'t login');
    }
}

router.use(isLogin);

router.get('/shirts', isLogin, function(req, res){
    res.send('Page Selling Shirts');
})

router.get('/pants', isLogin, function(req, res){
    res.send('Page Selling pants');
})

module.exports = router;