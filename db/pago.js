const conexion = require('./conexion');
const {dbfirestore} = require("./firebase");
const constants = require("./../common/constants");
const conn = conexion.conn;

function insertarPago(pago, callback) {
    let sql = "insert into pago (ordenID, numero_cc, fecha_transaccion, exp_mes, exp_anio) " +
        "values (?, ?, now(), ?, ?)";
    conn.query(sql, [pago.ordenID, pago.numeroCC, pago.mesExp, pago.anioExp], (errors, result) => {
        if (!errors) {
            pago.pagoId = result.insertId;
            pago.fechaTransaccion = Date();
            callback(null, pago);
        } else {
            callback(errors);
        }
    });
}

function mandarPagoAFirestore(pago) {
    delete pago.numeroCC;
    delete pago.mesExp;
    delete pago.anioExp;
    pago.estado = constants.EXITOSO;
    pago.servidor = constants.SERVIDOR_ACTUAL;
    dbfirestore.collection("payments").add(pago).then(docRef => {
        console.log("documento escrito, ID: ", docRef.id);
    }).catch(err => {
        console.log("ocurrio un error al tratar de escribir el documento ", err);
    });
}

module.exports = {
    insertarPago: insertarPago,
    mandarPagoAFirestore: mandarPagoAFirestore
}
