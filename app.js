const express=require("express"),
    mongoose=require("mongoose"),
    passport=require("passport"),
    bodyParser=require("body-parser"),
    LocalStrategy=require("passport-local"),
    passportLocalMongoose=require("passport-local-mongoose"),
    User=require("./models/user")
    const uri = "mongodb+srv://project1:project1@cluster0.ilcak.mongodb.net/project?retryWrites=true&w=majority";
//Use new parser to parse connection strings
mongoose.set('useNewUrlParser',true)
mongoose.set('useFindAndModify',false)
//Call createIndex to create an entry instead of ensureIndex
mongoose.set('useCreateIndex',true)
//Using new method to avoid depracated.
mongoose.set('useUnifiedTopology',true)
mongoose.connect(uri)

let app=express()
app.set("view engine","ejs")//Setting the engine extension  
app.use(express.static("public/"))
app.use(bodyParser.urlencoded({extended:true}))
//Create a session storage encrypted with the secret
app.use(require("express-session")({
    secret:"handi is pandi",
    resave:false,
    saveUninitialized:false
}))

app.use(passport.initialize())
app.use(passport.session())

passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.get("/",function(req,res){
    res.render("home")
})

app.get("/secret",isLoggedIn,function(req,res){
    res.render("secret")
})

app.get("/register",function(req,res){
    res.render("register")
})

app.post("/register",function(req,res){
    let username=req.body.username
    let password=req.body.password
    User.register(new User({username:username}),
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

app.post("/login",passport.authenticate("local",{
    successRedirect:"/secret",
    failureRedirect:"/login"
}),function(req,res){
})

app.get("/logout",function(req,res){
    req.logout()
    res.redirect("/")
})

function isLoggedIn(req,res,next){
    if(req.isAuthenticated()) return next();
    res.redirect("/login")
}

let port=process.env.PORT || 3000
app.listen(port, function(){
    console.log("Server has started!")
})





//MAHA'S APP.JS





const { Console } = require("console");
const express=require("express"),
    mongoose=require("mongoose"),
    passport=require("passport"),
    bodyParser=require("body-parser"),
    LocalStrategy=require("passport-local"),
    passportLocalMongoose=require("passport-local-mongoose"),

    // creating object
    User=require("./models/user")
    Course=require("./models/course")

    // mongodb url
   const uri = " mongodb+srv://maha:maharana@cluster0.x89gb.mongodb.net/peerGrading?retryWrites=true&w=majority";
  
   
// Connecting to mongodb
mongoose.connect(uri,{
    useNewUrlParser:true,
    useUnifiedTopology:true,
    useCreateIndex:true
}).then(() => {
    console.log("successfully connected");
}).catch((e) => {
    console.log(error);
})

let app=express()
app.set("view engine","ejs")//Setting the engine extension  
app.use(bodyParser.urlencoded({extended:true}))
//Create a session storage encrypted with the secret
app.use(require("express-session")({
    secret:"handi is pandi",
    resave:false,
    saveUninitialized:false
}))

app.use(passport.initialize())
app.use(passport.session())

passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.get("/",function(req,res){
    res.render("home")
})

app.get("/secret",isLoggedIn,function(req,res){
    res.render("secret")
})

app.get("/register",function(req,res){
    res.render("register")
})

app.post("/register",function(req,res){
    let username=req.body.username
    let password=req.body.password
    User.register(new User({username:username}),
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

app.post("/login",passport.authenticate("local",{
        successRedirect:"/secret",
        failureRedirect:"/login",
}),function(req,res){
})

app.get("/logout",function(req,res){
    req.logout()
    res.redirect("/")
})

app.get("/createCourse",function(req,res){
    res.render("createCourse")
})
// Adding into database
app.post("/createCourse",async (req,res) =>{
    try {
        const CourseName=req.body.Cname;
        const Discription=req.body.discription;
        const check1 = new Course({
            CourseName:CourseName,
            Discription:Discription
        })
        const done = await check1.save();
        res.status(400).render("secret");
    } catch (error) {
       console.log(error)
    }
})

function isLoggedIn(req,res,next){
    if(req.isAuthenticated()) return next();
    res.redirect("/login")
}

let port=process.env.PORT || 3000
app.listen(port, function(){
    console.log("Server has started!")
})
