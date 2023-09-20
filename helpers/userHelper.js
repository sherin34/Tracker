const bcrypt = require("bcrypt");
const { use } = require("../routes/login");
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(
  "./database/test.db",
  sqlite3.OPEN_READWRITE,
  (err) => {
    if (err) return console.error(err.message);
  }
);

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
console.log(rows.role)
          resolve(rows.role)
        } else {
          console.log("login failed due to user not exist");

                  }
      });
    });
  },
  doLogin(userData) {
    sql = "SELECT * FROM user WHERE user_id=?";
    let response={}
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
};
