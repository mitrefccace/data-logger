var express = require('express');
var fs = require('fs');
var json2csv = require('json2csv');
var decode = require('./../utils/decode');
var validator = require('./../utils/validator');
var AWS = require('aws-sdk');
var proxy = require('proxy-agent');
var router = express.Router();
var psList = require('ps-list');
var os = require('os');
var dateFormat = require('dateformat');
var nconf = require('nconf');
var asterisk_debug = "";
var logStream = "";
var asterisk_pcap = "";

const {
  spawn
} = require('child_process');


AWS.config.update({
  region: 'us-east-1',
  httpOptions: {
    agent: proxy(decode(nconf.get('proxy')))
  }
});

var s3 = new AWS.S3();


function restrict(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!';
    let sql = "SELECT COUNT(*) AS adminCount FROM login_credentials WHERE role = 'admin' limit 0,1;";
    req.connection.query(sql, function (err, result) {
      if (err) {
        console.log('SQL ERR: ' + err);
        res.send('err');
      } else if (result[0].adminCount === 0) {
        res.render('pages/firsttimesetup');
      } else {
        res.redirect('./login');
      }
    });
  }
}

router.get('/', restrict, function (req, res) {
  res.redirect('./sessionmanager');
});

router.get('/sessionmanager', restrict, function (req, res) {
  res.render('pages/session', {
    role: req.session.role
  });
});

router.get('/getSessionTableData', restrict, function (req, res) {
  let sql = "SELECT * FROM session_data ORDER BY session_id ASC;";
  req.connection.query(sql, function (err, results) {
    if (err) {
      console.log("SQL Error: " + err);
      res.status(200).send({
        'message': 'Error'
      });
    } else {
      res.status(200).send({
        'message': 'Success',
        'records': results
      });
    }
  });
});

router.get('/getSessionInfo', restrict, function (req, res) {
  let session_id = req.query.session_id;
  let sql = "SELECT * FROM session_data WHERE session_id = ?;";
  req.connection.query(sql, session_id, function (err, results) {
    if (err) {
      console.log("SQL Error: " + err);
      res.status(200).send({
        'message': 'Error'
      });
    } else {
      res.status(200).send({
        'message': 'Success',
        'data': results
      });
    }
  });
});





router.get('/devicemanager', restrict, function (req, res) {
  res.render('pages/device_manager', {
    role: req.session.role
  });
});


router.get('/getDeviceTableData', restrict, function (req, res) {
  let sql = "SELECT * FROM device_data ORDER BY device_id DESC;";
  req.connection.query(sql, function (err, results) {
    if (err) {
      console.log("SQL Error: " + err);
      res.status(200).send({
        'message': 'Error something went wrong'
      });
    } else {
      res.status(200).send({
        'message': 'Success',
        'records': results
      });
    }
  });
});


router.get('/downloadPcapFile', restrict, function (req, res) {
  let session_id = req.query.session_id;
  let sql = "SELECT * FROM session_data WHERE session_id = ?;";
  req.connection.query(sql, session_id, function (err, results) {
    if (err) {
      console.log("SQL Error: " + err);
      res.status(200).send({
        'message': 'Error'
      });
    } else {

      let filename = results[0].pcap_file_name
      let folder = filename.substr(0, filename.indexOf('.'));
      var fileKey = folder + '/' + results[0].pcap_file_name;
      var options = {
        Bucket: decode(nconf.get('s3bucket')),
        Key: fileKey,
      };

      res.attachment(results[0].pcap_file_name);
      var fileStream = s3.getObject(options).createReadStream();
      fileStream.pipe(res);
    }
  });
});

router.get('/getMatrixData', restrict, function (req, res) {
  let call_direction = req.query.call_direction;
  let datetime = req.query.datetime;

  let sql = "SELECT provider_device, session_id, session_name, session_notes, " +
    " passfail, call_direction, session_end FROM session_data " +
    " WHERE session_id IN (SELECT MAX(session_id) " +
    " FROM session_data where call_direction = ? " +
    " AND session_end < FROM_UNIXTIME(?) " +
    " AND session_end IS NOT NULL GROUP BY provider_device);"
  req.connection.query(sql, [call_direction, datetime.slice(0, -3)], function (err, results) {
    if (err) {
      console.log("SQL Error: " + err);
      res.status(200).send({
        'message': 'Error something went wrong.'
      });
    } else {
      res.status(200).send({
        'message': 'Success',
        'data': results
      });
    }
  });
})

