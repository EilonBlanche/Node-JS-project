const express = require('express');
const path = require('path')
const MongoClient = require('mongodb');
const Mysql = require('mysql');
const { Pool } = require('pg');
const request = require('request');
const fileUpload = require('express-fileupload');
const dateFormat = require("dateformat");
const moment = require('moment');
const cors = require('cors')
var url = 'mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false';
var app = express();
var port = 6000;
var hostname = "localhost";
app.use(cors());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sample_database',
  password: 'passw0rd',
  port: 5432,
})

let connection = Mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'biPassword',
    database: 'sample_database'
});

let connection2 = Mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'biPassword',
    database: 'person_interest_db'
});

app.set('view engine', 'ejs');

app.engine('html', require('ejs').renderFile);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

app.use(fileUpload());

app.set('view engine', 'html');

app.post('/select_records', (req, res) => {
    let data = req.body;
    if(data.type == "MongoDB")
    {
        MongoClient.connect(url, { useUnifiedTopology: true }, function(err, db) {
            if (err) throw err;
            var dbo = db.db("sample_database");
            dbo.collection("name_collection").find({}).toArray(function(err, result) {
                if (err) 
                {
                    throw err;
                }
                else
                {
                    res.setHeader("Content-Type", "application/json");
                    res.send(result);
                }
                db.close();
            });
        });
    }
    else if(data.type == "Mysql")
    {
        connection.query("SELECT * FROM profiles", function (err, result, fields) {
            res.setHeader("Content-Type", "application/json");
            res.send(result);
        });
    }
    else if(data.type == "Postgresql")
    {            
        let sql = "SELECT * FROM profiles";
        pool.query(sql, (err, result) => {
            if (err) {
                console.log(err.stack)
            } else {
                res.setHeader("Content-Type", "application/json");
                res.send(result.rows);
            }
        })
    }
    else
    {
        res.send('Error 404 not found', 404);
    }
})


app.get('/', function(req, res){
    res.render(__dirname + '/views/view.html');
});


app.get('/persons_of_interest', function (req, res) {
    let sql = `SELECT * FROM person_of_interests_table ORDER BY date_created desc`;
    connection2.query(sql, function (error, result, fields) {
        if (error) {
            throw error;
        }
        res.render(__dirname + '/views/persons_interest.html', {data : result});
    });
});

app.post('/get_person_of_interests', function (req, res) {
    data = req.body;
    let sql = `SELECT * FROM person_of_interests_table WHERE firstname LIKE '%${data.firstname}%' AND lastname LIKE '%${data.lastname}%'`;

    if (req.body.hasOwnProperty('lastname') && req.body.hasOwnProperty('firstname'))
    {
        if (req.body.hasOwnProperty('middlename')) {
            sql = sql + ` AND middlename = '${data.middlename}'`;
        }
        connection2.query(sql, function (error, result, fields) {
            if (error) {
                throw error;
            }
            res.send(result);
        });
    }
    else
    {
        res.send("Required Parameters not found in your request", 400);
    }
});

// app.post('/get_person_of_interest', async (req, res) => {
//         let data = req.body;
//         let sql = `SELECT * FROM profiles WHERE profile_person_of_interest = 1 AND profile_firstname = '${data.profile_firstname}' AND profile_lastname = '${data.profile_lastname}' AND profile_middlename = '${data.profile_middlename}'`;
//         var mysql_result = [];
//         var postgresql_result = [];
//         var mongodb_result = [];
//         getAllProfileInterestMysql = () =>{
//             return new Promise((resolve, reject)=>{
//                 connection.query(sql, async function(error, result, fields) {
//                     if(error){
//                         return reject(error);
//                     }
//                     return resolve(result);
//                 });
//             });
//         };

//         getAllProfileInterestPostgresql = () =>{
//             return new Promise((resolve, reject)=>{
//                 console.log(sql);
//                 pool.query(sql, async (error, result) => {
//                     if(error){
//                         return reject(error);
//                     }
//                     return resolve(result.rows);
//                 })
//             });
//         };

