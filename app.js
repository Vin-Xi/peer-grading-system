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