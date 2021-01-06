const { ObjectID, ObjectId } = require('bson');
var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose'); 

var AssignmentSchema = new mongoose.Schema({
  title: {type:String,required:true,unique:false},
  description: {type:String,required:false,unique:false},
  dueDate: {type:Date,required:true,unique:false},
  totalMarks: {type:Number,required:true,unique:false},
  grading: {type:String,required:true,unique:false},
  type: {type:String,required:true,unique:false},
  filePath: {type:String,required:false,unique:false},
  markingScheme:[{type:String,required:false,unique:false}],
  courseID: {type:ObjectId,required:false,unique:false}, //PENDING--CHANGE TO TRUE
  attemptedBy: [{
    student:{type:ObjectId,required:false,unique:false},
    filePath:{type:String,required:false,unique:false},
    marks: {type:Number,required:true,unique:false},
    marked:{type:Boolean,required:true,unique:false},
    answers: [{
      question:{type:ObjectId,required:false,unique:false},
      answer:{type:String,required:true,unique:false},
    }],
   // answers:[{type:Mixed,required:true,unique:false}]
  }],
  questions: [
      {
      text:{type:String,required:false,unique:false},
      answer:{type:String,required:false,unique:false},
      marks:{type:Number,required:false,unique:false},
      options:[{type:String,required:false,unique:false}],
    }
    ]
});

module.exports=mongoose.model('Assignment', AssignmentSchema)