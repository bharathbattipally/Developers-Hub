const express=require('express');
const mongoose=require('mongoose');
const devuser=require('./devusermodel');
const bodyParser=require('body-parser');
const jwt=require('jsonwebtoken');
const review=require('./reviewmodel');
const middleware=require('./middleware');
const cors=require('cors');

const app=express(); //initialize the express app
app.use(cors({origin:'*'}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
mongoose.connect('mongodb+srv://bharathbattipally:Firstcluster@cluster0.taqxpwp.mongodb.net/?retryWrites=true&w=majority',{ 
    useNewUrlParser: true, useUnifiedTopology: true }).then(
    ()=>console.log('DB connection established')
)

app.get('/',(req,res)=>{
    return res.send("Hello World!!");
})

app.post('/register',async (req,res)=>{
    try{
        const {fullname,email,mobile,skill,password,confirmpassword} =req.body; //destructuring the inputs
        const exist= await devuser.findOne({email});
        if(exist){
            return res.status(400).send('User already registered');
        }
        if(password != confirmpassword){
            return res.status(400).send('Password does not match');
        }
        let newUser= new devuser({
            fullname,email,mobile,skill,password,confirmpassword
        })
        newUser.save();
        return res.status(200).send('User registered');

    }
    catch(err){
        console.log(err);
        return res.status(500).send("Error registering");
    }
})


app.post('/login',async (req,res)=>{
    try{
        const {email,password}=req.body;
        const exist= await devuser.findOne({email});
        if(!exist || exist.password != password ){
            return res.status(400).send("user is not registered/password is incorrect");
        }
        let payload={
            user:{
                id:exist.id
            }
        }
        jwt.sign(payload,'jwtPassword',{expiresIn:360000000},(err,token)=>{
            if(err) throw err;
            return res.json({token});
        })
    }
    catch(err){
        console.log(err);
        return res.status(500).send("Error logging in");
    }
})


app.get('/allprofiles',middleware,async(req,res)=>{
    try{
        let allprofiles= await devuser.find();
        return res.json(allprofiles);

    }
    catch(err){
        console.log(err);
        return res.status(500).send("Error logging in");
    }


})

app.get('/myprofile',middleware,async(req,res)=>{
    try{
        let user= await devuser.findById(req.user.id); //this id  is sth which we have as attribute after the token is decode in middleware
        return res.json(user);
    }
    catch(err){
        console.log(err);
        return res.status(500).send("Error logging in");

    }

})

app.post('/addreview',middleware,async(req,res)=>{
    try{
        const {taskworker,rating}= req.body;
        const exist= await devuser.findById(req.user.id);
        const newReview= new review({
            taskprovider: exist.fullname,
            taskworker,rating
        })
        newReview.save();
        return res.status(200).send("review added successfully");

    }
    catch(err){
        console.log(err);
        return res.status(500).send("Error logging in");
    }
})

app.get('/myreview',middleware, async(req,res)=>{
    try{
        let allreviews= await review.find();
        const myreviews= allreviews.filter(review => review.taskworker.toString() === req.user.id.toString());
        return res.status(200).json(myreviews);
    }
    catch(err){
        console.log(err);
        return res.status(500).send("Error logging in");
    }

})

app.listen(5000,()=>console.log("server listening on port"));