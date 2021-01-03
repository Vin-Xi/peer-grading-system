var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose'); 

var CourseSchema = new mongoose.Schema({
  CourseName: {type:String,required:true,unique:true},
  Discription: {type:String,required:true}
})

// creating collection
const course= new mongoose.model("course",CourseSchema);
module.exports = course;
