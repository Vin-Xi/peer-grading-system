const   express = require("express"),
        mongoose = require("mongoose"),
        passport = require("passport"),
        bodyParser = require("body-parser"),
        LocalStrategy = require("passport-local"),
        passportLocalMongoose = require("passport-local-mongoose"),
        User = require("./models/user")
        Course = require("./models/course")
        Enroll = require("./models/enrollCourses")
        Assignment = require("./models/assignment")
const uri = "mongodb+srv://project1:project1@cluster0.ilcak.mongodb.net/project?retryWrites=true&w=majority";
//const uri = "mongodb+srv://hani:password123@cluster0.4bvup.mongodb.net/<dbname>?retryWrites=true&w=majority"; //Hani's db
//const uri = "mongodb+srv://user1:user123@cluster0.wm8lw.mongodb.net/peer-grading-system?retryWrites=true&w=majority"; //maira's db
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
app.use(bodyParser.urlencoded({ extended: true }))
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

//---------------------REGISTER PAGE--------------------
app.get("/", function(req, res) {
    res.render("register")
})
app.post("/register", function(req, res) {
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
        function(err, user) {
            if (err) {
                console.log(err)
                return res.render("register")
            }
            passport.authenticate("local")(
                req, res,
                function() {
                    res.render("login")
                })

        })
})

//------------LOGIN PAGE--------------------
app.get("/login", function(req, res) {
    res.render("login")
})

app.post("/login", passport.authenticate("local"), function(req, res) {
    var username = req.user.username;
    //check whether user is student or teacher
    getProfileData(username, function(profile) {
        if (profile[0].status == 'Teacher') {
            //get teachers own courses
            getTeacherCourses(username, function(courses) {
                console.log("its a teacher");
                res.render("dashboard", { "status": profile[0].status, "id": profile[0]._id, "courses": courses, "username": profile[0].username })
            })
        } else {
            //get students enrolled courses
            console.log("student");
            getUserCourses(username, function(coursesList) {
                var a = [];
                coursesList.forEach(function(course, i) {
                    a[i] = course.coursename;
                })

                getStudentCourseInfo(a, function(courses) {
                    res.render("dashboard", { "status": profile[0].status, "id": profile[0]._id, "username": profile[0].username, "courses": courses })
                })
            })
        }
    })
})

app.get("/logout", function(req, res) {
    // clear the remember me cookie when logging out
    res.clearCookie('remember_me');
    req.logout();

    // redirect to homepage
    res.redirect('/login');

})

//--------------------CREATE COURSE PAGE--------------------
app.get("/createCourse", isLoggedIn, function(req, res) {
    res.render("createCourse", { "username": req.user.username, "status": req.user.status })
})

