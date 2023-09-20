var express = require("express");
var router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const userHelpers = require("../helpers/userHelper");
Handlebars = require("handlebars");

let sql;
let password;
let role;

const db = new sqlite3.Database(
  "./database/test.db",
  sqlite3.OPEN_READWRITE,
  (err) => {
    if (err) return console.error(err.message);
  }
);
//create table
// sql='CREATE TABLE user (user_id VARCHAR(10) PRIMARY KEY, name NOT NULL,phone NOT NULL,password NOT NULL)';
// db.run(sql);

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("login", { admin: false, user: false });
});
router.get("/login", function (req, res, next) {
  res.render("login", { admin: false, user: false });
});
router.get("/signup", function (req, res, next) {
  res.render("signup", { admin: false, user: false });
});
router.post("/signup", (req, res) => {
  // console.log(req.body);
  userHelpers.doSignup(req.body).then((response) => {
    res.render("login");
    // console.log("Login Success")
  });
});
router.post("/login", (req, res) => {
  userHelpers
    .checkRole(req.body)
    .then((rows) => {
      role = { user: false, bm: false, ch: false, rh: false };
      if (rows == "user") {
        role.user = true;
      } else if (rows == "bm") {
        role.bm = true;
      } else if (rows == "ch") {
        role.ch = true;
      } else if (rows = "rh") {
        role.rh = true;
      }else{
        console.log("role didn't obtained correctly")
      }
    })
    .catch((error) => {
      console.error("Error:", error.message);
    });

  userHelpers
    .doLogin(req.body)
    .then((rows) => {
      // Process the data after the SQL query is complete
      // console.log(rows);
      // Continue with other operations here
      let userData = rows;
      console.log(userData.user.user_id);

      res.render("user", { userData, user: true, role });
    })
    .catch((error) => {
      console.error("Error:", error.message);
    });
});
module.exports = router;
