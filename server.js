const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
app.use(express.json()); // Used to parse JSON bodies
app.use(express.urlencoded()); // Parse URL-encoded bodies using query-string library
// or
app.use(express.urlencoded({ extended: true }));
const mongo = require('mongodb');
const mongoose = require('mongoose');
mongoose.connect(process.env.Mongo_URI, { useNewUrlParser: true });
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
const getUrl=(req)=>{console.log("URL"+req.originalUrl);}
const userSchema = mongoose.Schema({
  username: String
});
const logSchema = mongoose.Schema({
  username: String,
  _id: String,
  count: Number,
  log: [{
    description: String,
    duration: Number,
    date: String,
    _id:false
  }]
}, { versionKey: false });
const exerciseSchema = mongoose.Schema({
  "_id": String,
  username: String,
  description: String,
  duration: Number,
  date: String
}, { versionKey: false });

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);
const Log = mongoose.model("Log", logSchema);



app.post("/api/users", (req, res) => {

  const name = req.body.username;
  User.create({ username: name }, (err, data) => {
    if(err)console.log(err);
    data.save((err, datam) => {
      if(err)console.log(err);
      Log.create({ "_id": datam._id, username: name, count: 0, log: [] }, (err, datom) => {
        if (err) {
          console.log(err);
        }
        res.json(datam);
        console.log("post users called");
      });
      
    });
  })
})
app.post("/api/users/:_id/exercises", (req, res) => {

  const id = req.params._id;
  const desc = req.body.description;
  const dur = parseInt(req.body.duration);
  const now = new Date();
  const given = req.body.date;

  var dat;
  if (!given) {
    dat = now;
  }
  else {
    dat = new Date(given);
  }
  dat += "";
  dat = dat.slice(0, 15);
  var name = "";
  User.findOne({ "_id": id }).select("username").exec((err, data) => {
    if (err) {
      res.json({ error: "No such username" });
    }
    name += data.username;

    const doc = { "_id": id, username: name, description: desc, duration: dur, date: dat };
    const docs = { description: desc, duration: dur, date: dat };

    Log.findOneAndUpdate({ "_id": id }, { new: true }, (err, exe) => {
      if (err) {
        console.log(err);
      }
      exe.count++;
      exe.log.push(docs);
      exe.save((err, datame) => {
        Exercise.findOneAndUpdate({ "_id": id }, { new: true }, (err, data) => {
          if (data == null) {
            Exercise.create(doc, (err, docum) => {
              if (err) console.log(err);
              docum.save((err, data) => {
                if (err) console.log(err);
                res.json(data);
              })
            })
          }
          else {
            data.description = docs.description;
            data.duration = docs.duration;
            data.date = docs.date;
            data.save((err, data) => {
              if (err) console.log(err);
              res.json(data);
            })
          }
        })
      });
              console.log("post exercises called");

    })
  })
})

app.get("/api/users", (req, res) => {
  User.find({}, (err, data) => {
    res.json(data);
            console.log("get users called");

  })
});

app.get("/api/users/:_id/logs/:from?/:to?/:limit?",(req, res) => {
  console.log("start tested");
  const id = req.params._id;
  const dfrom = req.query.from || "";
  const dto = req.query.to || "";
  var log = [""];
  var des, dur, dt;
  var cnt = 0;
  console.log(req.originalUrl);
  var limit = req.query.limit;
  Log.findOne({ "_id": id }, (err, dat) => {
    if (dfrom == "") {
      limit = req.query.limit;
      
      if(limit==null){
          limit=dat.log.length;
      }
      console.log(limit);
      dat.log=dat.log.slice(0,limit);
      dat.count=limit;
      res.json(dat);
      console.log("over1: "+dat);
    }
    else {
      console.log("else block");
      const gte = new Date(dfrom);
      const lt = new Date(dto);
      console.log(gte + "   " + lt);
      limit = req.query.limit;
      Log.findOne({"_id":id, date: { $gte: gte, $lt: lt } }, (err, data) => {
        console.log("into the find");
        if(limit==null){
          limit=data.log.length;
          console.log(limit)
        }
        data.count=limit;
        data.log=data.log.slice(0,limit);
        res.json(data);
        console.log("over: "+data);
      })
    }
  })
  console.log("hell passed");
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
