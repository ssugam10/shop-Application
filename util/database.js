const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;
//We can use the client to connect to our mongodb database

let _db;

const mongoConnect = (callback) => {
  MongoClient.connect(
    "mongodb+srv://ssugam10:sugam112@cluster0.eajhwvj.mongodb.net/shop?retryWrites=true&w=majority&appName=Cluster0"
  )
    .then((client) => {
      console.log("Database Connected!");
      _db = client.db(); //connection to a database is stored in this vairable
      callback(); //client object which gives us access to the database
    })
    .catch((err) => {
      console.log(err);
      throw err;
    });
};

const getDb = () => {
  if (_db) {
    return _db; //returning access to the database
  }
  throw "No database found!";
};

exports.mongoConnect = mongoConnect; //connecting and then storing connection to that database
exports.getDb = getDb; //return access to that connected database if it exists