//         getAllProfileInterestMongoDB = () =>{
//             return new Promise((resolve, reject)=>{
//                 MongoClient.connect(url, { useUnifiedTopology: true }, function(err, db) {
//                     if (err) throw err;
//                     var dbo = db.db("sample_database");
//                     dbo.collection("name_collection").find({ $and : [{"profile_person_of_interest" : 1}, {"profile_firstname" : data.profile_firstname}, {"profile_middlename" : data.profile_middlename}, {"profile_lastname" : data.profile_lastname}] }).then(function (result) {
//                         console.log(result);
//                     })
//                 });
//             });
//         };

//         try{
//             mysql_result = await getAllProfileInterestMysql();
//             postgresql_result = await getAllProfileInterestPostgresql();
//             mongodb_result = await getAllProfileInterestPostgresql();
//             total_result = {
//                 "Mysql" : mysql_result,
//                 "Postgresql" : postgresql_result,
//                 "MongoDB" : mongodb_result
//             };
//             res.send(total_result, 200);
//             // console.log(mysql_result);
//             // console.log(mongodb_result);
//             // here you can do something with the three results
//         } 
//         catch(error){
//             console.log(error)
//         }

//         // connection.query("SELECT * FROM profiles", async function(err, result, fields) {
//         //     mysql_result = await result;
//         // });
//         // pool.query(sql, (err, result) => {
//         //     if (err) {
//         //         console.log(err.stack);
//         //     } else {
//         //         postgresql_result = result.rows;
//         //     }
//         // })
//         // MongoClient.connect(url, { useUnifiedTopology: true }, function(err, db) {
//         //     if (err) throw err;
//         //     var dbo = db.db("sample_database");
//         //     dbo.collection("name_collection").find({ $and : [{"profile_person_of_interest" : 1}, {"profile_firstname" : data.profile_firstname}, {"profile_middlename" : data.profile_middlename}, {"profile_lastname" : data.profile_lastname}] }).toArray(function(err, result) {
//         //         if (err) 
//         //         {
//         //             throw err;
//         //         }
//         //         else
//         //         {
//         //             mongodb_result = result;
//         //         }
//         //         db.close();
//         //     });
//         // });
//         // console.log(mongodb_result);
//         // console.log(mysql_result);
//         // console.log(postgresql_result);

// });

app.post('/select_profiles/:offset', function (req, res) {
    var options = {
        'method': 'GET',
        'url': `https://stp.sparksoftdemo.com/db-api/api/profiles?offset=${req.params.offset}&limit=100`
    };
    request(options, function (error, response, body) {
        if (error) {
            throw new Error(error);
        }
        else
        {

            // MongoClient.connect(url, function (err, db) {

            //     var dbo = db.db("sample_database");
            //     dbo.collection("name_collection").deleteMany({ "synced" : 1 }, function (err, result) {
            //         if (err) {
            //             throw err;
            //         }
            //     });
            // });

            // let delete_sql = "DELETE FROM profiles WHERE synced = 1";
            // pool.query(delete_sql, (err, result) => {
            //     if (err) {
            //         throw err;
            //     }
            // })

            // connection.query(delete_sql, function (err, result, fields) {
            //     if (err)
            //         throw err;
            // });

            let records = (typeof(body) == "string") ? JSON.parse(body) : body;
            records.data.forEach(myobj => {
                let sql = `INSERT INTO profiles (profile_firstname, profile_middlename, profile_lastname, profile_gender, profile_address1, profile_address2, profile_address3, profile_address4, profile_subburb, profile_state, profile_country, profile_postcode, profile_birthdate, profile_mobile_number, profile_phone1, profile_phone2, profile_nationality, profile_birthplace, profile_person_of_interest, created_at, synced) VALUES( '${myobj.profile_firstname}', '${myobj.profile_middlename}', '${myobj.profile_lastname}', '${myobj.profile_gender}', '${myobj.profile_address1}', '${myobj.profile_address2}', '${myobj.profile_address3}', '${myobj.profile_address4}', '${myobj.profile_subburb}', '${myobj.profile_state}', '${myobj.profile_country}', '${myobj.profile_postcode}', '${myobj.profile_birthdate}', '${myobj.profile_mobile_number}', '${myobj.profile_phone1}', '${myobj.profile_phone2}', '${myobj.profile_nationality}', '${myobj.profile_birthplace}', '${myobj.profile_person_of_interest}', now(), 1)`;
                connection.query(sql, function (err, result, fields) {
                    if (err)
                        throw err;
                });

                pool.query(sql, (err, res) => {
                    if (err) {
                        console.log(err.stack)
                    } else {
                        console.log(res)
                    }
                })

                MongoClient.connect(url, function (err, db) {
                   //delete myobj.database;

                    myobj['created_at'] = MongoClient.ObjectId().getTimestamp();
                    myobj['updated_at'] = null;
                    myobj['synced'] = 1;
                    myobj['profile_reason'] = '';
                    var dbo = db.db("sample_database");
                    dbo.collection("name_collection").insertOne(myobj, function (err, res) {
                        if (err) {
                            throw err;
                        }
                        else {
                            console.log("1 document inserted", myobj);
                        }
                    });
                    db.close();
                });
            });

            res.send("Successful Insert");
        }
    });
    
});

