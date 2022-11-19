const constants = require("../common/constants");
const {getCurrentTime} = require("../common/utils");

function transformarPagoAFirebasePago(pago) {
    return {
        "ordenID": pago.ordenID,
        "pagoId": pago.pago,
        "estadoTransaccion": pago.estadoTransaccion ? pago.estadoTransaccion : constants.PAGO_EXITOSO,
        "fechaTransaccion": pago.fechaTransaccion ? pago.fechaTransaccion : getCurrentTime()
    }
}

module.exports = {
    transformarPagoAFirebasePago: transformarPagoAFirebasePago
}