const {conn} = require('./conexion');
const {getDistance} = require('geolib');
const constants = require('./../common/constants');
const {getRandomInRange} = require('./../common/utils');
const {dbfirestore} = require('./firebase')

const distance = getDistance(
    {latitude: 51.5103, longitude: 7.49347},
    {latitude: 51.5200, longitude: 7.49347}
)
console.log(distance / 1000) //value in km

function agregarCotizacion(cotizacion, callback) {

    let recogidaLatitud = cotizacion.recogidaLatitud;
    let recogidaLongitud = cotizacion.recogidaLongitud;
    let destinoLatitud = cotizacion.destinoLatitud;
    let destinoLongitud = cotizacion.destinoLongitud;

    if (!recogidaLatitud || !recogidaLongitud || !destinoLatitud || !destinoLongitud) {
        recogidaLatitud = getRandomInRange(14.637630969183862, 14.689845642843764, 15); // numeros desde zona 1 GT hasta zona 25 de la ciudad
        recogidaLongitud = getRandomInRange(-90.51017358559169, -90.39830086796768, 15);
        destinoLatitud = getRandomInRange(14.637630969183862, 14.689845642843764, 15);
        destinoLongitud = getRandomInRange(-90.51017358559169, -90.39830086796768, 15);
    }

    const distanciaKm = getDistance(
        {latitude: recogidaLatitud, longitude: recogidaLatitud},
        {latitude: destinoLatitud, longitude: destinoLongitud}
    ) / 1000000;

    console.log("Distancia entre puntos ", distanciaKm);

    let costo = (constants.PRECIO_KM * distanciaKm) + (constants.PRECIO_X_LIBRA * cotizacion.pesoTotal);
    let tiempoEstimadoLlegada = distanciaKm / constants.VELOCIDAD_PROMEDIO;
    let sql = 'insert into cotizacion_msj (cotizacion_msj, recogida, destino, fecha_servicio, precio_envio, tiempo_estimado_llegada, ' +
        ' bus_mensajeria, nombre_recibe, estado, cantidad_articulos, precio_articulos, precio_total, peso_total) ' +
        ' values (?, point(?, ?), point(?, ?), now(), ?, ?, ?, ?, ?, ?, ?, ?, ?);';
    return conn.query(sql, [cotizacion.orderID, recogidaLongitud, recogidaLatitud, destinoLongitud,
        destinoLatitud, costo, tiempoEstimadoLlegada, 1, cotizacion.nombreRecibe, "Nuevo", cotizacion.cantidadArticulos,
        cotizacion.precioTotal, (cotizacion.precioTotal + (cotizacion.precioTotal * constants.PERCENT_TAX)), cotizacion.pesoTotal], function (err, results, fields) {
        if (err) {
            console.log(err)
            callback(err);
        }

        let coti = {
            "ordenID": cotizacion.orderID,
            "estado": "Nuevo",
            "cantidadArticulos": cotizacion.cantidadArticulos,
            "fechaEntrega": null,
            "ETA": tiempoEstimadoLlegada,
            "costoEnvio": cotizacion.precioTotal * constants.PERCENT_TAX,
            "costoPiezas": cotizacion.precioTotal,
            "costoTotal": (cotizacion.precioTotal + (cotizacion.precioTotal * constants.PERCENT_TAX))
        }
        callback(null, coti);
    });
}

function mandarCotizacionAFirebase(cotizacion) {
    cotizacion.servidor = constants.SERVIDOR_ACTUAL;
    dbfirestore.collection("orders").add(cotizacion).then(docRef => {
        console.log("documento escrito, ID: ", docRef.id);
    }).catch(err => {
        console.log("ocurrio un error al tratar de escribir el documento ", err);
    });
}

function transicionarCotiAPagado(pago, callback) {
    let sql = "update cotizacion_msj set estado = ? where cotizacion_msj = ? "
    conn.query(sql, [constants.PAGADO, pago.ordenID], function (err, results, fields) {
        if (!err) {
            callback(null, true);
        } else {
            callback(err);
        }
    });
}

function obtenerCotizacionPorOdenID(ordenID, callback) {
    let sql = "select cotizacion_msj ordenID, estado, cantidad_articulos cantidadArticulos, fecha_llegada fechaEntrega, " +
        "tiempo_estimado_llegada ETA, precio_envio costoEnvio, precio_articulos costoPiezas, precio_total costoTotal from cotizacion_msj " +
        "where cotizacion_msj = ?";
    conn.query(sql, ordenID, function (err, rows, fields) {
        if (err) {
            callback(err)
        } else {
            console.log('the rows', rows)
            let coti = JSON.parse(JSON.stringify(rows));
            callback(null, coti[0])
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
        coti.firestoreId = doc.id;
    });
    return coti;
}

async function actualizarEstadoOrdenFirestore(docId) {
    const ordersRef = await dbfirestore.collection('orders').doc(docId);
    ordersRef.update({
        estado: constants.PAGADO
    })
}

module.exports = {
    agregarCotizacion: agregarCotizacion,
    transicionarCotiAPagado: transicionarCotiAPagado,
    obtenerCotizacionPorOdenID: obtenerCotizacionPorOdenID,
    mandarCotizacionAFirebase: mandarCotizacionAFirebase,
    actualizarEstadoOrdenFirestore: actualizarEstadoOrdenFirestore,
    obtenerCotizacionPorOdenEnFirestore: obtenerCotizacionPorOdenEnFirestore
}
