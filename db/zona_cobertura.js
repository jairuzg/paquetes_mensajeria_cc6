const conexion = require('./conexion');
const conn = conexion.conn;

function listarTodasLasZonasCobertura(callback) {
    let sql = "select zona_cobertura zonaCobertura, st_x(coordenadas_geo) longitud, st_y(coordenadas_geo) latitud, radio, descripcion from zona_cobertura";
    conn.query(sql, (error, rows, fields) => {
        if (error) {
            callback(error);
        } else {
            let zonas = JSON.parse(JSON.stringify(rows));
            callback(null, zonas);
        }
    });
}

function insertarZonaCobertura(zona_cobertura, callback) {
    let sql = 'insert into zona_cobertura (coordenadas_geo, radio, descripcion) values (point(?, ?), ?, ?)';
    conn.query(sql, [zona_cobertura.longitud, zona_cobertura.latitud, zona_cobertura.radio, zona_cobertura.descripcion], function (err, result, fields) {
        if (err) {
            callback(err, false);
        } else {
            callback(null, result.insertId)
        }
    });
}

function encontrarZonaCercaDeCoordenada(latitud, longitud, callback) {
    let sql = 'select zona_cobertura from zona_cobertura order by st_distance_sphere(coordenadas_geo, POINT(?, ?)) limit 1';
    conn.query(sql, [longitud, latitud, longitud, latitud], function (err, rows, fields) {
        if (err) {
            console.log('que pedo', err)
            callback(err);
        } else {
            let zonaCobertura = JSON.parse(JSON.stringify(rows));
            callback(null, zonaCobertura[0]);
        }
    });
}

function obtenerZonaPorId(zona, callback) {
    let sql = "select zona_cobertura zonaCobertura, st_x(coordenadas_geo) longitud, st_y(coordenadas_geo) latitud, " +
        "radio, descripcion from zona_cobertura where zona_cobertura = ?";
    conn.query(sql, zona, (error, rows, fields) => {
        if (!error) {
            let zona = JSON.parse(JSON.stringify(rows));
            callback(null, zona[0]);
        } else {
            callback(error);
        }
    });
}

function eliminarZonaPorId(zona, callback) {
    let sql = "delete from zona_cobertura where zona_cobertura = ?";
    conn.query(sql, zona, function (err, result) {
        if (err) {
            callback(err, false);
        } else {
            callback(null, true)
        }
    });
}

function modificarZonaPorId(zona, callback) {
    let params = []
    let sql = "update zona_cobertura set zona_cobertura = ? ";
    params.push(zona.zonaCobertura);
    if (zona.longitud && zona.latitud) {
        sql += " , coordenadas_geo = point(?,?) ";
        params.push(zona.longitud);
        params.push(zona.latitud);
    }
    if (zona.radio) {
        sql += " , radio = ?";
        params.push(zona.radio);
    }
    if (zona.descripcion) {
        sql += " , descripcion = ?";
        params.push(zona.descripcion);
    }
    sql += " where zona_cobertura = ?"
    params.push(zona.zonaCobertura);

    conn.query(sql, params, (error, result) => {
        if (error) {
            callback(error, false);
        } else {
            callback(null, true);
        }
    });
}

module.exports = {
    insertarZonaCobertura: insertarZonaCobertura,
    encontrarZonaCercaDeCoordenada: encontrarZonaCercaDeCoordenada,
    listarTodasLasZonasCobertura: listarTodasLasZonasCobertura,
    obtenerZonaPorId: obtenerZonaPorId,
    eliminarZonaPorId: eliminarZonaPorId,
    modificarZonaPorId: modificarZonaPorId
}
