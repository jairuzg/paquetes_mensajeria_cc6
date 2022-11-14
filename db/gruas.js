const conexion = require('./conexion');
const conn = conexion.conn;

function insertarGrua(grua) {
    let sql = 'insert into grua (marca, modelo, precio_kilometro, capacidad_peso) values (?, ?, ?, ?)';
    conn.query(sql, [grua.marca, grua.modelo, grua.precioKilometro, grua.capacidadPeso], function (err, rows, fields) {
        if (err) {
            console.log(err);
            return false;
        }
        return true;
    });
}

module.exports = {
    'insertarGrua': insertarGrua
}