router.get('/downloadAsteriskLog', restrict, function (req, res) {
  let session_id = req.query.session_id;
  let sql = "SELECT * FROM session_data WHERE session_id = ?;";
  req.connection.query(sql, session_id, function (err, results) {
    if (err) {
      console.log("SQL Error: " + err);
      res.status(200).send({
        'message': 'Error'
      });
    } else {
      let filename = results[0].asterisk_file_name
      let folder = filename.substr(0, filename.indexOf('.'));
      var fileKey = folder + '/' + results[0].asterisk_file_name;

      var options = {
        Bucket: decode(nconf.get('s3bucket')),
        Key: fileKey,
      };

      res.attachment(results[0].asterisk_file_name);
      var fileStream = s3.getObject(options).createReadStream();
      fileStream.pipe(res);
    }
  });
});

router.get('/download', restrict, function (req, res) {
  let mode = req.query.mode;
  let filename = req.query.filename || 'session_download';
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;
  let sessionIds = req.query.sessionIds;

  console.log("endData: " + endDate);
  console.log("sessionIds: " + sessionIds);


  var query = 'SELECT * FROM session_data ORDER BY session_id';
  var params = [];
  if (mode === '1' && startDate && endDate) {
    query = 'SELECT * FROM session_data WHERE (session_start BETWEEN FROM_UNIXTIME(?) AND FROM_UNIXTIME(?)) ORDER BY session_id';
    params = [startDate.slice(0, -3), endDate.slice(0, -3)]
  }
  if (mode === '2' && sessionIds) {
    console.log(sessionIds);
    query = 'SELECT * FROM session_data WHERE session_id in (' + sessionIds + ');';
    console.log(query);
  }

  req.connection.query(query, params, function (err, rows, fields) {
    if (err) {
      console.log("/download", err);
      res.status(500).send({
        'message': 'MySQL error'
      });
    } else if (rows.length > 0) {
      //success
      JSON.stringify(rows);
      // Column names for the CSV file.
      var csvFields = ['session_id', 'session_name', 'provider_device',
        'call_direction', 'session_start', 'session_end', 'session_duration',
        'tester_name', 'ad_version', 'passfail', 'session_notes'
      ];

      var csv = json2csv({
        data: rows,
        fields: csvFields
      });

      res.setHeader('Content-disposition', 'attachment; filename=' + filename + '.csv');
      res.set('Content-Type', 'text/csv');
      res.status(200).send(csv);

    } else if (rows.length === 0) {
      res.status(200).send({
        'message': 'No records',
        'data': rows
      });
    }
  });


});

router.post('/createNewSession', restrict, function (req, res) {
  let session_name = req.body.session_name;
  let notes = req.body.notes;
  let tester_name = req.session.firstname + ' ' + req.session.lastname;
  let provider_device = req.body.provider_device;
  let call_direction = req.body.call_direction;

  let sql = "INSERT INTO session_data (session_name, tester_name, session_notes, call_direction, provider_device) VALUES (?,?,?,?,?);";
  req.connection.query(sql, [session_name, tester_name, notes, call_direction, provider_device], function (err, result) {
    if (err) {
      console.log('SQL ERR: ' + err);
      res.send('err');
    } else {
      res.send(result.insertId + '');
    }
  });
});

router.post('/updateSession', restrict, function (req, res) {
  let session_id = req.body.session_id;
  let session_name = req.body.session_name;
  let notes = req.body.notes;
  let passfail = req.body.passfail;
  let provider_device = req.body.provider_device;
  let call_direction = req.body.call_direction;

  switch (passfail) {
    case '1':
      passfail = 'pass';
      break;
    case '2':
      passfail = 'fail';
      break;
    default:
      passfail = 'na';
      break;
  }

  if (session_id) {
    let sql = "UPDATE session_data SET session_name = ?, session_notes = ?, passfail = ?, provider_device = ?, call_direction = ?  WHERE session_id = ?;";
    req.connection.query(sql, [session_name, notes, passfail, provider_device, call_direction, session_id], function (err, result) {
      if (err) {
        console.log('SQL ERR: ' + err);
        res.send('err');
      } else {
        res.send(result.affectedRows + ' record updated.');
      }
    });
  } else {
    res.send('Bad Inputs')
  }
});

