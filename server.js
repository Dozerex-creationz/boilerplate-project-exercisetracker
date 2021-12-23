const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose=require('mongoose');
mongoose.connect(process.env.mongo_URI,{useNewUrlParser:true})
const bodyParser=require('body-parser');
const middle=bodyParser.urlencoded({extended:false});
const dateMap=require("date");

app.use(cors());
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const exerciseSchema=new mongoose.Schema({
  username:String,
  description:String,
  duration:Number,
  date:String
});

const userSchema=new mongoose.Schema({
  username:String,
});

const logSchema=new mongoose.Schema({
  username:String,
  count:Number,
  log:[{
    description:String,
    duration:Number,
    date:String
  }]
});

var Exercise=new mongoose.model("Exercise",exerciseSchema);
var User=new mongoose.model("User",userSchema);
var Log=new mongoose.model("Log",logSchema);


app.get("/api/users",function(req,res){
  User.find({},function(err,data){
    res.send(data);
  })  
});

app.get("/api/users/:_id/logs/:from?/:to?/:limit?",function(req,res){
 var id=req.params._id;
 if(req.param.from.includes('-'))
 {
  var from=req.params.from;
  var to=req.params.to;
  var limit=req.params.limit;
 }
 else{
  var limit=req.params.from;
}
 if(from==undefined || to==undefined)
  Log.findById(id,function(err,data){
    if(limit!=undefined){
      data.logs=data.logs.slice(0,limit);
      res.send(data);
    }
    else{res.send(data);}
  })
});

app.post("/api/users",middle,function(req,res){
  var uName=req.body.username;
  console.log(uName);
  User.create({username:uName},function(err,data){
    res.send(data);
  });
});
app.post("/api/users/:_id/exercises",middle,function(req,res){
  var uid=req.body._id;
  var desc=req.body.description;
  var duration=req.body.duration;
  var date=req.body.date || Date.now();
  date=dateMap(date);
  Exercise.create({_id:uid,description:desc,duration:duration,date:date},function(err,data){
    res.send(data);
  });
});



const listener = app.listen(process.env.PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
