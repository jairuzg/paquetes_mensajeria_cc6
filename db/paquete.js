const conexion = require('./conexion');
const conn = conexion.conn;

function insertarPaquete(paquete) {
    let sql = 'insert into paquete (cotization_msj, peso) values (?, ?)';
    conn.query(sql, [paquete.cotization_msj, paquete.peso], function (err, rows, fields) {
        if (err) {
            console.log(err);
            return false;
        }
        return true;
    });
}

module.exports = {
    insertarPaquete: insertarPaquete
}
