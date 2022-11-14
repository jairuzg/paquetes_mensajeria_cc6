const conexion = require('./conexion.js')
const conn = conexion.conn;

function ejecutarConsulta (consulta) {
    conn.query(consulta, (err, rows, fields) => {
        if (err) console.log(err)

        console.log('The solution is: ', rows);
        return JSON.parse(JSON.stringify(rows));
    })
}

module.exports = {
    ejecutarConsulta: ejecutarConsulta
}
