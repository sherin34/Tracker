var express = require("express");
var router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const userHelpers = require("../helpers/userHelper");
Handlebars = require("handlebars");

let sql;
let password;
let role;
let username;
let bm_data; //DATA fetched from reported users

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
  username = "";
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
        role.bm = true; //to set headers

        userHelpers.showDailyReportBM(req.body, username).then((response) => {
          // console.log(response)

          bm_data = response;
        });
      } else if (rows == "ch") {
        role.ch = true;
      } else if ((rows = "rh")) {
        role.rh = true;
      } else {
        console.log("role didn't obtained correctly");
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
      username = rows.user.user_id;
      let userData = rows;
      console.log(userData.user.user_id);
      //getting result rwo for bm login
      
      res.render("user", { userData, user: true, role, bm_data });
    })
    .catch((error) => {
      console.error("Error:", error.message);
    });
});

router.post("/submitDailyReport", (req, res) => {
  // console.log(req.body);
  userHelpers.submitDailyReport(req.body, username).then((response) => {
    res.render("./partials/user_body", { username, user: true, role });
    // console.log("Login Success")
    // console.log(response)
  });
});

//filter userdata showing to BM
router.post("/applyfiltersBM", (req, res) => {
  // console.log(req.body);
  const scrollToDailyReporting = "dailyReporting";
  //to know which button pressed in filter in show daily report BM
  const filterButtonAction = req.body.buttonAction;

  if (filterButtonAction === "applyFilter") {
    //ccheck if login has done?
    if (username === "") {
      res.send("Login first");
    } else {
      userHelpers.filterBM(req.body, username, bm_data).then((response) => {
        bm_data = response;
        //processing chartgs

        const sqlResult = bm_data;

        const chartData = {
          labels: sqlResult.map((item) => item.name), // Array of names
          datasets: [
            {
              label: "Total Points",
              data: sqlResult.map((item) => item.total_points), // Array of total_points
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1,
              fill: false,
            },
          ],
        };

        console.log(chartData.datasets);
        res.render("./partials/bm_body", {
          username,
          user: true,
          role,
          bm_data,
          scrollToDailyReporting,
          chartData,
        });
      });
    }
  } else if (filterButtonAction === "resetFilter") {
    userHelpers.showDailyReportBM(req.body, username).then((response) => {
      // console.log(response)

      bm_data = response;
      //ccheck if login has done?

      if (username === "") {
        res.send("Login first");
      } else {
        res.render("./partials/bm_body", {
          username,
          user: true,
          role,
          bm_data,
          scrollToDailyReporting,
        });
      }
    });
  }
});

module.exports = router;
