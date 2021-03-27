
const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors')
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS }@cluster0.nijm6.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const port = 5000

const app = express()
app.use(cors());
app.use(express.json())


// app.use(bodyParser.json())


// firebase Admin initialize
var serviceAccount = require("./configs/burj-al-arab-571c2-firebase-adminsdk-t9gxg-475a159cb4.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookings = client.db("burjAlArab").collection("bookings");

  app.post('/addBooking', (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking)
      .then(result => {
        res.send(result.insertedCount > 0)
      })
    console.log(newBooking);
  })

  app.get('/bookings', (req, res) => {
    // verify jwt Token
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer')) {
      const idToken = bearer.split(' ')[1];
      admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail=req.query.email;
          if (tokenEmail == queryEmail) {
            bookings.find({ email: queryEmail })
              .toArray((err, documents) => {
                res.send(documents);
              })
          }
          else{
            res.status(401).send('unauthorized access')
          }
        })
        .catch((error) => {
          res.status(401).send('unauthorized access')
        });
    }
    else{
      res.status(401).send('unauthorized access')
    }
  })

});


app.listen(port)