var express = require('express');
var router = express.Router();

var parkingHistoryRoute = require('./parking-history-route');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/parking/history',parkingHistoryRoute);

module.exports = router;
