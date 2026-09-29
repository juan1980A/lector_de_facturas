const inputArchivo = document.getElementById("archivo");
const botonArchivo = document.getElementById("botonArchivo");
const inputCamara = document.getElementById("camara");
const botonCamara = document.getElementById("botonCamara");
const botonAnalizar = document.getElementById("botonAnalizar");
const resultado = document.getElementById("resultado");
const nombreArchivo = document.getElementById("nombreArchivo");

let archivoSeleccionado = null;


botonCamara.addEventListener("click", () => {

    inputCamara.click();
});

inputCamara.addEventListener("change", () => {

    archivoSeleccionado = inputCamara.files[0];

    if (archivoSeleccionado) {
        nombreArchivo.textContent = archivoSeleccionado.name;
    }

});

botonArchivo.addEventListener("click", () => {
    inputArchivo.click();
});

inputArchivo.addEventListener("change", () => {

    archivoSeleccionado = inputArchivo.files[0];

    if (archivoSeleccionado) {
        nombreArchivo.textContent = archivoSeleccionado.name;
    }

});

archivoSeleccionado = inputArchivo.files[0];

botonAnalizar.addEventListener("click", async () => {

    const archivo = archivoSeleccionado;

    if (!archivo) {
        resultado.textContent = "Selecciona una factura primero.";
        return;
    }

    const formData = new FormData();

    formData.append("archivo", archivo);

    resultado.textContent = "Analizando factura...";

    try {

        const respuesta = await fetch("/facturas/analizar", {
            method: "POST",
            body: formData
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.detail || "Error al analizar la factura");
        }

        console.log(datos);

        let filasProductos = "";

        datos.items.forEach(item => {

            filasProductos += `
                <tr>
                    <td>${item.descripcion}</td>
                    <td>${item.cantidad}</td>
                    <td>$${item.precio_unitario}</td>
                    <td>$${item.total}</td>
                </tr>
            `;

        });

        resultado.innerHTML = `
            <p><strong>Proveedor:</strong> ${datos.proveedor}</p>
            <p><strong>NIT:</strong> ${datos.nit ?? "No encontrado"}</p>
            <p><strong>Factura:</strong> ${datos.numero_factura}</p>
            <p><strong>Fecha:</strong> ${datos.fecha}</p>
            <p><strong>Subtotal:</strong> $${datos.subtotal}</p>
            <p><strong>IVA:</strong> $${datos.iva}</p>
            <p><strong>Total:</strong> $${datos.total}</p>

            <h2>Productos</h2>

            <table>
                <thead>
                    <tr>
                        <th>Descripción</th>
                        <th>Cantidad</th>
                        <th>Precio unitario</th>
                        <th>Total</th>
                    </tr>
                </thead>

                <tbody>
                    ${filasProductos}
                </tbody>
            </table>
        `;

    } catch (error) {

        console.error(error);

        resultado.innerHTML = `
            <p><strong>Error:</strong> ${error.message}</p>
        `;

    }

});