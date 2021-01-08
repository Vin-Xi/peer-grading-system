var mongoose = require('mongoose');

var enrollCourseSchema = new mongoose.Schema({
  coursename: {type:String,required:true},
  username: {type:String,required:true},
  enroll:{type:Boolean,required:true},
})

// creating collection
const enroll= new mongoose.model("enrollcourse",enrollCourseSchema);
module.exports = enroll;