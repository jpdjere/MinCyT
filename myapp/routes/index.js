var express = require('express');
var DiscoveryV1 = require('watson-developer-cloud/discovery/v1');
var router = express.Router();

var discovery = new DiscoveryV1({
  username: '78e1385f-7742-43e6-ab0e-9cac919c4fa7',
  password: 'EKtR1evBAZny',
  version: 'v1',
  version_date: '2017-11-07'
});
var title='Bienvenido al portal de Sanidad en Acuicultura del Ministerio de Ciencia y Tecnología';
// 
//https://watson-discovery.bluemix.net/regions/us-south/services/d376765f-5132-445b-a823-87ce58723ab6/environments/3cc67280-8c4e-4edf-a342-171c8ef032d8/collections/aebaa4a3-505b-4c95-bb67-41c255eaf543/manage/overview
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: title });
});
router.post('/', function (req, res) {
  var text=req.body.text;
  var query_options={
    query:text,
    passages:true,
    highlight:true,
    count:1
  };
  discovery.query({ environment_id: '3cc67280-8c4e-4edf-a342-171c8ef032d8', collection_id: 'aebaa4a3-505b-4c95-bb67-41c255eaf543', query: query_options }, function(error, data) {
    if(error)
      res.render('index',{title:title,response:error}) ;
    console.log(JSON.stringify(data, null, 2));
    res.render('index',{title:title,response:data})
  });
});

module.exports = router;