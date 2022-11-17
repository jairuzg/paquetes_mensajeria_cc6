const conexion = require('./conexion');
const {dbfirestore} = require("./firebase");
const constants = require("./../common/constants");
const {transformarPagoAFirebasePago} = require("../servicios/servicio_pagos");
const {getCurrentTime} = require("../common/utils");
const conn = conexion.conn;

function insertarPago(pago, callback) {
    console.log("adentro de insretarPago ", pago);
    let sql = "insert into pago (ordenID, numero_cc, fecha_transaccion, exp_mes, exp_anio, external_db_id, estado_transaccion) " +
        "values (?, ?, ?, ?, ?, ?, ?)";
    conn.query(sql, [pago.ordenID, pago.numeroCC, pago.fechaTransaccion? pago.fechaTransaccion: getCurrentTime(), pago.mesExp,
        pago.anioExp, pago.firebaseId, pago.firebaseId? constants.PAGO_EXITOSO: constants.PAGO_FALLIDO], (errors, result) => {
        if (!errors) {
            pago.pagoId = result.insertId;
            pago.fechaTransaccion = Date();
            callback(null, pago);
        } else {
            callback(errors, pago);
        }
    });
}

async function mandarPagoAFirestore(pago) {
    let pagoFb = transformarPagoAFirebasePago(pago);
    console.log("pagoFb? ",pagoFb);
    pago.servidor = constants.SERVIDOR_ACTUAL;
    let errFb;
    await dbfirestore.collection("payments").add(pagoFb).then(docRef => {
        console.log("documento escrito para el PAGO, ID: ", docRef.id);
        pago.firebaseId = docRef.id;
    }).catch(err => {
        errFb = err;
        console.log("ocurrio un error al tratar de escribir el documento de pago ", err);
    });
    return {errFb, pago};
}

function obtenerPagoDeLaDBLocalPorOrdenID(ordenID, callback) {
    let sql = "select pago, ordenID, fecha_transaccion fechaTransaccion, estado_transaccion estadoTransaccion from pago where ordenID = ? ";
    conn.query(sql, ordenID, (errors, rows, fields) => {
        if (!errors && rows.length) {
            let pago = JSON.parse(JSON.stringify(rows));
            callback(null, pago[0]);
        } else {
            if (errors) callback(errors);
            else callback({error: "No se encontro ningun pago con ese identificador de orden"});
        }
    });
}

module.exports = {
    insertarPago: insertarPago,
    mandarPagoAFirestore: mandarPagoAFirestore,
    obtenerPagoDeLaDBLocalPorOrdenID: obtenerPagoDeLaDBLocalPorOrdenID
}
