var express = require('express');
var DiscoveryV1 = require('watson-developer-cloud/discovery/v1');
const fs = require('fs');
var request = require('request');
var async = require("async");
var router = express.Router();

var discovery = new DiscoveryV1({
  username: 'ef5b5f20-ee41-4717-bf9b-26f9c09e7085',
  password: 'kzrFJPbOjz20',
  version: 'v1',
  version_date: '2017-11-07'
});
var googleApiKey="AIzaSyABf-usWcp_qo6ysYZHibzU9pBsBOmGMeM";
var googleCX="014215834012603551619:nsgijffmcpc";
var collections=[
    //En esta, se ven los passages y hay modal con text
    {
      id:"633092a8-c2de-4bf4-8dd7-527694f81230",
      name:"Publicaciones"
    },
    // {
    //   id:"70b9925a-6385-4913-8c74-88e74327dd9d",
    //   name:"Legislación y normativas"
    // },

    //En  esta, se ve el html entero sin modal
    {
      id:"b30a5e16-ec48-43da-908f-4f459fae8087",
      name:"Respuestas"
    }
  ];
var title='Bienvenido al portal de Sanidad en Acuicultura del Ministerio de Ciencia y Tecnología';

router.get('/', function(req, res, next) {
  res.render('index', { title: title,text:"", collection:"" });
});
router.post('/', function (req, res) {
  /*
  Watson Discovery
  */


  var response=[];
  response.watson=[];
  response.google=[];
  var text=req.body.text;
  var collection=req.body.collection;
  if(collection==""){
    async.each(collections,function(item,callback){
      console.log("\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\nitem is",item);
      // Call an asynchronous function, often a save() to DB
      watsonDiscovery(text,item.name,function(data){
        console.log("data1 is:\n",JSON.stringify(data,null,2));
        response.watson=response.watson.concat(data);
        console.log("response1 is:\n",JSON.stringify(response,null,2));
        callback();
      });
      /*item.someAsyncCall(function (){
        // Async call is done, alert via callback
        callback();
      });*/
      },
      // 3rd param is the function to call when everything's done
      function(err){
        // All tasks are done now
        response.watson=sortByKey(response.watson,"score").slice(0,3);

        googleSearch(text,function(data){
          console.log("data2 is:\n",JSON.stringify(data,null,2));
          response.google=data;
          console.log("response2 is:\n",JSON.stringify(response,null,2));
          res.render('index',{title:title,response:response, text:req.body.text, collection:collection})
        });
      }
    );
  }else{

    watsonDiscovery(text,collection,function(data){
      console.log("\n\ndata3 is:\n",JSON.stringify(data,null,2));
      response.watson=data;
      googleSearch(text,function(data){
        response.google=data;
        console.log("response3 is:\n",JSON.stringify(response,null,2));
        res.render('index',{title:title,response:response, text:req.body.text, collection:collection})
      });
    });
  }

});








function watsonDiscovery(text,collection,callback){
    var watson=[];
    var query_options = {
      natural_language_query: text,
      environment_id: '28dc554d-3606-457f-942b-3de2c41db72d',
      collection_id: collections.find(item => {
            return item.name == collection;
          }).id,
      passages: true
    };
    //query_options['passages.fields'] = 'text,abstract,conclusion';
    query_options['passages.count'] = 3;
    query_options['passages.characters'] = 800;
    query_options['highlight'] = true;
    query_options['deduplicate.field'] = false;

    discovery.query( query_options , function(error, data) {
      if(error)
        res.render('index',{title:title,response:error, text:req.body.text, collection:collection}) ;
      saveFile(data,"discovery");
      if (data){
        console.log("data is:\n",JSON.stringify(data,null,2));
        for (i = 0; i < data.passages.length; i ++) {
          var document={};
          var item=data.passages[i];
          document.passage=item.passage_text;
          document.score=item.passage_score;
          document.id=item.document_id;
          document.element = data.results.find(item => {
            return item.id == document.id;
          });
          watson.push(document);
        }
        saveFile(watson,"Watson");
        callback(watson);
      }
    });
  }

function googleSearch(text,callback){
    var queryProperties = {
      q:text,
      key:googleApiKey,
      cx:googleCX
    };
    var url="https://www.googleapis.com/customsearch/v1"
    request({url:url, qs:queryProperties}, function(err, res, body) {
      if(err) { console.log(err); return; }
      console.log("body",body);
      console.log("aca",JSON.parse(body).items);
      var google=JSON.parse(body).items;
      saveFile(google,"google");
      callback(google.slice(0,3));
      //console.log(response.google);
  });
}

function sortByKey(array, key) {
    return array.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        return ((x > y) ? -1 : ((x < y) ? 1 : 0));
    });
}
var saveFile = function (data,name) {
      var content = JSON.stringify(data);
      fs.writeFile("./"+name+".json", content, 'utf8', function (err) {
          if (err)
              return console.log(err);
          console.log("The file was saved!");
      });
    }
module.exports = router;
