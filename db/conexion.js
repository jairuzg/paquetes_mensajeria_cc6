const mysql = require('mysql')
const conn = mysql.createConnection({
    host: 'URL DEL SERVIDOR5',
    user: 'USUARIO',
    password: 'PASSWORD DEL USUARIO',
    database: 'NOMBRE DE LA DB'
})

conn.on('error', function(err) {
  console.log("[mysql error]",err);
});

module.exports = {
    conn: conn
}