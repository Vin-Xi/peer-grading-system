const express = require("express"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    bodyParser = require("body-parser"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
    User = require("./models/user")
Course = require("./models/course")
Enroll = require("./models/enrollcourse")
Assignment = require("./models/assignment")
//const uri = "mongodb+srv://project1:project1@cluster0.ilcak.mongodb.net/project?retryWrites=true&w=majority";
//const uri = "mongodb+srv://hani:uhmi10149658@cluster0.4bvup.mongodb.net/<dbname>?retryWrites=true&w=majority";    //Hani's db
const uri = "mongodb+srv://user1:user123@cluster0.wm8lw.mongodb.net/peer-grading-system?retryWrites=true&w=majority"; //maira's db
//const uri = " mongodb+srv://maha:maharana@cluster0.x89gb.mongodb.net/peerGrading?retryWrites=true&w=majority"; //Maha's db

//-------------------------Database Configuration-----------------------
mongoose.set('useNewUrlParser', true)
mongoose.set('useFindAndModify', false)
mongoose.set('useCreateIndex', true)
mongoose.set('useUnifiedTopology', true)
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
}).then(() => {
    console.log("successfully connected");
}).catch((e) => {
    console.log(error);
})


//Connection Object can be used to fetch
let db = mongoose.connection


//------------------------Nodejs Configuration-----------------------------
let app = express()
app.set("view engine", "ejs")
app.use(express.static("public/"))
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(require("express-session")({
    secret: "handi is pandi",
    resave: false,
    saveUninitialized: false
}))

//------------------------------Setting Up Password for Encryption-----------------------------
app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())


//----------------------------Render------------------------------------
app.get("/", function (req, res) {
    res.render("register")
})

app.get("/data", function (req, res) {
    getUserName(function (data) {
        res.render("data", {
            "data": data
        })
    })
})

app.get("/secret", isLoggedIn, function (req, res) {
    res.render("secret")
})

app.post("/register", function (req, res) {
    let firstname = req.body.firstname
    let lastname = req.body.lastname
    let email = req.body.email
    let date = req.body.date
    let username = req.body.username
    let password = req.body.password
    let status = req.body.status
    console.log(status + " " + date)
    User.register(new User({
            firstname: firstname,
            lastname: lastname,
            email: email,
            date: date,
            username: username,
            status: status
        }),
        password,
        function (err, user) {
            if (err) {
                console.log(err)
                return res.render("register")
            }
            passport.authenticate("local")(
                req, res,
                function () {
                    res.render("login")
                })

        })
})

app.get("/login", function (req, res) {
    res.render("login")
})

app.post("/login", passport.authenticate("local"), function (req, res) {
    var username = req.user.username;
    //check whether user is student or teacher
    getProfileData(username, function (profile) {
        if (profile[0].status == 'Teacher') {
            //get teachers own courses
            getTeacherCourses(username, function (courses) {
                console.log("its a teacher");
                res.render("dashboard", {
                    "status": profile[0].status,
                    "courses": courses,
                    "username": profile[0].username
                })
            })
        } else {
            //get students enrolled courses
            console.log("student");
            getUserCourses(username, function (courses) {
                res.render("dashboard", {
                    "status": profile[0].status,
                    "username": profile[0].username,
                    "courses": courses
                })
            })
        }
    })
})

app.get("/logout", function (req, res) {
    req.logout()
    res.redirect("/")
})

app.get("/createCourse", function (req, res) {
    res.render("createCourse", {
        "username": req.user.username
    })
})

// Adding into database
app.post("/createCourse", async (req, res) => {
    try {
        const coursename = req.body.Cname;
        const description = req.body.description;
        const username = req.user.username;
        const check1 = new Course({
            username: username,
            coursename: coursename,
            description: description
        })
        const done = await check1.save();

        //check whether user is student or teacher
        getProfileData(username, function (profile) {
            if (profile[0].status == 'Teacher') {
                //get teachers own courses
                getTeacherCourses(username, function (courses) {
                    console.log("its a teacher");
                    console.log(courses);
                    res.render("dashboard", {
                        "status": profile[0].status,
                        "courses": courses,
                        "username": profile[0].username
                    })
                })
            } else {
                //get students enrolled courses
                console.log("student");
                getUserCourses(username, function (courses) {
                    res.render("dashboard", {
                        "status": profile[0].status,
                        "username": profile[0].username,
                        "courses": courses
                    })
                })
            }
        })
    } catch (error) {
        console.log(error)
    }
})

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/login")
}

//------------Example Function to fetch data --------------
function getUserName(callback) {
    User.find(function (err, db) {
        if (err) console.log(err);
        return callback(db)
    })
}