app.post('/interest_process/delete/:id', function (req, res) {
    var id = req.params.id;

    connection2.query("DELETE FROM person_of_interests_table WHERE id = " + id, function (err, result, fields) {
        if (err)
        {
            throw err;
        }
        else
        {
            res.send({ result: "Success" });
        }
    });
});

app.post('/interest_process', function (req, res) {
    var myobj = req.body;
    var currmoment = moment().unix().toString();
    var currFile = req.files.image;
    var uploadTo = __dirname + "/public/images/" + currmoment + path.extname(req.files.image.name);

    currFile.mv(uploadTo, function (error) {
        if (error)
        {
            throw error;
        }
        else
        {
            console.log("Succcessful Upload");
        }
    })
    let sql = `INSERT INTO person_of_interests_table (firstname, middlename, lastname, reason, image, date_created) VALUES( '${myobj.firstname}', '${myobj.middlename}', '${myobj.lastname}', '${myobj.reason}', '${currmoment + path.extname(req.files.image.name)}', now())`;
    connection2.query(sql, function (err, result, fields) {
        if (err)
            throw err;
    });
    res.redirect("/profile_form/persons_of_interest");
});

app.post('/process', function(req, res){
        var myobj = req.body;
        if(myobj.database == "Mysql")
        {
            
            let sql = `INSERT INTO profiles (profile_firstname, profile_middlename, profile_lastname, profile_gender, profile_address1, profile_address2, profile_address3, profile_address4, profile_subburb, profile_state, profile_country, profile_postcode, profile_birthdate, profile_mobile_number, profile_phone1, profile_phone2, profile_nationality, profile_birthplace, profile_person_of_interest, created_at, profile_reason) VALUES( '${myobj.profile_firstname}', '${myobj.profile_middlename}', '${myobj.profile_lastname}', '${myobj.profile_gender}', '${myobj.profile_address1}', '${myobj.profile_address2}', '${myobj.profile_address3}', '${myobj.profile_address4}', '${myobj.profile_subburb}', '${myobj.profile_state}', '${myobj.profile_country}', '${myobj.profile_postcode}', '${myobj.profile_birthdate}', '${myobj.profile_mobile_number}', '${myobj.profile_phone1}', '${myobj.profile_phone2}', '${myobj.profile_nationality}', '${myobj.profile_birthplace}', '${myobj.profile_person_of_interest}', now(), ${myobj.profile_reason})`;
            connection.query(sql, function (err, result, fields) {
                if(err)
                    throw err;
            });
        }
        else if(myobj.database == "MongoDB")
        {
            MongoClient.connect(url, function(err, db) {
                delete myobj.database;
                
                myobj['created_at'] = MongoClient.ObjectId().getTimestamp();
                myobj['updated_at'] = null;
                myobj['synced'] = 0;
                var dbo = db.db("sample_database");
                dbo.collection("name_collection").insertOne(myobj, function(err, res) {
                    if (err) 
                    {
                        throw err;
                    }
                    else
                    {
                        console.log("1 document inserted", myobj);
                    }
                });
                db.close();
            });
        }
        else if(myobj.database == "Postgresql")
        {
            let sql = `INSERT INTO profiles (profile_firstname, profile_middlename, profile_lastname, profile_gender, profile_address1, profile_address2, profile_address3, profile_address4, profile_subburb, profile_state, profile_country, profile_postcode, profile_birthdate, profile_mobile_number, profile_phone1, profile_phone2, profile_nationality, profile_birthplace, profile_person_of_interest, created_at, profile_reason) VALUES( '${myobj.profile_firstname}', '${myobj.profile_middlename}', '${myobj.profile_lastname}', '${myobj.profile_gender}', '${myobj.profile_address1}', '${myobj.profile_address2}', '${myobj.profile_address3}', '${myobj.profile_address4}', '${myobj.profile_subburb}', '${myobj.profile_state}', '${myobj.profile_country}', '${myobj.profile_postcode}', '${myobj.profile_birthdate}', '${myobj.profile_mobile_number}', '${myobj.profile_phone1}', '${myobj.profile_phone2}', '${myobj.profile_nationality}', '${myobj.profile_birthplace}', '${myobj.profile_person_of_interest}', now(), ${myobj.profile_reason})`;

            // let sql = `INSERT INTO name_table(firstname, middlename, lastname) VALUES( '${myobj.firstname}', '${myobj.middlename}', '${myobj.lastname}' )`;
            pool.query(sql, (err, res) => {
                if (err) {
                    console.log(err.stack)
                } else {
                    console.log(res)
                }
            })
        }
        return res.redirect('/profile_form');
});



