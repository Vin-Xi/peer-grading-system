const express=require("express"),
    mongoose=require("mongoose"),
    passport=require("passport"),
    bodyParser=require("body-parser"),
    LocalStrategy=require("passport-local"),
    passportLocalMongoose=require("passport-local-mongoose"),
    User=require("./models/user")
    const uri = "mongodb+srv://project1:project1@cluster0.ilcak.mongodb.net/project?retryWrites=true&w=majority";


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
    console.log(error);
})


//Connection Object can be used to fetch
let db=mongoose.connection


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

app.post("/login",
    passport.authenticate("local"),
    function(req,res){
        console.log(req.user.username)
        res.render("secret",{"username":req.user.username})
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

//------------Example Function to fetch data --------------
function getUserName(callback){
    User.find(function(err,db){
       if(err) console.log(err);
            return callback(db)                
        })
}

//--------------------SERVER----------------------
let port=process.env.PORT || 3000
app.listen(port, function(){
    console.log("Server has started!")
})





 