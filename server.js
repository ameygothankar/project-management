const express = require("express");
const app = express();
const http = require("http");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const dateFormat = require("dateformat");
const multer = require("multer");
const now = Date();
const session = require("express-session");
const alert = require("alert-node");
const path = require("path");
const fs = require("fs");
//session
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: false
  })
);

//multer
const storage = multer.diskStorage({
  destination: "./public/",
  filename: function(req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  }
});

// Init Upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }
}).single("myImage");

app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");
//bootstrap
app.use("/js", express.static(__dirname + "/node_modules/bootstrap/dist/js"));
app.use("/js", express.static(__dirname + "/node_modules/tether/dist/js"));
app.use("/js", express.static(__dirname + "/node_modules/jquery/dist"));
app.use("/css", express.static(__dirname + "/node_modules/bootstrap/dist/css"));
//db con
const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "proj"
});
//title
const siteTitle = "Project Management";
const baseURL = "http://localhost:4000";
//get when page is loaded
app.get("/", (req, res) => {
  if (req.session.loggedin) {
    con.query("SELECT * FROM projects ", function(error, result) {
      res.render("pages/index", {
        siteTitle: siteTitle,
        pageTitle: "Project List",
        items: result
      });
    });
  } else {
    res.redirect("/login");
    alert("please,LogIn First");
  }
});
// //search
app.get("/search", (req, res) => {
  if (req.session.loggedin) {
    con.query("SELECT * FROM projects", function(error, result) {
      res.render("pages/search", {
        siteTitle: siteTitle,
        pageTitle: "Project List",
        items: result
      });
    });
  } else {
    res.redirect("/login");
    alert("please,LogIn First");
  }
});
app.post("/search", (req, res) => {
  ins = `SELECT * FROM projects WHERE p_name LIKE '${req.body.search}%'`;
  con.query(ins, function(error, result) {
    res.render("pages/index", {
      siteTitle: siteTitle,
      pageTitle: "Project List",
      items: result
    });
  });
});

//proj details
app.get("/details/:id", (req, res) => {
  if (req.session.loggedin) {
    con.query(
      "SELECT * FROM projects WHERE id = '" + req.params.id + "'",
      function(error, result) {
        res.render("pages/projdetails", {
          siteTitle: siteTitle,
          pageTitle: "Project Details",
          items: result
        });
      }
    );
  } else {
    res.redirect("/login");
    alert("please,LogIn First");
  }
});

//adding data
app.get("/events/add", (req, res) => {
  if (req.session.loggedin) {
    res.render("pages/addData.ejs", {
      siteTitle: siteTitle,
      pageTitle: "Add Project ",
      items: ""
    });
  } else {
    res.redirect("/login");
    alert("please,LogIn First");
  }
});

//static

app.use(express.static("./public"));

//insert data project
app.post("/events/add", (req, res) => {
  upload(req, res, err => {
    if (err) {
      console.log(err);
    } else {
      if (req.file == undefined) {
        console.log("no File Selected");
      } else {
        console.log("Successfull");
        const ins = `INSERT INTO projects (author,date_added,p_name,p_desc,git_link,date_modified,u_id) VALUES ('${
          req.body.author
        }','${dateFormat(now, "yyyy-mm-dd")}','${req.body.p_name}','${
          req.body.p_desc
        }','${req.file.filename}','${dateFormat(
          req.body.date_added,
          "yyyy-mm-dd"
        )}',${req.session.u_id})`;
        //console.log(ins);
        console.log(req.file.path);

        con.query(ins, function(error, result) {
          if (error) {
            console.log(error);
            alert("something went wrong");
          } else {
            res.redirect(baseURL);
          }
        });
      }
    }
  });
});
//download
app.get("/download/:id", (req, res) => {
  con.query(
    "SELECT * FROM projects WHERE id = '" + req.params.id + "'",
    function(error, result) {
      if (error) console.log(err);
      const filen = result[0].git_link;
      const file = `${__dirname}/public/${filen}`;
      res.download(file);
    }
  );
});
//Update
app.get("/events/update/:id", (req, res) => {
  con.query(
    "SELECT * FROM projects WHERE id = '" + req.params.id + "'",
    function(error, result) {
      result[0].date_modified = dateFormat(
        result[0].date_modified,
        "yyyy-mm-dd"
      );
      if (result[0].u_id === req.session.u_id) {
        res.render("pages/update.ejs", {
          siteTitle: siteTitle,
          pageTitle: "Update Project " + result[0].p_name + "",
          items: result
        });
      } else {
        alert("Not a valid User");
        res.redirect(baseURL);
      }
    }
  );
});
//handle updated data
app.post("/events/update/:id", (req, res) => {
  const ins = `UPDATE projects SET author='${
    req.body.author
  }',date_modified='${dateFormat(now, "yyyy-mm-dd")}',p_name='${
    req.body.p_name
  }',p_desc='${req.body.p_desc}' WHERE projects . id ='${req.body.id}' `;
  con.query(ins, function(error, result) {
    if (error) {
      console.log(error);
      alert("Something went wrong");
    } else {
      res.redirect(baseURL);
    }
  });
});
//delete data
app.get("/events/delete/:id", (req, res) => {
  con.query(
    "SELECT * FROM projects WHERE id = '" + req.params.id + "'",
    function(error, result) {
      if (result[0].u_id === req.session.u_id) {
        con.query(
          `DELETE FROM projects WHERE id = '${req.params.id}'`,
          function(error, result) {
            res.redirect(baseURL);
          }
        );
      } else {
        alert("Not a valid User");
        res.redirect(baseURL);
      }
    }
  );
});
//login

app.get("/login", (req, res) => {
  con.query("SELECT * FROM login ", function(error, result) {
    res.render("pages/login", {
      siteTitle: siteTitle,
      pageTitle: "Project List",
      items: result
    });
  });
});

app.post("/login", (req, res) => {
  const username = req.body.email;
  const password = req.body.password;

  const ins = `SELECT * FROM login WHERE email = '${username}' AND pass = '${password}'`;

  con.query(ins, function(error, results, fields) {
    if (results.length > 0) {
      u_id = results[0].id;

      req.session.loggedin = true;
      req.session.username = username;
      req.session.u_id = u_id;
      res.redirect(baseURL);
    } else {
      alert("Incorrect Username or Password!");
    }
  });
});

//signup
app.get("/signUp", (req, res) => {
  con.query("SELECT * FROM login ", function(error, result) {
    if (error) {
    }
    res.render("pages/signUp", {
      siteTitle: siteTitle,
      pageTitle: "Project List",
      items: result
    });
  });
});

app.post("/signUp", (req, res) => {
  const ins = `INSERT INTO login (email,pass) VALUES ('${req.body.email}','${req.body.password}')`;

  con.query(ins, function(error, result) {
    if (error) {
      alert("Already exists");
    } else {
      if (result.affectedRows === 1) {
        con.query("SELECT * FROM login ", function(error, result) {
          u_id = result[0].id;
          req.session.loggedin = true;
          req.session.username = result[0].email;
          req.session.u_id = u_id;
          res.redirect(baseURL);
        });
      }
    }
  });
});

//logout
app.get("/logout", (req, res) => {
  res.render("pages/login", {
    siteTitle: siteTitle,
    pageTitle: "Project List"
  });
  req.session.destroy();
});

const server = app.listen(4000, () => {
  console.log("server started");
});