app.get('/form', function(req, res){
    res.render(__dirname + '/views/form.html', {title : "Insert new profile", data : [], type : "" });
})

app.get('/interest_form', function (req, res) {
    res.render(__dirname + '/views/interest_form.html', { title: "Insert new person of Interest", data: [], type: "" });
})


app.get('/interest_form/edit/:id', function (req, res) {
    var id = req.params.id;
    connection2.query("SELECT * FROM person_of_interests_table WHERE id = " + id, function (err, result, fields) {
        res.render(__dirname + '/views/interest_form.html', { title: "Edit person of interest", data: result[0] });
    });
});

app.post('/interest_process/update/:id', function (req, res) {
    var id = req.params.id;
    var myobj = req.body;
    var currmoment = moment().unix().toString();
    var currFile = null;
    var upload_img_query = ``;
    if (req.files != null)
    {
        currFile = req.files.image;
        upload_img_query = `image = '${currmoment + path.extname(req.files.image.name)}',`;

        var uploadTo = __dirname + "/public/images/" + currmoment + path.extname(req.files.image.name);

        currFile.mv(uploadTo, function (error) {
            if (error) {
                throw error;
            }
            else {
                console.log("Succcessful Upload");
            }
        })
    }

    

    let sql = `UPDATE person_of_interests_table SET firstname = '${myobj.firstname}', middlename = '${myobj.middlename}', lastname ='${myobj.lastname}', reason = '${myobj.reason}', `+upload_img_query+`
        date_updated = NOW() WHERE id = '${id}'`;
    connection2.query(sql, function (err, result, fields) {
        if (err)
            throw err;
    });
    res.redirect("/profile_form/persons_of_interest");
})