// Adding into database
app.post("/createCourse", async(req, res) => {
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
        getProfileData(username, function(profile) {
            if (profile[0].status == 'Teacher') {
                //get teachers own courses
                getTeacherCourses(username, function(courses) {
                    console.log("its a teacher");
                    console.log(courses);
                    res.render("dashboard", { "status": profile[0].status, "id": profile[0]._id, "courses": courses, "username": profile[0].username })
                })
            } else {
                //get students enrolled courses
                console.log("student");
                getUserCourses(username, function(coursesList) {
                    console.log("THE COURSELIST");
                    console.log(coursesList);
                    var a = [];
                    coursesList.forEach(function(course, i) {
                        a[i] = course.coursename;
                    })

                    getStudentCourseInfo(a, function(courses) {
                        console.log("THE COURSES");
                        console.log(courses);
                        res.render("dashboard", { "status": profile[0].status, "id": profile[0]._id, "username": profile[0].username, "courses": courses })
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

//-----------------ADDED BY MAIRA----------------------


var multer = require('multer');
var path = require('path');
var fs = require('fs');
var docStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/docs');
    },
    filename: function(req, file, cb) {
        var originalname = file.originalname;
        var extension = originalname.split(".");
        //filename= originalname;
        filename = Date.now() + '.' + extension[extension.length - 1];
        cb(null, filename);
    }
});

//---------------Add Assignment Page-----------------
app.get("/add-assignment", isLoggedIn, function(req, res) {
    console.log("I AM IN GET");
    var http = require('http');
    var url = require('url');
    var q = url.parse(req.url, true).query;
    var coursename = q.coursename;
    console.log(coursename);
    res.render("add-assignment", { "status": req.user.status, "id": req.user.id, "username": req.user.username, "coursename": coursename })
})


// takes data from Add assignment form and adds object to database
app.post("/add-assignment",
    multer({ storage: docStorage, dest: "uploads/docs" }).single("file"),
    function(req, res) {
        console.log(req.body.coursename);
        var questions = [];
        var markingScheme;
        var filename = ""
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
            filename = req.file.filename;
            console.log("file name ----> " + filename)
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
                fileName: filename,
                coursename: req.body.coursename,
                addedBy: req.user.username,
                attemptedBy: [],
                questions: questions,
                markingScheme: markingScheme
            });
            const done = assignment.save();
        } catch (err) {
            console.log("Error POST add-assignment: " + err);
        } finally {
            res.redirect("/coursePage" + "?coursename=" + req.body.coursename);
        }

    }
);

//---------------------VIEW ASSIGNMENT PAGE------------------
app.post("/view-assignment", isLoggedIn, function(req, res) {
    var id = req.body.id;
    console.log(req.user.status)
    var status = req.user.status
    var username = req.user.username
    var course = req.body.coursename
    if (req.user.status === "Teacher") {

        console.log(id);
        res.redirect("/assignment-teacher?id=" + id);

    } else if (status === 'Student') {
        res.redirect("/assignment-student?id=" + id);


    }



})

//------------------STUDENT ASSIGNMENT---------------
app.get("/assignment-student", isLoggedIn, function(req, res) {
    var http = require('http');
    var url = require('url');
    var q = url.parse(req.url, true).query;
    var id = q.id;
    var found = false;
    console.log(id);
    var studentID = req.user.id;
    try {
        getAssignmentData(id, function(assignment) {
            getUserCourses(req.user.username, function(courses) {

                console.log("coursessss-->" + courses)
                for (let index = 0; index < courses.length; index++) {
                    if (courses[index].coursename === assignment[0].coursename) {
                        found = true;
                        res.render("assignment-student", {
                            data: assignment,
                            id: id,
                            student: studentID,
                            username: req.user.username,
                            status: req.user.status
                        });
                        break;
                    }
                }
                console.log("found " + found)
                if (found === false) {
                    console.log(" not found")
                        //show error
                    res.render("access-denied", {
                        "status": req.user.status,
                        "username": req.user.username,
                    })

                }

            })

        })
    } catch (error) {
        console.log(error)
    }
})

app.get("/assignment-student/:filename", isLoggedIn, function(req, res) {
    console.log("downloading assignment for student")
    const dir = __dirname + "/uploads/docs/"
    const filename = req.params.filename
    res.download(dir + filename)


})

app.post("/assignment-student", isLoggedIn, multer({
    storage: docStorage,
    dest: "uploads/docs"
}).single("file"), function(req, res) {

    var assign_id = req.body.id
    var user_id = req.user.id
    var course = req.body.courseName;
    console.log("coursename -->" + course)
    console.log(user_id)

        //Code to upload submission
    if (req.body.reqType == 'upload') {
        var fileName = req.file.filename;


        const filter = {
            _id: assign_id
        }

        var update = {
            "$push": {
                attemptedBy: {
                    student: user_id,
                    fileName: fileName,
                    marked: false
                }

            }
        }

        console.log("Upload file: " + fileName)
            //update code to push elements in array
        Assignment.updateOne(filter, update, function(
            err,
            result
        ) {
            if (err) {
                console.log("Error: " + err)
            } else {
                console.log("Successfully inserted")

                //NAVIGATE TO COURSE PAGE

                getCourseAssignments(course, function(assignments) {
                    res.render("coursePage", { "status": req.user.status, "id": user_id, "assignments": assignments, "username": req.user.username, "coursename": course })
                })
            }
        })
    }
    //MCQ Answers 
    else if (req.body.reqType == 'mcq') {

        var filter = {
            _id: assign_id
        }

        var answersArr //to be pushed into attemptedBy attribute of db
          
        console.log("MCQs received!")
        answersArr = JSON.parse(JSON.stringify(req.body)) //get rid of [Object: null prototype] error
        var report = req.body.report
        console.log("Cheating report---> " + report)
        delete answersArr.report;
        delete answersArr.reqType;
        delete answersArr.id;
        delete answersArr.courseName;
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

        // calculate Marks
        try {
            console.log(assign_id)
            getAssignmentData(assign_id, function(assignment) {
                var marks = calculateMarks(answers, assignment);

                update = {
                    "$push": {
                        attemptedBy: {
                            student: user_id,
                            answers: answers,
                            marked: true,
                            marks: marks,
                            report: report
                        }
                    }
                }
                Assignment.updateOne(filter, update, function(
                    err,
                    result
                ) {
                    if (err) {
                        console.log("Error: " + err)
                    } else {
                        console.log("Successfully inserted")
                            //NAVIGATE TO COURSE PAGE
                        getCourseAssignments(course, function(assignments) {
                            res.render("coursePage", { "status": req.user.status, "id": user_id, "assignments": assignments, "username": req.user.username, "coursename": course })
                        })
                    }
                })

            })
        } catch (err) {
            console.log("err" + err)
        }
        console.log(answers)

    }


})
//------------------ASSIGNMENT TEACHER----------------
app.get("/assignment-teacher", isLoggedIn, function(req, res) {

    var http = require('http');
    var url = require('url');
    var q = url.parse(req.url, true).query;
    var id = q.id;
    console.log(id);

    var students = new Array;
    //Get assignment using ID, loop through attemptedBy and get Names of students -- pass assignment and names 

    try {

        getAssignmentData(id, function(assignment) {
            if (assignment[0].addedBy == req.user.username) {
                console.log("assignment received: " + assignment)
                if (assignment[0].attemptedBy.length == 0) {
                    renderNow(assignment, students, res, req);
                } else {


                    assignment[0].attemptedBy.forEach(function(attempt, i) {
                        var studentID = attempt.student;
                        getUserData(studentID, function(student) {
                            var name = student[0].firstname + " " + student[0].lastname;
                            console.log("name-->" + name)
                            students.push(name)
                            if (students.length === assignment[0].attemptedBy.length) {
                                renderNow(assignment, students, res, req);

                            }
                        })

                    })
                }

            
            } else {
                //show error
                res.render("access-denied", {
                    "status": req.user.status,
                    "username": req.user.username,
                })

            }

        })
    } catch (error) {
        console.log(error)
    }

})

function renderNow(assignment, students, res, req) {
    console.log("Students---->" + students)
    res.render("assignment-teacher", {
        "data": assignment,
        "students": students,
        "username": req.user.username,
        "status": req.user.status
    });
}

app.get("/assignment-teacher/:filename", isLoggedIn, function(req, res, next) {
    console.log("HERE")
    const dir = __dirname + "/uploads/docs/"
    const filename = req.params.filename
    res.download(dir + filename)



})

app.get("/mcq-answers", function(req, res) {



})

app.post("/mcq-answers", isLoggedIn, function(req, res, next) {
    console.log("getting attemptid----->" + req.body.attemptID)

    console.log("getting assignment id----->" + req.body.assignID)
    var assignID = req.body.assignID;
    try {

        getAssignmentData(assignID, function(assignment) {
            var questions = assignment[0].questions
            var attempts = new Array;
            var attemptObj;
            attempts = assignment[0].attemptedBy
            attempts.forEach(function(attempt, i) {
                if (attempt.id === req.body.attemptID) {
                    attemptObj = attempt;

                }
            })

            res.render("mcq-answers", {
                "attempt": attemptObj,
                "questions": questions,
                "username": req.user.username,
                "status": req.user.status

            });

        })
    } catch (err) {
        console.log("failed boo")
    }

   

})

app.post("/assignment-teacher", isLoggedIn, function(req, res) {
    let grades = req.body.totalmarks
    let assign_id = req.body.assign_id //Assignment_id
    let student_id = req.body.student_id //Person who's assignment was checked by teacher
    var filter = {
        _id: assign_id,
        "attemptedBy.student": student_id
    }

    let update = {
        '$set': {
            'attemptedBy.$.marked': true,
            'attemptedBy.$.marks': grades,
        }

    }
    Assignment.updateOne(filter, update, function(
        err,
        result
    ) {
        if (err) {
            console.log("Error: " + err)
                //  alert('Marks could not be updated')

            res.status(204).send();
        } else {
            console.log(result)
            console.log("Successfully inserted")
                //  alert('Marks updated successfully!')

            res.status(204).send();

        }
    })

})

function calculateMarks(answers, assignment) {
    var marks = 0;
    console.log("Assignment" + assignment)
    console.log("Answers in function " + answers)
    console.log("Answers len " + answers.length)

    console.log("Assignment object: " + assignment[0].questions)

    for (let i = 0; i < answers.length; i++) {
        var quesID = answers[i].question;
        //look for this id in assignment
        for (var x = 0; x < assignment[0].questions.length; x++) {

            if (assignment[0].questions[x]._id == quesID) {
                console.log("in if")
                    //compare answers
                if (assignment[0].questions[x].answer == answers[i].answer) {
                    marks = marks + assignment[0].questions[x].marks;
                    console.log("Correct!" + marks)
                }
            }
        }
    }
    return marks;
}

//get assignment based on assignment ID 
function getAssignmentData(id, callback) {
    const query = {
        _id: id
    };
    Assignment.find(query, function(err, db) {
        if (err) console.log(err);
        return callback(db)
    })
}


//get user based on User ID 
async function getUserData(id, callback) {
    const query = {
        _id: id
    };
    User.find(query, function(err, db) {
        if (err) console.log(err);
        // console.log(db);
        return callback(db)
    })
}
//-------------------END OF SECTION ADDED BY MAIRA----------------------------

//------------------------HAMDAN CODE---------------------------------------

//---------------PEER-GRADING PAGE----------------------
app.get("/peer-grading", isLoggedIn, function(req, res) {
    let user_id = req.user.id
    let url = require('url');
    let q = url.parse(req.url, true).query;
    let assign_id = q.id
    getAssignmentData(assign_id, function(assignment) {
        res.render("peer-grading", { "data": assignment, "id": user_id })
    })

})

app.get("/peer-grading/:filename", isLoggedIn, function(req, res) {
    console.log("downloading assignment for peer-gradig")
    const dir = __dirname + "/uploads/docs/"
    const filename = req.params.filename
    res.download(dir + filename)
})

app.post("/peer-grading", isLoggedIn, function(req, res) {
    let grades = req.body.totalmarks
    let assign_id = req.body.assign_id //Assignment_id
    let student_id = req.body.student_id //Person who checked
    var filter = {
        _id: assign_id,
        "attemptedBy.student": student_id
    }
    let update = {
        '$set': {
            'attemptedBy.$.marked': true,
            'attemptedBy.$.marks': grades,
        }
    }
    Assignment.updateOne(filter, update, function(
        err,
        result
    ) {
        if (err) {
            console.log("Error: " + err)
        } else {
            console.log(result)
            console.log("Successfully inserted")
            getUserCourses(req.user.username, function(coursesList) {
                var a = [];
                coursesList.forEach(function(course, i) {
                    a[i] = course.coursename;
                })

                getStudentCourseInfo(a, function(courses) {
                    res.render("dashboard", { "status": req.user.status, "id": req.user.id, "username": req.user.username, "courses": courses })
                })
            })
        }
    })
})


//-----------------END OF SECTION ADDED BY HAMDAN-------------------------

//----------------UMEHANI CODE------------------------------
const moment = require('moment');
//--------------------DASHBOARD----------------
app.get("/dashboard", isLoggedIn, function(req, res) {
    var username = req.user.username;
    //check whether user is student or teacher
    getProfileData(username, function(profile) {
        if (profile[0].status == 'Teacher') {
            //get teachers own courses
            getTeacherCourses(username, function(courses) {
                res.render("dashboard", { "status": profile[0].status, "courses": courses, "username": profile[0].username })
            })
        } else {
            //get students enrolled courses
            console.log("student");
            getUserCourses(username, function(coursesList) {
               
                var a = [];
                coursesList.forEach(function(course, i) {
                    a[i] = course.coursename;
                })

                getStudentCourseInfo(a, function(courses) {
                   
                    res.render("dashboard", { "status": profile[0].status, "username": profile[0].username, "courses": courses })
                })
            })
        }
    })
})


app.post("/dashboard", isLoggedIn, function(req, res) {
    //delete course
    console.log("Delete course --->" + req.body.coursename)
    var coursename = req.body.coursename
    deleteCourse(coursename)
    var username = req.user.username;
    getProfileData(username, function(profile) {
        if (profile[0].status == 'Teacher') {
            //get teachers own courses
            getTeacherCourses(username, function(courses) {
                res.render("dashboard", { "status": profile[0].status, "courses": courses, "username": profile[0].username })
            })
        }

    })
})

//------------COURSEPAGE-------------------
app.get("/coursePage", isLoggedIn, function(req, res) {
    var http = require('http');
    var url = require('url');
    var q = url.parse(req.url, true).query;
    var course = q.coursename;
    console.log("Course name -->" + course)
    var status = req.user.status;
    var username = req.user.username;
    var id = req.user.id;
    console.log(status);
    console.log("course -->" + course)
    var found = false;
    getCourseAssignments(course, function(assignments) {
        if (status === "Teacher") {

            //check if teacher created the course
            getTeacherCourses(username, function(courses) {

              
                for (let index = 0; index < courses.length; index++) {
                    if (courses[index].coursename === course) {
                        found = true;
                        res.render("coursePage", { "status": status, "id": id, "assignments": assignments, "username": username, "coursename": course })
                        break;
                    }
                }
                console.log("found " + found)
                if (found === false) {
                    console.log(" not found")
                        //show error
                    res.render("access-denied", {
                        "status": status,
                        "username": username,
                    })

                }

            })
        } else if (status === 'Student') {
            //check if student enrolled
            getUserCourses(username, function(courses) {
                for (let index = 0; index < courses.length; index++) {
                    if (courses[index].coursename === course) {
                        found = true;
                        res.render("coursePage", { "status": status, "id": id, "assignments": assignments, "username": username, "coursename": course })
                        break;
                    }
                }
                console.log("found " + found)
                if (found === false) {
                    console.log(" not found")
                        //show error
                    res.render("access-denied", {
                        "status": status,
                        "username": username,
                    })

                }

            })

        }
    })
})

app.post("/coursePage", isLoggedIn, function(req, res) {
    //delete assignment
    console.log("Delete assignment --->" + req.body.id)
    var assignID = req.body.id
    var course = req.body.course;
    deleteAssignment(assignID)
    var username = req.user.username;
    //finally render coursepage again
    var status = req.user.status;
    var username = req.user.username;
    var id = req.user.id;
    getCourseAssignments(course, function(assignments) {
        res.render("coursePage", { "status": status, "id": id, "assignments": assignments, "username": username, "coursename": course })
    })

})

function deleteCourse(coursename, callback) {
    const query = {
        coursename: coursename
    };
    Course.deleteOne(query, function(err, results) {

        console.log("Course deleted!")

    });

}

function deleteAssignment(id, callback) {
    const query = {
        _id: id
    };
    Assignment.deleteOne(query, function(err, results) {

        console.log("Assignment deleted!")

    });

}

app.post("/dashboard", isLoggedIn, function(req, res) {
    var username = username;
    //check whether user is student or teacher
    getProfileData(username, function(profile) {
        if (profile[0].status == 'Teacher') {
            //get teachers own courses
            getTeacherCourses(username, function(courses) {
                console.log("its a teacher");
                res.render("dashboard", { "status": profile[0].status, "id": profile[0]._id, "courses": courses, "username": profile[0].username })
            })
        } else {
            //get students enrolled courses
            console.log("student");
            getUserCourses(username, function(coursesList) {
                var a = [];
                coursesList.forEach(function(course, i) {
                    a[i] = course.coursename;
                })

                getStudentCourseInfo(a, function(courses) {
                    res.render("dashboard", { "status": profile[0].status, "id": profile[0]._id, "username": profile[0].username, "courses": courses })
                })
            })
        }
    })
})

//--------------PROFILE PAGE---------------------
//request to load profile page
app.get("/profile", isLoggedIn, function(req, res) {
    console.log(req.user.username);
    getProfileData(req.user.username, function(data) {
        res.render("profile", { "data": data, "status": req.user.status, "username": req.user.username })
    })
})

//updating profile
app.post("/profile", isLoggedIn, function(req, res) {
    var username = req.body.username
    var firstname = req.body.firstname
    var lastname = req.body.lastname
    var email = req.body.email
    var date = req.body.date
    var myquery = { username: username };
    var newvalues = { $set: { firstname: firstname, lastname: lastname, email: email, date: date } };
    User.updateOne(myquery, newvalues, function(err, user) {
        if (err) throw err;
        getProfileData(username, function(data) {
            data.date = moment(data.date).utc().format("YYYY-MM-DD")
            console.log(data.date);
            res.render("profile", { "data": data, "status": req.user.status, "username": req.user.username })
        })
    })
})


//get userdata based on username
function getProfileData(username, callback) {
    const query = { username: username };
    User.find(query, function(err, db) {
        if (err) console.log(err);
        return callback(db)
    })
}

//get courses based on studentname
function getUserCourses(username, callback) {
    Enroll.find({ $and: [{ username: { $eq: username } }, { enroll: { $eq: true } }] }, function(err, db) { //get the list of students courses and whether they are enrolled
        if (err) console.log(err);
        return callback(db);
    })
}

//get courses based on teachername
function getTeacherCourses(username, callback) {
    const query = { username: username };
    Course.find(query, function(err, db) {
        if (err) console.log(err);
        return callback(db)
    })
}

//get enrolled courses of students
function getStudentCourseInfo(coursesList, callback) {
    console.log("LIST OF COURSES");
    console.log(coursesList);
    Course.find({ coursename: { $in: coursesList } }, function(err, db) {
        if (err) console.log(err);
        return callback(db)
    })
}

//get assignments for a course
function getCourseAssignments(coursename, callback) {
    Assignment.find({ coursename: coursename }, function(err, db) {
        if (err) console.log(err);
        return callback(db);
    })
}

// --------------------Maha's Code-------------------------------

//-------------------ENROLL COURSES PAGE-----------
//courses enrolled
app.get("/enrollCourses", isLoggedIn, function(req, res) {
    const username = req.user.username
    getUserUnenrollCourses(username, function(coursesList) {
        var a = [];
        coursesList.forEach(function(course, i) {
            a[i] = course.coursename;
        })
        getUnerolledCourses(a, function(courses) {
            res.render('enrollCourses', { courses: courses, "username": username, "status": req.user.status });
        })
    });
})


app.get("/enrollStudents", isLoggedIn, function(req, res) {
    const username = req.user.username
    getTeacherCourses(username, function(teacherCourses) {
        var courseNames = [];
        teacherCourses.forEach(function(course, i) {
            courseNames[i] = course.coursename;
        })
        var check = [false];
        getRequests(check, courseNames, function(coursess) {
            var StudentNames = [];
            coursess.forEach(function(course, i) {
                StudentNames[i] = course.username;
            })
            res.render('enrollStudents', { courses: coursess, "username": username, "status": req.user.status });
        });
    })
})

//Update Students enroll status (on accepting requests)
app.post("/requests", isLoggedIn, function(req, res) {
    var username = req.body.username;
    var coursename = req.body.coursename;
    var userCollection = db.collection('enrollcourses');
    const query = { $and: [{ username: username }, { coursename: coursename }] };
    const set = { $set: { enroll: true } };
    userCollection.updateOne(query, set, function(err) {
        if (err) throw err;
        res.redirect("/enrollStudents");
    });
})

//-----------------ADD NAME PAGE-------------
//insert new course of student on enrolling in db
app.post("/addname", isLoggedIn, function(req, res) {
    var coursename = req.body.coursename;
    var username = req.user.username;
    console.log(username);
    var userCollection = db.collection('enrollcourses');
    userCollection.insertOne({ coursename: coursename, username: username, enroll: false })
        .then(item => {
            console.log("item saved to database");
            res.redirect("/enrollCourses")
        })
        .catch(err => {
            console.log(err);
        });
});


//get students enrolled courses
function getUserUnenrollCourses(username, callback) {
    const query = { username: username };
    console.log(query);
    Enroll.find(query, function(err, db) {
        if (err) console.log(err);
        return callback(db)
    })
}

// get student unenrolled courses
function getUnerolledCourses(coursesList, callback) {
    Course.find({ coursename: { $nin: coursesList } }, function(err, db) {
        if (err) console.log(err);
        return callback(db)
    })
}

// get final students with pending requests (enroll=false)
function getRequests(finall, names, callback) {
    Enroll.find({ $and: [{ enroll: { $in: finall } }, { coursename: { $in: names } }] }, function(err, db) {
        if (err) console.log(err);
        return callback(db);
    })
}
//--------------------SERVER----------------------
let port = process.env.PORT || 3000
app.listen(port, function() {
    console.log("Server has started!")
})

//--------------end-------------------

//FAQ page
app.get("/FAQ", isLoggedIn, function(req, res) {
    console.log(req.user.username);
    getProfileData(req.user.username, function(data) {
        res.render("FAQ", { "data": data, "status": req.user.status, "username": req.user.username })
    })
})


//about us page
app.get("/aboutus", isLoggedIn, function(req, res) {
    console.log(req.user.username);
    getProfileData(req.user.username, function(data) {
        res.render("aboutus", { "data": data, "status": req.user.status, "username": req.user.username })
    })
})
