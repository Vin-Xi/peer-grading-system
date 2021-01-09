# Peer-grading-system
A Student Teacher Learning Management System with Peer Grading Tools. </br>
https://www.geeksforgeeks.org/login-form-using-node-js-and-mongodb/ </br>

## Database Details & Credentials
```
Link: https://cloud.mongodb.com/v2/5fee05f659b35a2548917e74#clusters
Username: hsiddiqui.bscs18seecs@seecs.edu.pk 
password: hamdanrashid

```



const express=require("express"),
    mongoose=require("mongoose"),
    passport=require("passport"),
    bodyParser=require("body-parser"),
    LocalStrategy=require("passport-local"),
    passportLocalMongoose=require("passport-local-mongoose"),

    //Adding objects of collections
    User=require("./models/user")
    Course=require("./models/course")
    Enroll=require("./models/enrollCourses")

    const uri = "mongodb://maha:maharana@cluster0-shard-00-00.x89gb.mongodb.net:27017,cluster0-shard-00-01.x89gb.mongodb.net:27017,cluster0-shard-00-02.x89gb.mongodb.net:27017/peerGrading?ssl=true&replicaSet=atlas-vn0dri-shard-0&authSource=admin&retryWrites=true&w=majority";
    

//-------------------------Database Configuration-----------------------
mongoose.set('useNewUrlParser',true)
mongoose.set('useFindAndModify',false)
mongoose.set('useCreateIndex',true)
mongoose.set('useUnifiedTopology',true)
mongoose.connect(uri,{
    useNewUrlParser:true,
    useUnifiedTopology:true,
    useCreateIndex:true
}).then(() => {
    console.log("successfully connected");
}).catch((e) => {
    console.log(e);
})


//Connection Object can be used to fetch
const db=mongoose.connection
function getdata(username,callback){
    const query = { StudentName: "check2", enroll: false };
    console.log("ddd");
    console.log(username);  
    User.find(query,function(err, db){
        if(err) console.log(err);
        return callback(db)
    })
}
//------------------------Nodejs Configuration-----------------------------
let app=express()
app.set("view engine","ejs")
app.use(express.static("public/"))
app.use(bodyParser.urlencoded({extended:true}))
app.use(require("express-session")({
    secret:"handi is pandi",
    resave:false,
    saveUninitialized:false
}))

//------------------------------Setting Up Password for Encryption-----------------------------
app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())


app.use(express.urlencoded({ extended: true }));


// Creating collection
//inserting sample data in enroll collection


//----------------------------Render------------------------------------
app.get("/",function(req,res){
    res.render("register")
})

app.get("/data",function(req,res){
    getUserName(function(data){
        res.render("data",{"data":data})
    })
})

app.get("/secret",isLoggedIn,function(req,res){
    res.render("secret")
})

app.post("/register",function(req,res){
    let firstname=req.body.firstname
    let lastname=req.body.lastname
    let email=req.body.email
    let date=req.body.dateofbirth
    let username=req.body.username
    let password=req.body.password
    let status=req.body.status
    User.register(new User({
        firstname:firstname,
        lastname:lastname,
        email:email,
        date:date,
        username:username,
        status:status}),
    password,function(err,user){
        if(err){
            console.log(err)
            return res.render("register")
        }
        passport.authenticate("local")(
            req,res,function(){
                res.render("secret")
            })
        
    })
})

app.get("/login",function(req,res){
    res.render("login")
})

app.post("/login",passport.authenticate("local"),function(req,res){
    var username = req.user.username;
    //check whether user is student or teacher
    getProfileData(username,function(profile){
        if(profile[0].status == 'Teacher') {
            //get teachers own courses
            getTeacherCourses(username,function(courses){
                console.log("its a teacher");
                res.render("dashboard", {"status": profile[0].status , "courses": courses ,"username":profile[0].username})
            }) 
        }
        else {
            //get students enrolled courses
            console.log("student");
            getUserCourses(username,function(courses) {
                res.render("dashboard", {"status": profile[0].status ,"username":profile[0].username, "courses": courses})
            })
        }
    }) 
})