router.post('/DeleteSession', restrict, function (req, res) {
  var id = req.body.id;
  console.log("Delete ID: " + id)
  if (id > 1 && !isNaN(id)) {
    var sql = "DELETE FROM session_data WHERE session_id = ?;";
    req.connection.query(sql, id, function (err, result) {
      if (err) {
        console.log('SQL ERR: ' + err);
        res.send('err');
      } else {
        res.send(result.affectedRows + " record deleted");
      }
    });
  } else {
    res.send('Bad Inputs')
  }
});


router.post('/startSession', restrict, function (req, res) {
  let session_id = req.body.session_id;

  // Build filenames
  var ts = dateFormat("mm-dd-yyyy-hh-MM-ss");
  var hostname = os.hostname();
  var logdirectory = decode(nconf.get('logdirectory'));

  console.log("Log location: " + decode(nconf.get('logdirectory')));

  var asterisk_logfile = "test" + session_id + "-" + hostname + "-" + ts + ".log";
  var pcap_logfile = "test" + session_id + "-" + hostname + "-" + ts + ".pcap";

  console.log("Asterisk log: " + asterisk_logfile);
  console.log("pcap log: " + pcap_logfile);

  if (session_id) {
    let sql = "UPDATE `session_data` SET `session_start` = now(), `session_status` = ?, " +
      "`pcap_file_name` = ?, `pcap_file_path` = ?, `asterisk_file_name` = ?, " +
      "`asterisk_file_path` = ? WHERE `session_id` = ?";

    console.log('SQL: ' + sql);
    req.connection.query(sql, ["Recording", pcap_logfile, logdirectory, asterisk_logfile, logdirectory, session_id], function (err, result) {
      if (err) {
        console.log('SQL ERR: ' + err);
        res.send('err');
      } else {


        console.log("MySQL result " + JSON.stringify(result));

        // Make sure this is enabled before each call
        asterisk_config = spawn('sudo', ['asterisk', '-rx', "pjsip set logger on"]);

        logStream = fs.createWriteStream(logdirectory + asterisk_logfile, {
          flags: 'w'
        });

        console.log("#### ENTERING START SESSION");
        res.send(result.insertId + '');

        // Start the Asterisk debug log redirect
        asterisk_debug = spawn('tail', ['-f', '-n0', '/var/log/asterisk/debug']);
        asterisk_debug.stdout.pipe(logStream);
        asterisk_debug.stderr.pipe(logStream);

        // Start the tcpdump logging
        // asterisk_pcap = spawn('sudo', ['tcpdump', '-vvvv', '-w', '/tmp/asterisk.pcap']);
        asterisk_pcap = spawn('sudo', ['tcpdump', '-vvvv', '-w', logdirectory + pcap_logfile]);

        asterisk_pcap.stdout.on('error', (data) => {
          console.log(`error: ${data}`);
        });


      }
    });
  } else {
    res.send('Bad Inputs')
  }
});