app.get('/edit/:id/:type', function(req, res){
    var id = req.params.id;
    var type = req.params.type;

    if(type == "MongoDB")
    {
        var ObjectId = require('mongodb').ObjectId; 
        var o_id = new ObjectId(id);
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("sample_database");
            dbo.collection("name_collection").find( { _id : o_id} ).toArray(function(err, result) {
                console.log(result);
                if (err) 
                {
                    throw err;
                }
                else
                {
                    res.render(__dirname + '/views/form.html', {title : "Edit profile", data : result[0], type : type });
                }
                db.close();
            });
        });
    }
    else if(type == "Mysql")
    {
        connection.query("SELECT * FROM profiles WHERE profile_id = "+id, function (err, result, fields) {
            res.render(__dirname + '/views/form.html', {title : "Edit profile", data : result[0], type : type });
        });
    }
    else if(type == "Postgresql")
    {
        let sql = "SELECT * FROM profiles WHERE profile_id = "+id;
        pool.query(sql, (err, result) => {
            if (err) {
                console.log(err.stack)
            } else {
                res.render(__dirname + '/views/form.html', {title : "Edit profile", data : result.rows[0], type : type });
            }
        })
    }
})


app.post('/sync_data', function (req, res) {

    var FormData = require('form-data');
    let data = req.body;
    console.log(data);
    if (data.type == "MongoDB") {
        MongoClient.connect(url, { useUnifiedTopology: true }, function (err, db) {
            if (err) throw err;
            var dbo = db.db("sample_database");
            dbo.collection("name_collection").find({ "synced" : 0 }).forEach(function (result) {


                var options = {
                    'method': 'POST',
                    'url': 'https://stp.sparksoftdemo.com/db-api/api/profiles/insert',
                    'headers': {
                    },
                    formData: {
                        'profile_firstname': `${result.profile_firstname}`,
                        'profile_middlename': `${result.profile_middlename}`,
                        'profile_lastname': `${result.profile_lastname}`,
                        'profile_gender': `${result.profile_gender}`,
                        'profile_address1': `${result.profile_address1}`,
                        'profile_address2': `${result.profile_address2}`,
                        'profile_address3': `${result.profile_address3}`,
                        'profile_address4': `${result.profile_address4}`,
                        'profile_subburb': `${result.profile_subburb}`,
                        'profile_state': `${result.profile_state}`,
                        'profile_country': `${result.profile_country}`,
                        'profile_postcode': `${result.profile_postcode}`,
                        'profile_birthdate': `${result.profile_birthdate}`,
                        'profile_mobile_number': `${result.profile_mobile_number}`,
                        'profile_phone1': `${result.profile_phone1}`,
                        'profile_phone2': `${result.profile_phone2}`,
                        'profile_nationality': `${result.profile_nationality}`,
                        'profile_birthplace': `${result.profile_birthplace}`,
                        'profile_person_of_interest': `${result.profile_person_of_interest}`,
                        'profile_flags': `${result.profile_flags}`,
                        'created_at': `${result.created_at}`,
                        'created_by': `officer1@sample.com`,
                        'updated_by': `officer1@sample.com`
                    }
                };
                request(options, function (error, response) {
                    if (error) {
                        throw new Error(error);
                    }
                    else
                    {
                        console.log(response);
                    }
                });

            });

            dbo.collection("name_collection").updateMany({ "synced": 0 }, { $set: { "synced": 1 } }, function(err, res) {
                if (err) {
                    throw err;
                }
                else {
                    console.log("documents updated");
                }
            });

            res.send({ 'Syncing Data': 'Success' }, 200);
        });
    }
    else if (data.type == "Mysql") {
     
        connection.query("SELECT * FROM profiles WHERE synced = 0", function (err, results, fields) {
            results.forEach((result, index) => {
                var options = {
                    'method': 'POST',
                    'url': 'https://stp.sparksoftdemo.com/db-api/api/profiles/insert',
                    'headers': {
                    },
                    formData: {
                        'profile_firstname': `${result.profile_firstname}`,
                        'profile_middlename': `${result.profile_middlename}`,
                        'profile_lastname': `${result.profile_lastname}`,
                        'profile_gender': `${result.profile_gender}`,
                        'profile_address1': `${result.profile_address1}`,
                        'profile_address2': `${result.profile_address2}`,
                        'profile_address3': `${result.profile_address3}`,
                        'profile_address4': `${result.profile_address4}`,
                        'profile_subburb': `${result.profile_subburb}`,
                        'profile_state': `${result.profile_state}`,
                        'profile_country': `${result.profile_country}`,
                        'profile_postcode': `${result.profile_postcode}`,
                        'profile_birthdate': `${dateFormat(result.profile_birthdate, "yyyy-mm-dd")}`,
                        'profile_mobile_number': `${result.profile_mobile_number}`,
                        'profile_phone1': `${result.profile_phone1}`,
                        'profile_phone2': `${result.profile_phone2}`,
                        'profile_nationality': `${result.profile_nationality}`,
                        'profile_birthplace': `${result.profile_birthplace}`,
                        'profile_person_of_interest': `${result.profile_person_of_interest}`,
                        'profile_flags': `${result.profile_flags}`,
                        'created_at': `${dateFormat(result.created_at, "yyyy-mm-dd")}`,
                        'created_by': `officer1@sample.com`,
                        'updated_by': `officer1@sample.com`
                    }
                };
                console.log(options);
                request(options, function (error, response) {
                    if (error) throw new Error(error);
                });
            });
        });

        let sql = `UPDATE profiles SET 
        synced = 1,
        updated_at = NOW() WHERE synced = 0`;
        connection.query(sql);

        res.send({ 'Syncing Data': 'Success' }, 200);
    }
    else if (data.type == "Postgresql") {
        let sql = "SELECT * FROM profiles WHERE synced = 0";
        pool.query(sql, (err, results) => {
            if (err) {
                console.log(err.stack)
            } else {

                results.rows.forEach(result => {
                    var options = {
                        'method': 'POST',
                        'url': 'https://stp.sparksoftdemo.com/db-api/api/profiles/insert',
                        'headers': {
                        },
                        formData: {
                            'profile_firstname': `${result.profile_firstname}`,
                            'profile_middlename': `${result.profile_middlename}`,
                            'profile_lastname': `${result.profile_lastname}`,
                            'profile_gender': `${result.profile_gender}`,
                            'profile_address1': `${result.profile_address1}`,
                            'profile_address2': `${result.profile_address2}`,
                            'profile_address3': `${result.profile_address3}`,
                            'profile_address4': `${result.profile_address4}`,
                            'profile_subburb': `${result.profile_subburb}`,
                            'profile_state': `${result.profile_state}`,
                            'profile_country': `${result.profile_country}`,
                            'profile_postcode': `${result.profile_postcode}`,
                            'profile_birthdate': `${dateFormat(result.profile_birthdate, "yyyy-mm-dd")}`,
                            'profile_mobile_number': `${result.profile_mobile_number}`,
                            'profile_phone1': `${result.profile_phone1}`,
                            'profile_phone2': `${result.profile_phone2}`,
                            'profile_nationality': `${result.profile_nationality}`,
                            'profile_birthplace': `${result.profile_birthplace}`,
                            'profile_person_of_interest': `${result.profile_person_of_interest}`,
                            'profile_flags': `${result.profile_flags}`,
                            'created_at': `${dateFormat(result.created_at, "yyyy-mm-dd")}`,
                            'created_by': `officer1@sample.com`,
                            'updated_by': `officer1@sample.com`
                        }
                    };
                    request(options, function (error, response) {
                        if (error) throw new Error(error);
                    });
                });
            }
        })
        let update_sql = `UPDATE profiles SET 
        synced = 1,
        updated_at = NOW()`;
        pool.query(update_sql);

        res.send({ 'Syncing Data': 'Success' }, 200);
    }
    else {
        res.send('Error 404 not found', 404);
    }
})



