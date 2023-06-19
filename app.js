// --LOAD MODULESS 
var express = require("express"),
    mymods = require("./scripts/mymods.js"),
    body_parser = require("body-parser"),
    http = require("http");

const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, 'secrets', '.env') });

const aws = require('aws-sdk');
const S3_BUCKET = process.env.S3_BUCKET;
const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  });


aws.config.region = 'eu-central-1';

//var saveDropbox = mymods.saveDropbox;

// --INSTANTIATE THE APP
var app = express();

const subjects = {};
const starttime = Date.now();

// --STATIC MIDDLEWARE
app.use(express.static(__dirname + '/public'));
app.use("/js", express.static(__dirname + '/js'));
app.use("/dist", express.static(__dirname + '/dist'));
app.use("/scripts", express.static(__dirname + '/scripts'));
app.use(body_parser.json({ limit: "50mb" }));


const supportedBrowsers = ['Chrome', 'Safari', 'Edge', 'Firefox'];

const blockUnsupportedBrowsers = (req, res, next) => {
  const userAgent = req.headers['user-agent'];
  const browser = detectBrowser(userAgent);
  const deviceType = detectDeviceType(userAgent);
  
  if (!supportedBrowsers.includes(browser)) {
    return res.status(400).send('Unsupported browser, please use Chrome, Safari, Edge or Firefox.');
  }
  
  if (deviceType === 'mobile') {
    return res.status(400).send('Mobile devices are not supported, please use a PC or laptop.');
  }

  next();
};

const detectBrowser = (userAgent) => {
  if (/chrome/i.test(userAgent)) {
    return 'Chrome';
  } else if (/safari/i.test(userAgent)) {
    return 'Safari';
  } else if (/edge/i.test(userAgent)) {
    return 'Edge';
  } else if (/firefox/i.test(userAgent)) {
    return 'Firefox';
  } else {
    return 'Unknown';
  }
};

const detectDeviceType = (userAgent) => {
  if (/mobile/i.test(userAgent)) {
    return 'mobile';
  } else {
    return 'desktop';
  }
};

app.use(blockUnsupportedBrowsers);



// --VIEW LOCATONS
app.set("views", __dirname + "/public/views");
app.engine("html", require("ejs").renderFile);
app.set("veiw engine", "html");




app.set('port', (process.env.PORT || 3000));


app.get("/", function (request, response) {
    response.render("index.html");
})
app.post("/data", function (request, response) {
    //convert json to csv
    request.setTimeout(0);
    // DATA_CSV = json2csv(request.body);
    data = request.body;
    id = data[0].subject;
    console.log("id: ", id);

    // id = row[1].split(",")[Id_index];
    id = id.replace(/'/g, "");
    var currentdate = new Date();
    filename = Number(currentdate) + ".json";
    foldername = id;
    console.log("foldername: ", foldername);
    console.log("file: ", filename);
    filename = "philippines/"+foldername+"/"+filename;
    data = JSON.stringify(data);
    
    var data_s3 = {
        Bucket: S3_BUCKET,
        Key: filename,
        Body: data,
        ContentEncoding: 'base64',
        ContentType: 'application/json',
        ACL: 'public-read'
    };
    s3.upload(data_s3, function (err, data) {
        if (err) {
            console.log(err);
            console.log('Error uploading data: ', data);
        } else {
            console.log('succesfully uploaded!!!');
        }
    });
}
);

//app.post("/subject-status", function (request, response) {
//    console.log("sub_stat:", request.body);
//    subject_id = request.body.subject_id;
//    console.log("sub_stat:", subject_id);
//    status = request.body.status;
//    console.log("sub_stat_id: ");
//    subjects[subject_id] = status;
//    saveDropboxSingleFile(JSON.stringify(subjects), `subject_status_${starttime}.json`)
//    .then(() => console.log(`subjuct status recorded: ${subject_id},${status}`))
//    .catch(err => console.log(err));
//});


//start the server
app.listen(app.get('port'), function () {
    console.log("listening to port :", (process.env.PORT || 3000));
});
