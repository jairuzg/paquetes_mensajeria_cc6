const conexion = require('./conexion');
const conn = conexion.conn;

function heartBeat(callback) {
    conn.query('SELECT 1', function (err, rows, res) {
        if (err) {
            callback(err, false);
        }
        console.log(rows)
        if (rows.length) {
            callback(null, true)
        }
    });
}

module.exports = {
    heartBeat: heartBeat
}