app.post('/update/:id/', function(req, res){
    
    var id = req.params.id;
    var myobj = req.body;
    if(myobj.database == "Mysql")
    {
        let sql = `UPDATE profiles SET profile_firstname = '${myobj.profile_firstname}', 
        profile_middlename = '${myobj.profile_middlename}', 
        profile_lastname ='${myobj.profile_lastname}', 
        profile_gender = '${myobj.profile_gender}', 
        profile_address1 = '${myobj.profile_address1}', 
        profile_address2 = '${myobj.profile_address2}', 
        profile_address3 = '${myobj.profile_address3}', 
        profile_address4 = '${myobj.profile_address4}', 
        profile_subburb = '${myobj.profile_subburb}', 
        profile_state = '${myobj.profile_state}', 
        profile_country = '${myobj.profile_country}', 
        profile_postcode = '${myobj.profile_postcode}', 
        profile_birthdate = '${myobj.profile_birthdate}', 
        profile_mobile_number = '${myobj.profile_mobile_number}', 
        profile_phone1 ='${myobj.profile_phone1}', 
        profile_phone2 =  '${myobj.profile_phone2}', 
        profile_nationality = '${myobj.profile_nationality}', 
        profile_birthplace = '${myobj.profile_birthplace}', 
        profile_person_of_interest = '${myobj.profile_person_of_interest}' , 
        profile_reason = '${myobj.profile_reason}' , 
        updated_at = NOW()
        WHERE profile_id = '${id}'`;
        connection.query(sql);
    }
    else if(myobj.database == "MongoDB")
    {
        var ObjectId = require('mongodb').ObjectId; 
        var o_id = new ObjectId(id);
        myobj['updated_at'] = MongoClient.ObjectId().getTimestamp();
        MongoClient.connect(url, function(err, db) {
            delete myobj.database;
            var dbo = db.db("sample_database");
            dbo.collection("name_collection").updateOne({ _id : o_id}, { $set : myobj }, function(err, res) {
                if (err) 
                {
                    throw err;
                }
                else
                {
                    console.log("1 document inserted", myobj);
                }
            });
            db.close();
        });
    }
    else if(myobj.database == "Postgresql")
    {        
        let sql = `UPDATE profiles SET profile_firstname = '${myobj.profile_firstname}', 
        profile_middlename = '${myobj.profile_middlename}', 
        profile_lastname ='${myobj.profile_lastname}', 
        profile_gender = '${myobj.profile_gender}', 
        profile_address1 = '${myobj.profile_address1}', 
        profile_address2 = '${myobj.profile_address2}', 
        profile_address3 = '${myobj.profile_address3}', 
        profile_address4 = '${myobj.profile_address4}', 
        profile_subburb = '${myobj.profile_subburb}', 
        profile_state = '${myobj.profile_state}', 
        profile_country = '${myobj.profile_country}', 
        profile_postcode = '${myobj.profile_postcode}', 
        profile_birthdate = '${myobj.profile_birthdate}', 
        profile_mobile_number = '${myobj.profile_mobile_number}', 
        profile_phone1 ='${myobj.profile_phone1}', 
        profile_phone2 =  '${myobj.profile_phone2}', 
        profile_nationality = '${myobj.profile_nationality}', 
        profile_birthplace = '${myobj.profile_birthplace}', 
        profile_person_of_interest = '${myobj.profile_person_of_interest}', 
        profile_reason = '${myobj.profile_reason}' , 
        updated_at = NOW()
        WHERE profile_id = '${id}'`;
        pool.query(sql, (err, res) => {
            if (err) {
                console.log(err.stack)
            } else {
                console.log(res)
            }
        })
    }

    
    return res.redirect('/profile_form');
});

app.post('/delete/:id/:type', function(req, res){
    var id = req.params.id;
    var type = req.params.type;

    if(type == "MongoDB")
    {
        
        var ObjectId = require('mongodb').ObjectId; 
        var o_id = new ObjectId(id);
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("sample_database");
            dbo.collection("name_collection").deleteOne({ _id : o_id}, function(err, result) {
                if (err) 
                {
                    throw err;
                }
                db.close();
            });
        });
    }
    else if(type == "Mysql")
    {
        connection.query("DELETE FROM profiles WHERE profile_id = "+id, function (err, result, fields) {
        });
        
    }
    else if(type == "Postgresql")
    {        
        let sql = "DELETE FROM profiles WHERE profile_id = "+id;
        pool.query(sql, (err, result) => {
            if (err) {
                throw err;
            } 
        })
    }

    res.send({result : "Success"});
})



app.listen(port, hostname, () => { 
    console.log(`Server running at http://${hostname}:${port}/`);
});

