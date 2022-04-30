const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const methodOverride = require('method-override');
const http = require('http').createServer(app);
const {Server} = require('socket.io');
const io = new Server(http);
app.use(methodOverride('_method'));
app.use(express.urlencoded({extended: true}));
app.use('/public', express.static('public'));
app.set('view engine', 'ejs');

MongoClient.connect('mongodb+srv://admin:1234@cluster0.njr0p.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', function(err, client){
    if(err) return console.eWrr(err);
    db = client.db('todoapp');
    http.listen(8080, function(){
        console.log('listening on 8080');
    })
})


app.get('/socket', function(req, res){
    res.render('socket.ejs')
});

io.on('connection', function(socket){
    console.log('User Connected');
    
    socket.on('room1-send', function(data){
        io.to('room1').emit('broadcast', data);
    })
    socket.on('joinRoom', function(data){
        socket.join('room1');
    })
    
    socket.on('user-send', function(data){
        io.emit('broadcast', data)
    })
    
})
app.get('/', function(req, res){
    res.render('index.ejs');
})

app.get('/write', function(req, res){
    res.render('write.ejs');
})

app.get('/list', function(req, res){
    db.collection('post').find().toArray(function(err, result){
       console.log(result);
       res.render('list.ejs', {posts: result});
    });

})

app.get('/search', (req, res)=>{
    var searchCondition = [
        {
          $search: {
            index: 'titleSearch',
            text: {
              query: req.query.value,
              path: 'title'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
            }
          }
        }
      ] 
    db.collection('post').aggregate(searchCondition).toArray((err, result)=>{
        console.log(result);
        res.render('search.ejs', {posts: result})
    })
})



app.get('/detail/:id', function(req, res){
    db.collection('post').findOne({_id: parseInt(req.params.id)}, function(err, result){
        if(err) res.render('error.ejs');
        console.log(result);
        res.render('detail.ejs', {data: result});
    })
})

app.get('/edit/:id', function(req, res){
    db.collection('post').findOne({ _id: parseInt(req.params.id) }, function(err, result){
        if(err) res.render('error.ejs');
        res.render('edit.ejs', {post: result})
        console.log(result);
    });
    
})

app.put('/edit', function(req, res){
    db.collection('post').updateOne({_id: parseInt(req.body.id)}, {$set: { title: req.body.title, date: req.body.date }}, 
        function(err, result){
            console.log('Edit good');
            res.redirect('/list');
    })
})

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const e = require('express');
app.use(session({secret: '비밀코드', resave: true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', function(req, res){
    res.render('login.ejs');

});
app.post('/login', passport.authenticate('local', {
    failureRedirect: '/fail'
}), function(req, res){
   res.redirect('/');
});

app.get('/mypage', isLogin, function(req, res){
    console.log(req.user);
    res.render('mypage.ejs', {user: req.user});
});

function isLogin(req, res, next){
    if(req.user){
        next()
    } else{
        res.send('U didn\'t login');
    }
}
passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
  }, function (입력한아이디, 입력한비번, done) {
    //console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
      if (에러) return done(에러)
  
      if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
      if (입력한비번 == 결과.pw) {
        return done(null, 결과)
      } else {
        return done(null, false, { message: '비번틀렸어요' })
      }
    })
  }));

passport.serializeUser(function(user, done){
    done(null, user.id);
})

passport.deserializeUser(function(id, done){
    db.collection('login').findOne({id: id}, function(err, result){
        done(null, result);
    })
})

app.post('/register', function(req, res){
    db.collection('login').insertOne({id: req.body.id, pw: req.body.pw}, function(err, result){
        res.redirect('/');
    })
})

app.post('/add', function(req, res){
    res.send('Send Complete');
    db.collection('counter').findOne({name: 'numberOfPost'}, function(err, result){
        console.log(result);
        var totalPost = result.totalPost;
        var willSave = { _id: totalPost+1, writer: req.user._id, title: req.body.title, date: req.body.date }
        db.collection('post').insertOne(willSave, (err, result)=>{
            console.log('save good');
            db.collection('counter').updateOne({name: 'numberOfPost'}, { $inc: {totalPost: 1} }, (err, result)=>{
                if(err) return console.log(error);
            });
        })
    })
})

app.delete('/delete', function(req, res){
    console.log(req.body);
    req.body._id = parseInt(req.body._id);
    var deleteData = { _id: req.body._id, writer: req.user._id }
    db.collection('post').deleteOne(deleteData , function(err, result){
        console.log('Delete good');
        res.status(200).send({message: "success"});
    })
})
let multer = require('multer');
const { application } = require('express');
var storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, './public/image')
    },
    filename: function(req, file, cb){
        cb(null, file.originalname)
    }
})

var upload = multer({storage: storage});

app.get('/upload', function(req, res){
    res.render('upload.ejs');
})

app.post('/upload', upload.array('profile', 10), function(req, res){
    res.send('Complete')
})

app.get('/image/:imageName', function(req, res){
    res.sendFile(__dirname + '/public/image' + req.params.imageName)
})
app.use('/shop', require('./routes/shop.js'));

const {ObjectId} = require('mongodb');
const { resolveInclude } = require('ejs');
const { isPromise } = require('util/types');
app.post('/chatroom', isLogin, function(req, res){
    var saved ={
        title: 'BlaBlaChatroom',
        member: [ObjectId(req.body.당한사람id), req.user._id],
        date: new Date()
    }
    db.collection('chatroom').insertOne(saved).then((err, result)=>{
        if(err) console.log(err);
    })
})

app.get('/chat', isLogin, function(req, res){
    db.collection('chatroom').find({member: req.user._id}).toArray().then((result)=>{
        res.render('chat.ejs', {data: result});
    })
})

app.post('/message', isLogin, function(req, res){
    var willSend = {
        parent: req.body.parent,
        content: req.body.content,
        userId: req.user._id,
        data: new Date()
    }
    db.collection('message').insertOne(willSend).then(()=>{
        console.log('DB save complete');
        res.send('DB save complete');
    })
})

app.get('/message/:id', isLogin, function(req, res){
    res.writeHead(200, {
        "Connection": "keep-alive",
        "Content-type": "text/event-stream",
        "Cache-Control": "no-cache",
    });
    db.collection('message').find({parent : req.params.id}).toArray()
    .then((result)=>{
        res.write('event: test\n');
        res.write('data: ' + JSON.stringify(result) + '\n\n');
    })
    const pipeline = [
        { $match: { 'fullDocument.name' : req.params.id } }
    ];
    const collection = db.collection('message');
    const changeStream = collection.watch(pipeline);
    changeStream.on('change', (result) => {
        console.log(result.fullDocument);
    });
})