//--------------------SERVER----------------------
let port = process.env.PORT || 3000
app.listen(port, function () {
    console.log("Server has started!")
})

//-----------------ADDED BY MAIRA----------------------


var multer = require('multer');
var path = require('path');
var fs = require('fs');
var docStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/docs');
    },
    filename: function (req, file, cb) {
        var originalname = file.originalname;
        var extension = originalname.split(".");
        //filename= originalname;
        filename = Date.now() + '.' + extension[extension.length - 1];
        cb(null, filename);
    }
});


app.get("/add-assignment", function (req, res) {
    res.render("add-assignment");
})


// takes data from Add assignment form and adds object to database
app.post(
    "/add-assignment",
    multer({
        storage: docStorage,
        dest: "uploads/docs"
    }).single("file"),
    function (req, res) {
        console.log(req.body);

        var questions = [];
        var filepath = "";
        var markingScheme;
        if ((req.body.type == "mcq")) {
            for (let index = 0; index < req.body.mcqs; index++) {
                var optionName = "option" + index;
                var ques = {
                    text: req.body.question[index],
                    answer: req.body.answer[index],
                    marks: req.body.quesMarks[index],
                    options: req.body[optionName],
                };
                questions.push(ques);
            }
        } else if ((req.body.type == "doc")) {
            filepath = req.file.path;
            if (req.body.grading == 'peer') {
                markingScheme = req.body.criteria;
                console.log("crit: " + req.body.criteria)
                console.log("marking: " + markingScheme)
            }
        }
        console.log("Questions object: " + questions);
        try {
            const assignment = new Assignment({
                title: req.body.title,
                description: req.body.desc,
                dueDate: req.body.duedate,
                totalMarks: req.body.marks,
                grading: req.body.grading,
                type: req.body.type,
                filePath: filepath,
                //courseID: {type:ObjectId,required:true,unique:false},
                attemptedBy: [],
                questions: questions,
                markingScheme: markingScheme
            });
            const done = assignment.save();

            res.render("home");
        } catch (err) {
            console.log("Error POST add-assignment: " + err);
        }
    }
);

app.get("/assignment-student", function (req, res) {
    // var id= "5ff48d1f570efc2ce1c6c110"; //for doc assignment
    var id = "5ff4c931c04e48114d3ea898"; //for mcq assignment
    try {
        getAssignmentData(id, function (assignment) {
            console.log("assignment received: " + assignment)
            res.render("assignment-student", {
                data: assignment
            });


        })
    } catch (error) {
        console.log(error)
    }
})


app.post("/assignment-student", multer({
    storage: docStorage,
    dest: "uploads/docs"
}).single("file"), function (req, res) {
    //  CODE TO DOWNLOAD FILE
    if (req.body.reqType == 'download') {

        var file = req.body.filePath;
        var extension = file.split(".");
        var filename = req.body.fileName + '.' + extension[extension.length - 1];

        res.download(file, filename, function (err) {
            if (err) {
                console.log("Error");
                console.log(err);
            } else {
                console.log("Success");
            }
        });
    }

    //Code to upload submission
    else if (req.body.reqType == 'upload') {
        var filepath = req.file.path;
        var id = "5ff48d1f570efc2ce1c6c110";
        const filter = {
            _id: id
        }
        var name = "moora"
        var update = {
            "$push": {
                attemptedBy: {
                    student: "5ff46e865bf6ee2e810522fb",
                    filePath: filepath,
                    marked: false
                }

            }
        }

        console.log("Upload file: " + filepath)
        //update code to push elements in array
        Assignment.updateOne(filter, update, function (
            err,
            result
        ) {
            if (err) {
                console.log("Error: " + err)
            } else {
                console.log("Successfully inserted")
            }
        })
    }
    //MCQ Answers 
    else if (req.body.reqType == 'mcq') {
        var id = "5ff4c931c04e48114d3ea898"; //PENDING 
        var filter = {
            _id: id
        }

        var answersArr //to be pushed into attemptedBy attribute of db
        //var studentID=req.body.studentID; 
        console.log("MCQs received!")
        answersArr = JSON.parse(JSON.stringify(req.body)) //get rid of [Object: null prototype] error
        delete answersArr.reqType;
        console.log(answersArr)
        var answers = new Array;
        for (var key in answersArr) {
            var value = answersArr[key];
            var x = {
                question: key,
                answer: value
            }
            answers.push(x)
        }
        var update;
        //calculate Marks
        try{
     getAssignmentData(id, function (assignment) {
         var marks= calculateMarks(answers,assignment);
         update = {
            // "$push":{
            attemptedBy: {
                student: "5ff46e865bf6ee2e810522fb", //PENDING: REPLACE BY PASSED VALUE
                answers: answers,
                marked: true,
                marks:marks
            }
        }
        Assignment.updateOne(filter, update, function (
            err,
            result
        ) {
            if (err) {
                console.log("Error: " + err)
            } else {
                console.log("Successfully inserted")
            }
        })
        
        })}catch(err){
            console.log("err"+err)
        }
        console.log(answers)
   
        }
   
    res.render("home")
})

