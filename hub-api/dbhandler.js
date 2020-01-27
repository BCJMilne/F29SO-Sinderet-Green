var fs = require("fs"),
sqlite3 = require("sqlite3").verbose(),
schemaFile = `${__dirname}/db/hub-schema.sql`,
schema = fs.readFileSync(schemaFile, "utf8");

// var db = new sqlite3.Database(`${__dirname}/db/data`);

// Make a temporary database in memory, NOT PERSISTENTLY TO DISK
var db = new sqlite3.Database(":memory:");

function getWholeDate() {
  var d = new Date();
  var dateString = `${d.getFullYear()}-${(d.getMonth() + 1)}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
  return dateString.padEnd(19, " ");
}

db.serialize(function() {
  db.exec(schema, function(err) {
    if (err) {
      console.log(`[${getWholeDate()}] ! Error creating database!`);
      console.log(`[${getWholeDate()}] ! ${err}`);
    } else {
      console.log(`[${getWholeDate()}] > Created database`);
    }
  });
});

db.on("error", function(error) {
  console.log(`[${getWholeDate()}] ! ${error}`);
});

class databasehandler    {
  
  constructor()    {
    console.log(`[${getWholeDate()}] > DB connector created`);
  }
  
  /* #######################################
  
  Login functions.
  
  ####################################### */
  
  getUserByUsernameAndPassword(username, password, callback)  {
    var q = (`SELECT * FROM user WHERE user_username = ? AND user_password = ?`);
    
    db.all(q, [username, password], function(err, rows) {
      if(err) {
        callback(err);
      } else if(rows[0]) {
        callback(null, rows[0]["user_id"]);  // Details are correct
      } else {
        callback("Not found");
      }
    });
  }
  
  insertNewAuthToken(user_id, token, expires, callback)  {
    var q = (`INSERT INTO auth (auth_token, auth_user_id, auth_created, auth_expires) VALUES (?, ?, ?, ?)`);
    
    var created = new Date().valueOf();
    
    db.run(q, [token, user_id, created, expires], function(err) {
      if(err) {
        console.log(`[${getWholeDate()}] ! Error inserting data record into ${table}:`);
        console.log(`[${getWholeDate()}] ! ${err}`);
        callback(err, null);
      } else  {
        console.log(`[${getWholeDate()}] > Inserted new auth token: ${JSON.stringify(this.lastID)}`);
        callback(null, JSON.stringify(this.lastID));
      }
    });
  }
  
  checkToken(user_id, token, callback)
  {
    var q = (`SELECT * FROM auth WHERE auth_user_id = ? AND auth_token = ?`);
    
    db.all(q, [user_id, token], function(err, rows) {
      if(err) {
        callback(err);
      } else if(rows[0])  {
        callback(null, "auth_expires");
      } else  {
        callback("Not found");
      }
    });
  }
  
  /* #######################################
  
  Get by ID.
  
  ####################################### */
  
  getById(table, id, callback)
  {
    var q = (`SELECT * FROM ${table} WHERE ${table}_id = ?`);
    
    db.all(q, [id], function(err, rows) {
      if(err) {
        callback(err);
      } else  {
        callback(null, rows);
      }
    });
  }
  
  getAccountTypeById(id, callback)  { this.getById("account_type", id, callback); }
  getSensorTypeById(id, callback)   { this.getById("sensor_type", id, callback); }
  getRoomById(id, callback)         { this.getById("room", id, callback); }
  getDeviceTypeById(id, callback)   { this.getById("device_type", id, callback); }
  getCommandById(id, callback)      { this.getById("device_command", id, callback); }
  
  getSensorById(id, callback) { this.getById("sensor", id, callback); }
  getDeviceById(id, callback) { this.getById("device", id, callback); }
  
  /* #######################################
  
  Get by room.
  
  ####################################### */
  
  getByRoom(table, roomId, callback)
  {
    var q = (`SELECT * FROM ${table} WHERE ${table}_room = ?`);
    
    db.all(q, [roomId], function(err, rows) {
      if(err) {
        callback(err);
      } else  {
        callback(null, rows);
      }
    });
  }
  
  getSensorByRoom(roomId, callback) { this.getByRoom("sensor", roomId, callback); }
  getDeviceByRoom(roomId, callback) { this.getByRoom("device", roomId, callback); }
  
  /* #######################################
  
  Get all of something with limits.
  
  ####################################### */
  
  getMany(table, callback, limit, offset) {
    
    if(limit && offset) {
      var q = (`SELECT * FROM ${table} LIMIT ${limit} OFFSET ${offset}`);
    } else if(limit) {
      var q = (`SELECT * FROM ${table} LIMIT ${limit}`);
    } else  {
      var q = (`SELECT * FROM ${table}`);
    }
    
    db.all(q, function(err, rows) {
      if(err) {
        callback(err);
      } else  {
        callback(null, rows);
      }
    });
  }
  
  getAccountTypes(callback, limit, offset)    { this.getMany("account_type", callback, limit, offset); }
  getSensorTypes(callback, limit, offset)     { this.getMany("sensor_type", callback, limit, offset); }
  getRooms(callback, limit, offset)           { this.getMany("room", callback, limit, offset); }
  getDeviceTypes(callback, limit, offset)     { this.getMany("device_type", callback, limit, offset); }
  
  getSensors(callback, limit, offset)         { this.getMany("sensor", callback, limit, offset); }
  getDevices(callback, limit, offset)         { this.getMany("device", callback, limit, offset); }
  getUsers(callback, limit, offset)           { this.getMany("user", callback, limit, offset); }
  getSensorReadings(callback, limit, offset)  { this.getMany("sensor_reading", callback, limit, offset); }
  getDeviceReadings(callback, limit, offset)  { this.getMany("device_reading", callback, limit, offset); }
  
  /* #######################################
  
  Get sensor data by filters.
  
  ####################################### */
  
  getSensorReadingsByTimeframe(id, start, end, callback)
  {
    if( ! (end) ) {
      end = new Date().valueOf();
    }
    var q = (`SELECT * FROM sensor_reading WHERE sensor_reading_sensor_id = ?
    AND sensor_reading_timestamp > ?
    AND sensor_reading_timestamp < ? `);
    
    db.all(q, [id, start, end], function(err, rows) {
      if(err) {
        callback(err);
      } else  {
        callback(null, rows);
      }
    });
  }
  
  getDeviceReadingsByTimeframe(id, start, end, callback)
  {
    if( ! (end) ) {
      end = new Date().valueOf();
    }
    var q = (`SELECT * FROM device_reading WHERE device_reading_sensor_id = ?
    AND device_reading_timestamp > ?
    AND device_reading_timestamp < ? `);
    
    db.all(q, [id, start, end], function(err, rows) {
      if(err) {
        callback(err);
      } else  {
        callback(null, rows);
      }
    });
  }

  /* #######################################
  
  Device command functions.
  
  ####################################### */
  
  getCommandsByDevice(device_id, callback)
  {
    var q = (`SELECT * FROM device_command
              INNER JOIN device ON device.device_type = device_command.device_command_device_type
              WHERE device.device_id = ?`);
    
    db.all(q, [device_id], function(err, rows) {
      if(err) {
        callback(err);
      } else  {
        callback(null, rows);
      }
    });
  }

  executeCommand(command_id, callback)  {

  }

  /* #######################################
  
  Inserting auxiliary data.
  
  ####################################### */
  
  insertOne(table, val, callback)
  {
    var q = (`INSERT INTO ${table} (${table}_name) VALUES (?)`);
    
    db.run(q, [val], function(err) {
      if(err) {
        console.log(`! Error inserting data record into ${table}:`);
        console.log(`! ${err}`);
        callback(err, null);
      } else  {
        console.log(`> Inserted data record into ${table}: ${JSON.stringify(this.lastID)}`);
        callback(null, JSON.stringify(this.lastID));
      }
    });
  }
  
  insertProperty(val, callback)     { this.insertOne("property", val, callback); }
  insertAccountType(val, callback)  { this.insertOne("account_type", val, callback); }
  insertSensorType(val, callback)   { this.insertOne("sensor_type", val, callback); }
  insertRoom(val, callback)         { this.insertOne("room", val, callback); }
  insertDeviceType(val, callback)   { this.insertOne("device_type", val, callback); }
  
  /* #######################################
  
  Inserting larger records.
  
  ####################################### */
  
  insertUser(account_type, username, password, email, forename, surname, callback)
  {
    var ts = new Date().valueOf();
    var q = (`INSERT INTO user (user_account_type, user_username, user_email, user_forename, user_surname, user_password, user_created) VALUES (?, ?, ?, ?)`);
    
    db.run(q, [account_type, username, password, email, forename, surname, ts], function(err) {
      if(err) {
        console.log(`[${getWholeDate()}] ! Error inserting data record into user:`);
        console.log(`[${getWholeDate()}] ! ${err}`);
        callback(err, null);
      } else  {
        console.log(`[${getWholeDate()}] > Inserted data record into user: ${JSON.stringify(this.lastID)}`);
        callback(null, JSON.stringify(this.lastID));
      }
    });
  }

  generateId()  {
    var id           = '',
    idPiece          = '',
    length           = 3,
    characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    charactersLength = characters.length;
    
    for( var x = 0; x < length; x++)    {
      idPiece = '';
      for( var i = 0; i < length; i++ ) {
        idPiece += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      if(x != 3)  {
        id = id += idPiece;
      }
    }
    
    this.getDeviceById(id, function(err, rows)  {
      if(err) {
        callback(err);
      } else if(rows[0])  {
        // There was a device with that id
        id = generateId();
      }
    });

    this.getSensorById(id, function(err, rows) {
      if(err) {
        callback(err);
      } else if(rows[0])  {
        // There was a sensor with that id
        id = generateId();
      }
    });

    return id;
  }

  insertSensor(room, type, name, callback)
  {
    var ts = new Date().valueOf();
    var q = (`INSERT INTO sensor (sensor_id, sensor_room, sensor_type, sensor_name, sensor_added) VALUES (?, ?, ?, ?, ?)`);
    
    var newId = this.generateId();

    db.run(q, [newId, room, type, name, ts], function(err) {
      if(err) {
        console.log(`[${getWholeDate()}] ! Error inserting data record into sensor:`);
        console.log(`[${getWholeDate()}] ! ${err}`);
        callback(err, null);
      } else  {
        console.log(`[${getWholeDate()}] > Inserted data record into sensor: ${JSON.stringify(this.lastID)}`);
        callback(null, JSON.stringify(this.lastID));
      }
    });
  }

  insertDevice(room, type, wattage, name, callback)
  {
    var ts = new Date().valueOf();
    var q = (`INSERT INTO device (device_id, device_room, device_type, device_wattage, device_name, device_added) VALUES (?, ?, ?, ?, ?, ?)`);
    
    var newId = this.generateId();

    db.run(q, [newId, room, type, wattage, name, ts], function(err) {
      if(err) {
        console.log(`[${getWholeDate()}] ! Error inserting data record into device:`);
        console.log(`[${getWholeDate()}] ! ${err}`);
        callback(err, null);
      } else  {
        console.log(`[${getWholeDate()}] > Inserted data record into device: ${JSON.stringify(this.lastID)}`);
        callback(null, JSON.stringify(this.lastID));
      }
    });
  }
  
  /* #######################################
  
  Inserting readings.
  
  ####################################### */
  
  insertSensorReading(id, val)
  {
    var ts = new Date().valueOf();
    var q = (`INSERT INTO sensor_reading (sensor_reading_sensor_id, sensor_reading_value, sensor_reading_timestamp) VALUES (?, ?, ?)`);
    
    db.run(q, [id, val, ts], function(err) {
      if (err) {
        console.log(`[${getWholeDate()}] ! Error inserting data record for sensor ${id}:`);
        console.log(`[${getWholeDate()}] ! ${err}`);
      }
      console.log(`[${getWholeDate()}] > Inserted data record for sensor ${id}: ${JSON.stringify(this.lastID)}`);
    });
  }
  
  insertDeviceReading(id, type, val)
  {
    var ts = new Date().valueOf();
    var q = (`INSERT INTO device_reading (device_reading_sensor_id, device_reading_type, device_reading_value, device_reading_timestamp) VALUES (?, ?, ?, ?)`);
    
    db.run(q, [id, type, val, ts], function(err) {
      if (err) {
        console.log(`[${getWholeDate()}] ! Error inserting data record for device ${id}:`);
        console.log(`[${getWholeDate()}] ! ${err}`);
      }
      console.log(`[${getWholeDate()}] > Inserted data record for device ${id}: ${JSON.stringify(this.lastID)}`);
    });
  }
  
}

module.exports = databasehandler;
