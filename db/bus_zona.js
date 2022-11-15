const conexion = require('./conexion');
const conn = conexion.conn;

function encontrarBusPorZona(zona, callback) {
    let sql = 'select bus_mensajeria from bus_mensajeria where zona_cobertura = ?';
    conn.query(sql, zona, function (err, rows, fields) {
        if (err) {
            console.log(err);
            callback(err, false);
        } else {
            if (rows.length) {
                let busMensajeria = JSON.parse(JSON.stringify(rows));
                console.log("se ha encontrado un bus para la zona ", rows);
                callback(null, busMensajeria[0]);
            } else {
                console.log("No se pudo encontrar bus para la zona ", zona);
                callback({error: "No se pudo encontrar bus para la zona " + zona})
            }
        }
    });
}

module.exports = {
    encontrarBusPorZona: encontrarBusPorZona
}