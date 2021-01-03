var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose'); 

var UserSchema = new mongoose.Schema({
  username: {type:String,required:true,unique:true},
  firstname: {type:String,required:false,unique:false},
  lastname: {type:String,required:false,unique:false},
  email: {type:String,required:false,unique:true},
  date: {type:Date,required:false,unique:false},
  status:{type:String,required:false,unique:false}
},
 {timestamps: true},{collection:"user"});
UserSchema.plugin(passportLocalMongoose)
module.exports=mongoose.model('User', UserSchema);