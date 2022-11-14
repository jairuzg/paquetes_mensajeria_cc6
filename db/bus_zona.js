const conexion = require('./conexion');
const conn = conexion.conn;

function relacionarBusZona(buzZona, callback) {
    let sql = 'insert into bus_zona_cobertura (bus_mensajeria, zona_cobertura) values (?, ?)';
    conn.query(sql, [buzZona.busMensajeria, buzZona.zonaCobertura], function (err, result) {
        if (err) {
            console.log(err);
            callback(err);
        }
        callback(null, result.insertId)
    });
}

function encontrarBusPorZona(zona, callback) {
    let sql = 'select bus_mensajeria from bus_mensajeria where zona_cobertura = ?';
    conn.query(sql, zona, function (err, rows, fields) {
        if (err) {
            console.log(err);
            callback(err, false);
        }
        let busMensajeria = JSON.parse(JSON.stringify(rows));
        callback(null, busMensajeria[0]);
    });
}

function eliminarVinculoBusZona(busZona, callback){
    let sql = "delete from bus_zona_cobertura where bus_zona = ?";
    conn.query(sql, busZona, (error, result)=>{
        if(error) {
            callback(error, false);
        } else {
            callback(null, true);
        }
    });
}

module.exports = {
    relacionarBusZona: relacionarBusZona,
    encontrarBusPorZona: encontrarBusPorZona,
    eliminarVinculoBusZona: eliminarVinculoBusZona
}