router.post('/stopSession', restrict, function (req, res) {
  let session_id = req.body.session_id;

  if (session_id) {
    let sql = "UPDATE `session_data` SET `session_status` = ?, `session_end` = now(), " +
      "`session_duration`=UNIX_TIMESTAMP(session_end) - UNIX_TIMESTAMP(session_start) " +
      "WHERE `session_id` = ?";
    req.connection.query(sql, ["Finished", session_id], function (err, result) {
      if (err) {
        console.log('SQL ERR: ' + err);
        res.send('err');
      } else {
        console.log("#### ENTERING STOP SESSION");

        res.send(result.insertId + '');
        asterisk_config = spawn('sudo', ['asterisk', '-rx', "pjsip set logger off"]);

        // Stop the Asterisk debug file redirect
        if (asterisk_debug) {
          asterisk_debug.kill('SIGHUP');

          asterisk_debug.on('close', (code, signal) => {
            console.log(`STOP child process exited with signal ${signal}`);
          });
        }


        /*
         * Stop the tcpdump logging
         * Use the ps-list module to get a list of all active processes,
         * search for tcpdump and execute a kill. We need to do this because
         * the pid returned by the child process is the pid of the shell
         * that launches tcpdump, not tcpdump itself.
         * JSON looks like this:
         * { pid: 9556,
         *  name: 'sudo',
         *  cmd: 'sudo tcpdump -vvvv -w /tmp/asterisk.pcap',
         *  cpu: '0.0' },
         * { pid: 9557,
         *  name: 'tcpdump',
         *  cmd: 'tcpdump -vvvv -w /tmp/asterisk.pcap',
         *  cpu: '0.0' },
         */
        psList().then(data => {
          for (var i = 0; i < data.length; i++) {
            if (data[i].name === "tcpdump") {
              spawn('sudo', ['kill', '-9', data[i].pid]);
            }
          }

          sql = "SELECT * FROM session_data WHERE session_id = ?;";
          req.connection.query(sql, session_id, function (err, results) {
            if (err) {
              console.log("SQL Error: " + err);
            } else {
              var pcapfile = results[0].pcap_file_path + results[0].pcap_file_name;
              var asteriskfile = results[0].asterisk_file_path + results[0].asterisk_file_name;


              var filename = results[0].asterisk_file_name
              var folder = filename.substr(0, filename.indexOf('.'));

              var pUploadParams = {
                Bucket: decode(nconf.get('s3bucket')),
                Key: '',
                Body: ''
              };

              var aUploadParams = {
                Bucket: decode(nconf.get('s3bucket')),
                Key: '',
                Body: ''
              };

              var fs = require('fs');
              var pFileStream = fs.createReadStream(pcapfile);
              var aFileStream = fs.createReadStream(asteriskfile);
              pFileStream.on('error', function (err) {
                console.log('File Error', err);
              });
              aFileStream.on('error', function (err) {
                console.log('File Error', err);
              });
              pUploadParams.Body = pFileStream;
              aUploadParams.Body = aFileStream;

              var path = require('path');
              pUploadParams.Key = folder + '/' + path.basename(pcapfile);
              aUploadParams.Key = folder + '/' + path.basename(asteriskfile);

              s3.upload(pUploadParams, function (err, data) {
                if (err) {
                  console.log("Error", err);
                }
                if (data) {
                  console.log("Upload Success", data.Location);
                  fs.unlink(pcapfile, (err) => {
                    if (err) throw err;
                    console.log(pcapfile + ' was deleted from the server');
                  });
                }
              });

              s3.upload(aUploadParams, function (err, data) {
                if (err) {
                  console.log("Error", err);
                }
                if (data) {
                  console.log("Upload Success", data.Location);
                  fs.unlink(asteriskfile, (err) => {
                    if (err) throw err;
                    console.log(asteriskfile + ' was deleted from the server');
                  });
                }
              });

            }

          });
        });

      }
    });
  }
});



router.get('/cdr', restrict, function (req, res) {
  res.render('pages/cdr', {
    role: req.session.role
  });
})

router.get('/getallcdrrecs', restrict, function (req, res) {
  console.log('GET /getallcdrrecs');
  var query = 'SELECT * FROM ' + decode(nconf.get('mysql:cdr')) + ' ORDER BY calldate';
  var params = [];
  if (req.query.start && req.query.end) {
    query = 'SELECT * FROM ' + decode(nconf.get('mysql:cdr')) + ' WHERE (calldate BETWEEN ? AND ?)';
    params = [req.query.start, req.query.end];
  }
  req.connection.query(query, params, function (err, rows, fields) {
    if (err) {
      console.log("/getallcdrrecs an error has occurred", err);
      res.status(500).send({
        'message': 'MySQL error'
      });
    } else if (rows.length > 0) {
      //success
      if (req.query.download) {
        JSON.stringify(rows);

        // Column names for the CSV file.
        var csvFields = ['calldate', 'clid', 'src',
          'dst', 'dcontext', 'channel',
          'dstchannel', 'lastapp', 'lastdata',
          'duration', 'billsec', 'disposition',
          'amaflags', 'accountcode', 'userfield',
          'uniqueid', 'linkedid', 'sequence',
          'peeraccount'
        ];

        var csv = json2csv({
          data: rows,
          fields: csvFields
        });
        res.setHeader('Content-disposition', 'attachment; filename=cdr.csv');
        res.set('Content-Type', 'text/csv');
        res.status(200).send(csv);
      } else {
        res.status(200).send({
          'message': 'Success',
          'data': rows
        });
      }
    } else if (rows.length === 0) {
      res.status(200).send({
        'message': 'No cdr records',
        'data': rows
      });
    }
  });
});



router.get('/users', restrict, function (req, res) {
  var sql = "SELECT idlogin_credentials, username, first_name, last_name, last_login FROM login_credentials WHERE role <> 'admin';";
  req.connection.query(sql, function (err, results) {
    if (err) {
      console.log("SQL Error: " + err);
    } else {
      res.render('pages/users', {
        users: results,
        role: req.session.role
      });
    }
  });
});