//courses enrolled
app.get("/enrollCourses",function(req,res){
     const username=req.user.username
    getUserUnenrollCourses(username,function(coursesList){ 
        var a=[];
        coursesList.forEach(function(course, i){
            a[i]=course.coursename;
        })
        console.log(a);
        getUnerolledCourses(a,function(courses){
            res.render('enrollCourses',{courses: courses});
        }) 
    });
})


app.get("/enrollStudents",function(req,res){
    const username=req.user.username
    getTeacherCourses(username,function(teacherCourses){
                var courseNames=[];
                teacherCourses.forEach(function(course, i){
                courseNames[i]=course.CourseName;
            })
                var check=[false];      
                getRequests(check,courseNames,function(coursess){
                    var StudentNames=[];
                    coursess.forEach(function(course, i){
                    StudentNames[i]=course.username;
                 })
                    res.render('enrollStudents',{courses: coursess});   
        });
    })
})
   
//Update Students enroll status (on accepting requests)
app.post("/requests",isLoggedIn,function(req,res) {
    var coursename = req.body.coursename;
    var username = req.body.username;
    console.log(username);
    var userCollection = db.collection('enrollcourses');
    userCollection.updateOne({username : username} , {$set: { enroll : true}})
    .then(item => {
      console.log("item saved to database");
      res.redirect("/enrollStudents")
    })
    .catch(err => {
      console.log(err);
    });
  });


//insert new course of student on enrolling in db
app.post("/addname",isLoggedIn,function(req,res) {
    var coursename = req.body.coursename;
    var username = req.user.username;
    console.log(username);
    var userCollection = db.collection('enrollcourses');
    userCollection.insertOne({ coursename:coursename,username:username,enroll:false})
    .then(item => {
      console.log("item saved to database");
      res.redirect("/enrollCourses")
    })
    .catch(err => {
      console.log(err);
    });
  });

app.get("/createCourse",function(req,res){
    res.render("createCourse")
})
// Adding into database
app.post("/createCourse",async (req,res) =>{
    try {
        const username=req.user.username;
        const CourseName=req.body.Cname;
        const Discription=req.body.discription;
        const check1 = new Course({
            username:username,
            CourseName:CourseName,
            Discription:Discription
        })
        const done = await check1.save();
        res.status(400).render("secret");
    } catch (error) {
       console.log(error)
    }
})



app.get("/logout",function(req,res){
    req.logout()
    res.redirect("/")
})

function isLoggedIn(req,res,next){
    if(req.isAuthenticated()) return next();
    res.redirect("/login")
}

//------------Example Function to fetch data --------------
function getUserName(callback){
    User.find(function(err,db){
       if(err) console.log(err);
            return callback(db)                
        })
}


//get userdata based on username
function getProfileData(username,callback){
    const query = { username: username};
    User.find(query,function(err, db){
        if(err) console.log(err);
       // console.log(db);
        return callback(db)
    })        
}

// ------------ Maha's Functions-------------
//get students enrolled courses
function getUserUnenrollCourses(username,callback){
    const query = {username: username};
    console.log(query);
    Enroll.find(query,function(err, db){
        if(err) console.log(err);
        return callback(db)
    })        
}

// get student unenrolled courses
function getUnerolledCourses(coursesList,callback){
    Course.find({CourseName: {$nin : coursesList}},function(err, db){
        if(err) console.log(err);
        return callback(db)
    })        
}

// get final students with pending requests (enroll=false)
function getRequests(finall,names,callback){
    Enroll.find({ $and: [ { enroll: { $in: finall } }, { coursename: { $in: names } } ] },function(err,db){
        if(err) console.log(err);
        return callback(db);
    })
}

//--------------end-------------------
    

//get courses based on teachername
function getTeacherCourses(username,callback){
    const query = {username: username};
    Course.find(query,function(err, db){
        if(err) console.log(err);
        return callback(db)
    })        
}


//get courses based on studentname
function getUserCourses(username,callback){
    const query = {username: username};
    Enroll.find(query,function(err, db){
        if(err) console.log(err);
        return callback(db)
    })        
}
//--------------------SERVER----------------------
let port=process.env.PORT || 3000
app.listen(port, function(){
    console.log("Server has started!")
})






