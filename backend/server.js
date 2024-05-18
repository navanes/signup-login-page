require('dotenv').config()
const express = require('express')
const mysql = require('mysql2')
const cors = require('cors')
const jwt = require('jsonwebtoken');

const app = express()
app.use(cors())
app.use(express.json())

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'my-secret-pw',
  port: '3307',
  database: 'node_db'
})

// db.query(`SELECT * FROM signup`, (err, result) => {
//   if(err) {
//     console.log(err)
//   }
//   console.log(result)
// })

db.connect(err => {
  if (err) {
    console.error('Error connecting to MYSQL:', err)
    return
  }
  console.log('MYSQL connected successfully')

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS login (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL
    )`
  db.query(createTableQuery, (err) => {
    if (err) {
      console.error('Error creating table:', err);
      return;
    }
    console.log('Table "signup" created or already exists');
  })

})

app.post('/signup', (req, res) => {
  const sql = "INSERT INTO signup (`name`, `email`, `password`) VALUES (?)"
  const values = [
    req.body.name,
    req.body.email,
    req.body.password
  ]
  db.query(sql, [values], (err, data) => {
    if(err) {
      res.status(500).json({ message: "Internal server error" });
    } else {
      // const user = { email: req.body.email }
      // const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
      res.status(200).json({ message: "Signup successful", data: data });
    }
  })
})

app.post('/login', (req, res) => {
  //Authenticate user
  const sql = "SELECT * FROM signup WHERE `email` = ? AND `password` = ?";
  const values = [
    req.body.email,
    req.body.password
  ]
  db.query(sql, values, (err, data) => {
    if(err) {
      return res.json('Error')
    }
    if(data.length > 0) {
        const user = { email: req.body.email }
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
        res.json({ message: "Login successful", accessToken: accessToken })
    } else {
        res.status(401).json({ message: "Invalid credentials" });
    }
  })
})

//get the token that they've sent us, we want to verify that this is the correct user, and then get that user up to the post function
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] //Bearer Token => we want the token that is why we split it then take the second element [1]
  if(token == null) return res.sendStatus(401)

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if(err) return res.sendStatus(403)
    req.user = user
    next()
  })

}

app.get('/values', authenticateToken, (req, res) => {
  const values = [
    { username: 'user1', value: 'value1' },
    { username: 'user2', value: 'value2' },
    { username: 'user3', value: 'value3' },
  ];
  res.json(values.filter(value => value.username === req.user.name));
})

app.listen(8081, () => {
  console.log('listening...')
})