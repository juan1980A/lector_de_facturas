const inputArchivo = document.getElementById("archivo");
const botonArchivo = document.getElementById("botonArchivo");
const inputCamara = document.getElementById("camara");
const botonCamara = document.getElementById("botonCamara");
const botonAnalizar = document.getElementById("botonAnalizar");
const botonExcel = document.getElementById("botonExcel");
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
            <p><strong>Cliente:</strong> ${datos.cliente ?? "No encontrado"}</p>
            <p><strong>Documento:</strong> ${datos.documento ?? "No encontrado"}</p>
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

botonExcel.addEventListener("click", () => {
    window.location.href = "/facturas/exportar-excel";
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
            <p><strong>Cliente:</strong> ${factura.cliente ?? ""}</p>
            <p><strong>Documento:</strong> ${factura.documento ?? ""}</p>
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

            <br><br>
            <button type="button" onclick="eliminarFactura(${factura.id})">
                Eliminar factura
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

async function editarFactura(id) {

    resultado.textContent = "Cargando factura para editar...";

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
                    <td>
                        <input
                            type="text"
                            class="item-descripcion"
                            value="${item.descripcion ?? ""}"
                        >
                    </td>

                    <td>
                        <input
                            type="number"
                            step="any"
                            class="item-cantidad"
                            value="${item.cantidad ?? ""}"
                        >
                    </td>

                    <td>
                        <input
                            type="number"
                            step="any"
                            class="item-precio"
                            value="${item.precio_unitario ?? ""}"
                        >
                    </td>

                    <td>
                        <input
                            type="number"
                            step="any"
                            class="item-total"
                            value="${item.total ?? ""}"
                        >
                    </td>
                </tr>
            `;

        });





        resultado.innerHTML = `
            <h2>Editar factura</h2>

            <p>
                <strong>Proveedor:</strong><br>
                <input
                    type="text"
                    id="editarProveedor"
                    value="${factura.proveedor ?? ""}"
                >
            </p>

            <p>
                <strong>NIT:</strong><br>
                <input
                    type="text"
                    id="editarNit"
                    value="${factura.nit ?? ""}"
                >
            </p>

            <p>
                <strong>Cliente:</strong><br>
                <input
                    type="text"
                    id="editarCliente"
                    value="${factura.cliente ?? ""}"
                >
            </p>

            <p>
                <strong>Documento:</strong><br>
                <input
                    type="text"
                    id="editarDocumento"
                    value="${factura.documento ?? ""}"
                >
            </p>

            <p>
                <strong>Número de factura:</strong><br>
                <input
                    type="text"
                    id="editarNumeroFactura"
                    value="${factura.numero_factura ?? ""}"
                >
            </p>

            <p>
                <strong>Fecha:</strong><br>
                <input
                    type="text"
                    id="editarFecha"
                    value="${factura.fecha ?? ""}"
                >
            </p>

            <p>
                <strong>Subtotal:</strong><br>
                <input
                    type="number"
                    step="any"
                    id="editarSubtotal"
                    value="${factura.subtotal ?? ""}"
                >
            </p>

            <p>
                <strong>IVA:</strong><br>
                <input
                    type="number"
                    step="any"
                    id="editarIva"
                    value="${factura.iva ?? ""}"
                >
            </p>

            <p>
                <strong>Total:</strong><br>
                <input
                    type="number"
                    step="any"
                    id="editarTotal"
                    value="${factura.total ?? ""}"
                >
            </p>

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


            <button
                type="button"
                onclick="guardarFactura(${factura.id})"
            >
                Guardar cambios
            </button>

            <br><br>


            <button
                type="button"
                onclick="verFactura(${factura.id})"
            >
                Cancelar
            </button>
        `;

    } catch (error) {

        console.error(error);

        resultado.innerHTML = `
            <p><strong>Error:</strong> ${error.message}</p>
        `;

    }
}










async function guardarFactura(id) {

    const productos = [];

    const descripciones =
        document.querySelectorAll(".item-descripcion");

    const cantidades =
        document.querySelectorAll(".item-cantidad");

    const precios =
        document.querySelectorAll(".item-precio");

    const totales =
        document.querySelectorAll(".item-total");


    for (let i = 0; i < descripciones.length; i++) {

        productos.push({
            descripcion: descripciones[i].value,
            cantidad: cantidades[i].value
                ? Number(cantidades[i].value)
                : null,
            precio_unitario: precios[i].value
                ? Number(precios[i].value)
                : null,
            total: totales[i].value
                ? Number(totales[i].value)
                : null
        });

    }


    const datos = {

        proveedor:
            document.getElementById("editarProveedor").value,

        nit:
            document.getElementById("editarNit").value,

        cliente:
            document.getElementById("editarCliente").value,

        documento:
            document.getElementById("editarDocumento").value,

        numero_factura:
            document.getElementById("editarNumeroFactura").value,

        fecha:
            document.getElementById("editarFecha").value,

        subtotal:
            document.getElementById("editarSubtotal").value
                ? Number(document.getElementById("editarSubtotal").value)
                : null,

        iva:
            document.getElementById("editarIva").value
                ? Number(document.getElementById("editarIva").value)
                : null,

        total:
            document.getElementById("editarTotal").value
                ? Number(document.getElementById("editarTotal").value)
                : null,

        items: productos
    };


    resultado.textContent = "Guardando cambios...";


    try {

        const respuesta = await fetch(`/facturas/${id}`, {

            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(datos)

        });


        const respuestaDatos = await respuesta.json();


        if (!respuesta.ok) {

            throw new Error(
                respuestaDatos.detail ||
                "No se pudo actualizar la factura"
            );

        }


        alert("Factura actualizada correctamente");

        verFactura(id);


    } catch (error) {

        console.error(error);

        resultado.innerHTML = `
            <p>
                <strong>Error:</strong>
                ${error.message}
            </p>
        `;

    }

}



async function eliminarFactura(id) {

    const confirmar = confirm(
        "¿Seguro que deseas eliminar esta factura?"
    );

    if (!confirmar) {
        return;
    }

    try {

        const respuesta = await fetch(`/facturas/${id}`, {
            method: "DELETE"
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                datos.detail || "No se pudo eliminar la factura"
            );
        }

        alert("Factura eliminada correctamente");

        cargarHistorial();

    } catch (error) {

        console.error(error);

        resultado.innerHTML =
            `<p><strong>Error:</strong> ${error.message}</p>`;
    }
}