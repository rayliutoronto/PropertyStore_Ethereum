var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var Minio = require('minio')

var minioClient = new Minio.Client({
    endPoint: 'localhost',
    port: 9000,
    secure: false,
    accessKey: 'O8DI0VBM5VVK8Q896S2A',
    secretKey: 'AplL5LQY4uF4ErqXzg/rmkoOEXovm5BRVqsRHaVe'
});

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));
app.use(bodyParser.json());
// simple cors
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

var upload = function(res, filename, content){
    minioClient.putObject('mybucket', filename, content, function(err, etag) {
        if(err) return console.log(err, etag);

        res.json({ etag: etag });
    });
};

router.post('/upload/:filename', function(req, res) {
    console.log(req.params.filename);
    console.log(req.body.originalname);
    console.log(req.body.content);

    minioClient.bucketExists('mybucket', function(err, exists) {
        if (err) {
          return res.status(500).send(err);
        }
        if (!exists) {
            minioClient.makeBucket('mybucket', 'us-east-1', function(err) {
                if (err) return res.status(500).send(err);
                
                upload(res, req.params.filename, req.body.originalname + '!#$#!' + req.body.type + '!#$#!' + req.body.content);
              });
        }else{
            upload(res, req.params.filename, req.body.originalname + '!#$#!' + req.body.type + '!#$#!' + req.body.content);
        }
    });
});

router.get('/upload/:filename', function(req, res) {
    var content = '';

    minioClient.getObject('mybucket', req.params.filename, function(err, dataStream) {
        if(err) {
            // simple error handling
            return res.status(500).send(err);
        }

        dataStream.on('data', function(chunk) {
            content += chunk;
        });
        dataStream.on('end', function() {
            var result = content.split('!#$#!');
            res.json({originalname: result[0], type: result[1], content: result[2]});
        });
        dataStream.on('error', function(e) {
            res.status(500).send(err);
        });    
    });
});

// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Listening on port ' + port);