function calculateMarks(answers,assignment){
    var marks=0;
    console.log("Answers in function "+answers)
    console.log("Answers len "+answers.length)
   
            console.log("Assignment object: "+ assignment[0].questions)

            for (let i = 0; i < answers.length; i++) {
                var quesID=answers[i].question;
                //look for this id in assignment
                for (var x=0; x < assignment[0].questions.length; x++) {

                    if (assignment[0].questions[x]._id == quesID) {
                        console.log("in if")
                        //compare answers
                        if(assignment[0].questions[x].answer==answers[i].answer){
                            marks=marks+assignment[0].questions[x].marks;
                            console.log("Correct!"+marks)
                        }
                    }
                }
                
            }
  
        return marks;
}
//-------------------END OF SECTION ADDED BY MAIRA----------------------------



//----------------UMEHANI CODE------------------------------
const moment = require('moment');
const assignment = require("./models/assignment");

app.get("/dashboard", function (req, res) {
    var username = req.user.username;
    //check whether user is student or teacher
    getProfileData(username, function (profile) {
        if (profile[0].status == 'Teacher') {
            //get teachers own courses
            getTeacherCourses(username, function (courses) {
                res.render("dashboard", {
                    "status": profile[0].status,
                    "courses": courses,
                    "username": profile[0].username
                })
            })
        } else {
            //get students enrolled courses
            getUserCourses(username, function (courses) {
                res.render("dashboard", {
                    "status": profile[0].status,
                    "username": profile[0].username,
                    "courses": courses
                })
            })
        }
    })
})

app.post("/dashboard", function (req, res) {
    var username = username;
    //check whether user is student or teacher
    getProfileData(username, function (profile) {
        if (profile[0].status == 'Teacher') {
            //get teachers own courses
            getTeacherCourses(username, function (courses) {
                console.log("its a teacher");
                res.render("dashboard", {
                    "status": profile[0].status,
                    "courses": courses,
                    "username": profile[0].username
                })
            })
        } else {
            //get students enrolled courses
            console.log("student");
            getUserCourses(username, function (courses) {
                res.render("dashboard", {
                    "status": profile[0].status,
                    "username": profile[0].username,
                    "courses": courses
                })
            })
        }
    })
})

//request to load profile page
app.get("/profile", isLoggedIn, function (req, res) {
    console.log(req.user.username);
    getProfileData(req.user.username, function (data) {
        res.render("profile", {
            "data": data
        })
    })
})

//updating profile
app.post("/profile", isLoggedIn, function (req, res) {
    var username = req.body.username
    var firstname = req.body.firstname
    var lastname = req.body.lastname
    var email = req.body.email
    var date = req.body.date
    var myquery = {
        username: username
    };
    var newvalues = {
        $set: {
            firstname: firstname,
            lastname: lastname,
            email: email,
            date: date
        }
    };
    User.updateOne(myquery, newvalues, function (err, user) {
        if (err) throw err;
        getProfileData(username, function (data) {
            data.date = moment(data.date).utc().format("YYYY-MM-DD")
            console.log(data.date);
            res.render("profile", {
                "data": data
            })
        })
    })
})

//get userdata based on username
function getProfileData(username, callback) {
    const query = {
        username: username
    };
    User.find(query, function (err, db) {
        if (err) console.log(err);
        console.log(db);
        return callback(db)
    })
}

//get courses based on studentname
function getUserCourses(username, callback) {
    const query = {
        username: username
    };
    Enroll.find(query, function (err, db) {
        if (err) console.log(err);
        return callback(db)
    })
}

//get courses based on teachername
function getTeacherCourses(username, callback) {
    const query = {
        username: username
    };
    Course.find(query, function (err, db) {
        if (err) console.log(err);
        return callback(db)
    })
}


//get assignment based on assignment ID 
function getAssignmentData(id, callback) {
    const query = {
        _id: id
    };
    Assignment.find(query, function (err, db) {
        if (err) console.log(err);
        console.log(db);
        return callback(db)
    })
}
//get courses not for this user
//function exploreCourses(callback){
//  const query = {coursename:coursename}
//Course.find(function(err,db){
//  if (err) console.log(err);
//  return callback(db);
//   })
//}