var mongoose = require('mongoose');

var enrollCourseSchema = new mongoose.Schema({
  coursename: {type:String,required:true},
  username: {type:String,required:true},
})

// creating collection
module.exports = mongoose.model('enrollcourse',enrollCourseSchema);