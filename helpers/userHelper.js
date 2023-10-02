const bcrypt = require("bcrypt");
const { use } = require("../routes/login");
const sqlite3 = require("sqlite3").verbose();
let totalpoint = 0;
const db = new sqlite3.Database(
  "./database/test.db",
  sqlite3.OPEN_READWRITE,
  (err) => {
    if (err) return console.error(err.message);
  }
);
const { format } = require("date-fns");
module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.password = await bcrypt.hash(userData.password, 10);
      sql = "INSERT INTO user(user_id,name,phone,password) VALUES (?,?,?,?)";
      db.run(
        sql,
        [userData.user_id, userData.name, userData.phone, userData.password],
        (err) => {
          if (err) return console.error(err.message);
        }
      );

      resolve(userData);
    });
  },

  checkRole: (userData) => {
    return new Promise(async (resolve, reject) => {
      sql = "select * from user_index where user_id=?";
      db.get(sql, [userData.user_id], (err, rows) => {
        if (err) {
          reject(err);
        } else if (rows) {
          // resolve(rows);
          console.log(rows.role);
          resolve(rows.role);
        } else {
          console.log("login failed due to user not exist");
        }
      });
    });
  },
  doLogin(userData) {
    sql = "SELECT * FROM user WHERE user_id=?";
    let response = {};
    return new Promise((resolve, reject) => {
      db.get(sql, [userData.user_id], (err, rows) => {
        if (err) {
          reject(err);
        } else if (rows) {
          // resolve(rows);

          bcrypt.compare(userData.password, rows.password).then((status) => {
            if (status) {
              console.log("login success");
              response.user = rows;
              response.status = true;

              resolve(response);
            } else {
              console.log("Wrong password");

              resolve({ status: false });
            }
          });
        } else {
          console.log("login failed due to user not exist");
          resolve({ status: false });
        }
      });
    });
  },
  submitDailyReport: (userData, username) => {
    return new Promise(async (resolve, reject) => {
      let submitDate = new Date();
      let formatedDate = format(submitDate, "yyyy-MM-dd");

      console.log(formatedDate);
      //find total points if any
      totalPoints(userData).then((response) => {
        totalpoint = response;
      });

      //check if any entry is there in the same day with same Userid
      let entryCheckSQL = "SELECT * FROM reporting WHERE user_id=? AND date=?";
      db.get(entryCheckSQL, [username, formatedDate], (err, rows) => {
        if (err) {
          reject(err);
        } else if (rows) {
          // means, there is already an entry for the same day for same user id
          let updateReportSQL =
            "UPDATE reporting SET user_id=?,date=?, life_rep=?, health_rep=?, general_rep=?, rd_rep=?, term_deposit_rep=?, casa_rep=?, sb_silver_rep=?, cd_rep=?, housing_loan_rep=?, vehicle_loan_rep=?, business_loan_rep=?, total_points=? WHERE user_id=? AND date=?";
          db.run(
            updateReportSQL,
            [
              username,
              formatedDate,
              userData.lifeInsurance,
              userData.healthInsurance,
              userData.generalInsurance,
              userData.rd,
              userData.termDeposit,
              userData.casa,
              userData.sbSilver,
              userData.cdSilver,
              userData.housingLoanLead,
              userData.vehicleLoanLead,
              userData.businessLoanLead,
              totalpoint,
              username,
              formatedDate,
            ],
            (err) => {
              if (err) {
                return console.error(err.message);
              } else {
                console.log("already existed entry updated");
                resolve();
              }
            }
          );
        } else {
          //calculate total points
          // totalpoint=totalPoints(userData);

          //write new entry in table

          sql =
            "INSERT INTO reporting (user_id, date, life_rep, health_rep, general_rep, rd_rep, term_deposit_rep, casa_rep, sb_silver_rep, cd_rep, housing_loan_rep, vehicle_loan_rep, business_loan_rep, total_points) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

          db.run(
            sql,
            [
              username,
              formatedDate,
              userData.lifeInsurance,
              userData.healthInsurance,
              userData.generalInsurance,
              userData.rd,
              userData.termDeposit,
              userData.casa,
              userData.sbSilver,
              userData.cdSilver,
              userData.housingLoanLead,
              userData.vehicleLoanLead,
              userData.businessLoanLead,
              totalpoint,
            ],
            (err) => {
              if (err) return console.error(err.message);
              else {
                console.log("new entry in reporting added");
                resolve();
              }
            }
          );
        }
      });
    });
  },
  totalPoints: (userData) => {
    return new Promise(async (resolve, reject) => {
      pointsSql = "select * from points";
      db.get(pointsSql, (err, rows) => {
        if (err) {
          reject(err);
        } else if (rows) {
          // resolve(rows);
          console.log(rows);
        }
      });
    });
  },

  showDailyReportBM: (userData) => {
    return new Promise(async (resolve, reject) => {
      // sql = "select * from reporting";
      let today = new Date();
      today = format(today, "yyyy-MM-dd");
      sql =
        "SELECT u.name, r.user_id, r.date, r.life_rep, r.health_rep, r.general_rep, r.rd_rep, r.term_deposit_rep, r.casa_rep, r.sb_silver_rep, r.cd_rep, r.housing_loan_rep, r.vehicle_loan_rep, r.business_loan_rep, r.total_points FROM user AS u JOIN reporting AS r ON u.user_id = r.user_id WHERE r.date = ? ORDER BY r.date";
      db.all(sql, [today], (err, rows) => {
        if (err) {
          reject(err);
        } else if (rows) {
          // resolve(rows);

          resolve(rows);
        } else {
          console.log("nothing in the table");
        }
      });
    });
  },
  filterBM: (userData) => {
    return new Promise(async (resolve, reject) => {
      // sql = "SELECT u.name, r.user_id, r.date, r.life_rep, r.health_rep, r.general_rep, r.rd_rep, r.term_deposit_rep, r.casa_rep, r.sb_silver_rep, r.cd_rep, r.housing_loan_rep, r.vehicle_loan_rep, r.business_loan_rep, r.total_points FROM user AS u JOIN reporting AS r ON u.user_id = r.user_id WHERE r.date BETWEEN ? AND ?";
      sql =
        "SELECT u.name AS name, SUM(r.life_rep) AS life_rep, SUM(r.health_rep) AS health_rep, SUM(r.general_rep) AS general_rep, SUM(r.rd_rep) AS rd_rep, SUM(r.term_deposit_rep) AS term_deposit_rep, SUM(r.casa_rep) AS casa_rep, SUM(r.sb_silver_rep) AS sb_silver_rep, SUM(r.cd_rep) AS cd_rep, SUM(r.housing_loan_rep) AS housing_loan_rep, SUM(r.vehicle_loan_rep) AS vehicle_loan_rep, SUM(r.business_loan_rep) AS business_loan_rep, SUM(r.total_points) AS total_points FROM user AS u JOIN reporting AS r ON u.user_id = r.user_id WHERE r.date BETWEEN ? AND ? GROUP BY u.name ORDER BY u.name";

      db.all(sql, [userData.fromDate, userData.toDate], (err, rows) => {
        if (err) {
          reject(err);
        } else if (rows) {
          // resolve(rows);
          // console.log(rows);

          resolve(rows);
        } else {
          console.log("nothing in the table");
        }
      });
    });
  },

};

function totalPoints(userData) {
  return new Promise(async (resolve, reject) => {
    pointsSql = "select * from points";
    db.get(pointsSql, (err, rows) => {
      if (err) {
        reject(err);
      } else if (rows) {
        totalpoint =
          userData.lifeInsurance * rows.life +
          userData.healthInsurance * rows.health +
          userData.generalInsurance * rows.general +
          userData.rd * rows.rd +
          userData.termDeposit * rows.term_deposit +
          userData.casa * rows.casa +
          userData.sbSilver * rows.sb_silver +
          userData.cdSilver * rows.cd +
          userData.housingLoanLead * rows.home_loan +
          userData.vehicleLoanLead * rows.vehicle_loan +
          userData.businessLoanLead * rows.business_loan;

        // resolve(rows);
        // console.log(totalpoint)
        return totalpoint;
      }
    });
  });
}
