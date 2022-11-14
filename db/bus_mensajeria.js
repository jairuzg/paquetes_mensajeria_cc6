const conexion = require('./conexion');
const conn = conexion.conn;

function obtenerTodosLosBuses(callback) {
    let sql = "select bus_mensajeria busMensajeria, marca, modelo, capacidad_peso capacidadPeso, zona_cobertura zonaCobertura from bus_mensajeria";
    conn.query(sql, (errors, rows, fields) => {
        if (!errors) {
            let buses = JSON.parse(JSON.stringify(rows));
            callback(null, buses);
        } else {
            callback(errors);
        }
    });
}

function obtenerBusPorId(bus, callback) {
    let sql = "select bus_mensajeria busMensajeria, marca, modelo, capacidad_peso capacidadPeso, zona_cobertura zonaCobertura from bus_mensajeria where bus_mensajeria = ?";
    conn.query(sql, bus, (error, rows, fields) => {
        if (!error) {
            let bus = JSON.parse(JSON.stringify(rows));
            callback(null, bus[0]);
        } else {
            callback(error);
        }
    });
}

function insertarBus(bus, callback) {
    let sql = 'insert into bus_mensajeria (marca, modelo, capacidad_peso, zona_cobertura) values (?, ?, ?, ?)';
    conn.query(sql, [bus.marca, bus.modelo, bus.capacidadPeso, bus.zonaCobertura], function (err, result) {
        if (err) {
            console.log(err);
            callback(err);
        } else {
            callback(null, true);
        }
    });
}

function eliminarBusPorId(busMensajeria, callback) {
    let sql = "delete from bus_mensajeria where bus_mensajeria = ?";
    conn.query(sql, busMensajeria, function (err, result) {
        if (err) {
            callback(err, false);
        } else {
            callback(null, true)
        }
    });
}

function actualizarBusPorId(busMensajeria, callback) {
    let params = []
    let sql = "update bus_mensajeria set bus_mensajeria = ? ";
    params.push(busMensajeria.busMensajeria);
    if (busMensajeria.marca) {
        sql += " , marca = ?";
        params.push(busMensajeria.marca);
    }
    if (busMensajeria.modelo) {
        sql += " , modelo = ?";
        params.push(busMensajeria.modelo);
    }
    if (busMensajeria.capacidadPeso) {
        sql += " ,capacidad_peso = ?";
        params.push(busMensajeria.capacidadPeso);
    }
    if (busMensajeria.zonaCobertura) {
        sql += " ,zona_cobertura = ?";
        params.push(busMensajeria.zonaCobertura);
    }
    sql += " where bus_mensajeria = ?"
    params.push(busMensajeria.busMensajeria);

    conn.query(sql, params, (error, result) => {
        if (error) {
            callback(error, false);
        } else {
            callback(null, true);
        }
    });
}

module.exports = {
    insertarBus: insertarBus,
    obtenerTodosLosBuses: obtenerTodosLosBuses,
    eliminarBusPorId: eliminarBusPorId,
    actualizarBusPorId: actualizarBusPorId,
    obtenerBusPorId: obtenerBusPorId
}