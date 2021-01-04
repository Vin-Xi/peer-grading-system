var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose'); 

var CourseSchema = new mongoose.Schema({
  username: {type:String,required:true,unique:false},
  coursename: {type:String,required:true,unique:true},
  description: {type:String,required:true}
},{collection:"Course"});

// creating collection
const course= new mongoose.model("Course",CourseSchema);
module.exports = course;