router.post('/AddUser', restrict, function (req, res) {
  var username = req.body.username;
  var password = req.body.password;
  var firstname = req.body.firstname;
  var lastname = req.body.lastname;

  if (validator.isUsernameValid(username) && validator.isPasswordComplex(password) && validator.isNameValid(firstname) && validator.isNameValid(lastname)) {
    var sql = "INSERT INTO login_credentials (username, password, first_name, last_name, role, last_login) VALUES (?,?,?,?,?,?);";
    req.connection.query(sql, [username, password, firstname, lastname, "researcher", null], function (err, result) {
      if (err) {
        console.log('SQL ERR: ' + err);
        res.send('err');
      } else {
        res.send(result.affectedRows + " record updated");
      }
    });
  } else {
    res.send('Bad Inputs')
  }
});

router.post('/DeleteUser', restrict, function (req, res) {
  var id = req.body.id;
  if (id > 1 && !isNaN(id)) {
    var sql = "DELETE FROM login_credentials WHERE idlogin_credentials = ? AND role <> 'admin';";
    req.connection.query(sql, id, function (err, result) {
      if (err) {
        console.log('SQL ERR: ' + err);
        res.send('Error');
      } else {
        res.send(result.affectedRows + " record deleted");
      }
    });
  } else {
    res.send('Bad Inputs')
  }
});


router.get('/SessionData', restrict, function (req, res) {
  let session_Id = req.query.sId;
  var query = 'SELECT session_id, session_name FROM session_data ORDER BY session_id DESC;';
  req.connection.query(query, function (err, sessions) {
    if (err) {
      console.log("/call_logs ERROR: ", err.code);
      res.send('MySQL Error');
    } else {
      if (!session_Id)
        session_Id = sessions[0] ? sessions[0].session_id : null;
      res.render('pages/session_data', {
        'role': req.session.role,
        'sessions': sessions,
        'sId': session_Id
      });
    }
  });
});

router.get('/matrix', restrict, function (req, res) {
  res.render('pages/matrix', {
    role: req.session.role
  });
});

router.post('/CreateAdmin', function (req, res) {
  var username = req.body.username;
  var password = req.body.password;
  var firstname = req.body.firstname;
  var lastname = req.body.lastname;
  if (validator.isUsernameValid(username) && validator.isPasswordComplex(password) && validator.isNameValid(firstname) && validator.isNameValid(lastname)) {
    var sql_1 = "SELECT COUNT(*) AS adminCount FROM login_credentials WHERE role = 'admin' limit 0,1;";
    req.connection.query(sql_1, function (err, result_1) {
      if (err) {
        console.log('SQL ERR: ' + err);
        res.send('err');
      } else if (result_1[0].adminCount === 0) {
        var sql_2 = "INSERT INTO login_credentials (username, password, first_name, last_name, role, last_login) VALUES (?,?,?,?,?,?);";
        req.connection.query(sql_2, [username, password, firstname, lastname, "admin", null], function (err, result_2) {
          if (err) {
            console.log('SQL ERR: ' + err);
            res.send('err');
          } else {
            res.send(result_2.affectedRows + " record updated");
          }
        });
      } else {
        res.send("Account already exists");
      }
    });
  } else {
    res.send('Bad Inputs')
  }
});



router.get('/login', function (req, res) {
  if (req.session.user) {
    res.redirect('./');
  } else {
    res.render('pages/login');
  }
});

router.post('/login', function (req, res) {
  var username = req.body.username;
  var password = req.body.password;
  if (validator.isUsernameValid(username) && validator.isPasswordComplex(password)) {
    var sql = "SELECT * FROM login_credentials WHERE username = ? and password = ? limit 0,1;";
    var params = [username, password]
    req.connection.query(sql, params, function (err, user) {
      if (err) {
        console.log("SQL Login Error: " + err);
      } else {
        if (user.length === 1) {
          req.session.idlogin_credentials = user[0].idlogin_credentials;
          req.session.user = user[0].username;
          req.session.firstname = user[0].first_name;
          req.session.lastname = user[0].last_name;
          req.session.role = user[0].role;
          req.session.error = '';
          req.connection.query("UPDATE `login_credentials` SET `last_login` = now() WHERE `idlogin_credentials` = ?", user[0].idlogin_credentials, function (err, result) {});
          res.status(200).send('success');
        } else {
          res.status(200).send('failure');
        }
      }
    });
  } else {
    res.send('Bad Inputs')
  }
});

router.get('/logout', function (req, res) {
  req.session.destroy(function (err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect('./');
    }
  });
});

module.exports = router;
