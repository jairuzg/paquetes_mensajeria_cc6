const {conn} = require('./conexion');
const {getDistance} = require('geolib');
const constants = require('./../common/constants');
const {getRandomInRange} = require('./../common/utils');
const {dbfirestore} = require('./firebase')
const {cloneObject} = require("../common/utils");

const distance = getDistance(
    {latitude: 51.5103, longitude: 7.49347},
    {latitude: 51.5200, longitude: 7.49347}
)
console.log(distance / 1000) //value in km

function agregarCotizacion(cotizacion, callback) {
    console.log('entrando a agregar cotizacion');
    let sql = 'insert into cotizacion_msj (cotizacion_msj, recogida, destino, fecha_servicio, precio_envio, tiempo_estimado_llegada, ' +
        ' bus_mensajeria, nombre_recibe, estado, cantidad_articulos, precio_articulos, precio_total, peso_total, servidor, externalDBId) ' +
        ' values (?, point(?, ?), point(?, ?), now(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?);';
    return conn.query(sql, [cotizacion.ordenID, cotizacion.recogidaLongitud, cotizacion.recogidaLatitud, cotizacion.destinoLongitud,
        cotizacion.destinoLatitud, cotizacion.costoEnvio, cotizacion.tiempoEstimadoLlegada, cotizacion.busMensajeria, cotizacion.nombreRecibe, cotizacion.estado,
        cotizacion.cantidadArticulos, cotizacion.precioTotal, (cotizacion.precioTotal + (cotizacion.precioTotal * constants.PERCENT_TAX)),
        cotizacion.pesoTotal, cotizacion.servidor, cotizacion.firebaseId], function (err, results, fields) {
        console.log('ya dentro del query?')
        if (err) {
            console.log(err)
            callback(err);
        } else {
            console.log("que pasa dentro del success de agregar cotizacion", cotizacion)
            callback(null, cotizacion);
        }
    });
}

async function guardarCotizacionEnFirebase(cotizacion) {
    delete cotizacion.firebaseId;
    let errorFb;
    await dbfirestore.collection("orders").add(cotizacion).then(docRef => {
        console.log("documento escrito, ID: ", docRef.id);
        cotizacion.firebaseId = docRef.id;
    }).catch(err => {
        errorFb = err;
        console.log("ocurrio un error al tratar de escribir el documento ", err);
    });
    return {errorFb, cotizacion};
}

function transicionarCotiAPagado(pago, callback) {
    let sql = "update cotizacion_msj set estado = ? where cotizacion_msj = ? "
    conn.query(sql, [constants.ORDEN_PAGADA, pago.ordenID], function (err, results, fields) {
        if (!err) {
            callback(null, true);
        } else {
            callback(err);
        }
    });
}

function obtenerCotizacionPorOdenID(ordenID, callback) {
    let sql = "select cotizacion_msj ordenID, estado, cantidad_articulos cantidadArticulos, fecha_llegada fechaEntrega, " +
        "tiempo_estimado_llegada tiempoEstimadoLlegada, precio_envio costoEnvio, precio_articulos precioTotal, servidor from cotizacion_msj " +
        "where cotizacion_msj = ?";
    conn.query(sql, ordenID, function (err, rows, fields) {
        if (err) {
            callback(err)
        } else {
            if (rows.length) {
                let coti = JSON.parse(JSON.stringify(rows));
                callback(null, coti[0])
            } else {
                callback({error: "No se encontro la orden " + ordenID})
            }

        }
    });
}

async function obtenerCotizacionPorOdenEnFirestore(ordenId, callback) {
    const ordersRef = dbfirestore.collection('orders');
    const snapshot = await ordersRef.where('ordenID', '==', ordenId).get();
    if (snapshot.empty) {
        console.log('No matching documents.');
        return;
    }

    let coti;
    snapshot.forEach(doc => {
        console.log(doc.id, '=>', doc.data());
        coti = doc.data();
        coti.firebaseId = doc.id;
    });
    console.log("Se encontro la cotizacion en firebase ", coti.firebaseId);
    return coti;
}

async function actualizarEstadoOrdenFirestore(docId) {
    try {
        const ordersRef = await dbfirestore.collection('orders').doc(docId);
        await ordersRef.update({
            estado: constants.ORDEN_PAGADA
        })
        return true;
    } catch (ex) {
        console.log("no se pudo actualizar la orden ", ex);
        return false;
    }
}

async function actualizarOrdenEnFirestore(cotizacion, firebaseId) {
    console.log("dentro de actualizar orden para firebase ", cotizacion)
    const ordersRef = await dbfirestore.collection('orders').doc(firebaseId);
    delete cotizacion.firebaseId;
    ordersRef.update(cotizacion)
}

function ordenExiste(ordenID, callback) {
    let sql = "select count(1) conteo from cotizacion_msj where cotizacion_msj = ?";
    conn.query(sql, ordenID, (errors, rows, fields) => {
        if (!errors) {
            let count = (JSON.parse(JSON.stringify(rows)))[0].conteo;
            console.log("se pudo encontrar la orden en esta base de datos ", count);
            callback(null, (count > 0));
        } else {
            console.log("Hubo un inconveniente al tratar de encontrar la orden en esta base de datos ", ordenID);
            callback(errors);
        }
    });
}

module.exports = {
    agregarCotizacion: agregarCotizacion,
    transicionarCotiAPagado: transicionarCotiAPagado,
    obtenerCotizacionPorOdenID: obtenerCotizacionPorOdenID,
    guardarCotizacionEnFirebase: guardarCotizacionEnFirebase,
    actualizarEstadoOrdenFirestore: actualizarEstadoOrdenFirestore,
    obtenerCotizacionPorOdenEnFirestore: obtenerCotizacionPorOdenEnFirestore,
    actualizarOrdenEnFirestore: actualizarOrdenEnFirestore,
    ordenExiste: ordenExiste
}
