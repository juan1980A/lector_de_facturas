const inputArchivo = document.getElementById("archivo");
const botonArchivo = document.getElementById("botonArchivo");
const inputCamara = document.getElementById("camara");
const botonCamara = document.getElementById("botonCamara");
const botonAnalizar = document.getElementById("botonAnalizar");
const botonHistorial = document.getElementById("botonHistorial");
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
botonHistorial.addEventListener("click", async () => {

    resultado.textContent = "Cargando historial...";

    try {

        const respuesta = await fetch("/facturas");

        if (!respuesta.ok) {
            throw new Error("No se pudo cargar el historial");
        }

        const facturas = await respuesta.json();

        if (facturas.length === 0) {
            resultado.innerHTML = "<p>No hay facturas guardadas.</p>";
            return;
        }

        let filas = "";

        facturas.forEach(factura => {

            filas += `
                <tr>
                    <td>${factura.id}</td>
                    <td>${factura.proveedor ?? ""}</td>
                    <td>${factura.numero_factura ?? ""}</td>
                    <td>${factura.fecha ?? ""}</td>
                    <td>$${factura.total ?? 0}</td>
                    <td>
                        <button onclick="verFactura(${factura.id})">
                            Ver
                        </button>
                    </td>
                </tr>
            `;

        });

        resultado.innerHTML = `
            <h2>Historial de facturas</h2>

            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Proveedor</th>
                        <th>Factura</th>
                        <th>Fecha</th>
                        <th>Total</th>
                        <th>Acción</th>
                    </tr>
                </thead>

                <tbody>
                    ${filas}
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

async function verFactura(id) {

    resultado.textContent = "Cargando factura...";

    try {

        const respuesta = await fetch(`/facturas/${id}`);

        if (!respuesta.ok) {
            throw new Error("No se pudo cargar la factura");
        }

        const factura = await respuesta.json();

        let filasProductos = "";

        factura.items.forEach(item => {

            filasProductos += `
                <tr>
                    <td>${item.descripcion ?? ""}</td>
                    <td>${item.cantidad ?? ""}</td>
                    <td>$${item.precio_unitario ?? 0}</td>
                    <td>$${item.total ?? 0}</td>
                </tr>
            `;

        });

        resultado.innerHTML = `
            <h2>Detalle de factura</h2>

            <p><strong>Proveedor:</strong> ${factura.proveedor ?? ""}</p>
            <p><strong>NIT:</strong> ${factura.nit ?? ""}</p>
            <p><strong>Factura:</strong> ${factura.numero_factura ?? ""}</p>
            <p><strong>Fecha:</strong> ${factura.fecha ?? ""}</p>
            <p><strong>Subtotal:</strong> $${factura.subtotal ?? 0}</p>
            <p><strong>IVA:</strong> $${factura.iva ?? 0}</p>
            <p><strong>Total:</strong> $${factura.total ?? 0}</p>

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

            <br>

            <button type="button" onclick="editarFactura(${factura.id})">
                Editar factura
            </button>

            <button type="button" onclick="botonHistorial.click()">
                Volver al historial
            </button>
        `;

    } catch (error) {

        console.error(error);

        resultado.innerHTML = `
            <p><strong>Error:</strong> ${error.message}</p>
        `;

    }
}

