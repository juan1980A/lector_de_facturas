import os
import base64
import json
import models

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File,  HTTPException
from anthropic import Anthropic
from pydantic import BaseModel

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from sqlalchemy.orm import Session

from database import SessionLocal, engine, Base

from io import BytesIO

from fastapi.responses import StreamingResponse
from openpyxl import Workbook

Base.metadata.create_all(bind=engine)



load_dotenv()

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

api_key=os.getenv("ANTHROPIC_API_KEY")

client = Anthropic(api_key=api_key)

class ItemFactura(BaseModel):
    descripcion: str
    cantidad: float | None = None
    precio_unitario: float | None = None
    total: float | None = None


class Factura(BaseModel):
    proveedor: str | None = None
    nit: str | None = None
    cliente: str | None = None
    documento: str | None = None
    numero_factura: str | None = None
    fecha: str | None = None
    subtotal: float | None = None
    iva: float | None = None
    total: float | None = None
    items: list[ItemFactura] = []

class ItemFacturaEditar(BaseModel):
    descripcion: str
    cantidad: float | None = None
    precio_unitario: float | None = None
    total: float | None = None


class FacturaEditar(BaseModel):
    proveedor: str | None = None
    nit: str | None = None
    cliente: str | None = None
    documento: str | None = None
    numero_factura: str | None = None
    fecha: str | None = None
    subtotal: float | None = None
    iva: float | None = None
    total: float | None = None
    items: list[ItemFacturaEditar] = []


@app.get("/")
def inicio():
    return FileResponse("static/index.html")


@app.post("/facturas/analizar")
async def analizar_factura(archivo: UploadFile = File(...)):

    tipos_permitidos = [
    "image/jpeg",
    "image/png",
    "application/pdf"
    ]

    if archivo.content_type not in tipos_permitidos:
        raise HTTPException(
            status_code=400,
            detail="Solo se permiten archivos JPG, JPEG, PNG o PDF"
        )

    contenido = await archivo.read()

    archivo_base64 = base64.b64encode(contenido).decode("utf-8")

    if archivo.content_type == "application/pdf":
        documento = {
            "type": "document",
            "source": {
                "type": "base64",
                "media_type": "application/pdf",
                "data": archivo_base64
            }
        }
    else:
        documento = {
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": archivo.content_type,
                "data": archivo_base64
            }
        }

    respuesta = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        messages=[
            {
                "role": "user",
                "content": [
                        documento,
                    {
                        "type": "text",
                        "text": """
Analiza cuidadosamente esta factura.

Extrae la siguiente información:

- nombre del proveedor
- NIT del proveedor
- nombre del cliente
- documento del cliente (NIT, cédula u otro documento de identificación)
- número de factura
- fecha
- subtotal
- IVA
- total
- todos los productos o servicios de la factura

Para cada producto extrae:

- descripción
- cantidad
- precio unitario
- total del producto

Devuelve únicamente JSON válido.

No escribas explicaciones.
No escribas texto antes ni después del JSON.
No utilices bloques Markdown como ```json.

Utiliza exactamente esta estructura:

{
    "proveedor": "",
    "nit": "",
    "cliente": "",
    "documento": "",
    "numero_factura": "",
    "fecha": "",
    "subtotal": 0,
    "iva": 0,
    "total": 0,
    "items": [
        {
            "descripcion": "",
            "cantidad": 0,
            "precio_unitario": 0,
            "total": 0
        }
    ]
}

Si algún dato no puede determinarse con seguridad, utiliza null.
No inventes información que no sea visible en la factura.
"""
                    }
                ]
            }
        ]
    )

    texto = respuesta.content[0].text

    texto = texto.replace("```json", "").replace("```", "").strip()

    datos_factura = json.loads(texto)

    factura = Factura.model_validate(datos_factura)

    db = SessionLocal()
    

    try:
        factura_db = models.FacturaDB(
            proveedor=factura.proveedor,
            nit=factura.nit,
            cliente=factura.cliente,
            documento=factura.documento,
            numero_factura=factura.numero_factura,
            fecha=factura.fecha,
            subtotal=factura.subtotal,
            iva=factura.iva,
            total=factura.total
        )

        db.add(factura_db)
        db.flush()

        for item in factura.items:
            item_db = models.ItemFacturaDB(
                factura_id=factura_db.id,
                descripcion=item.descripcion,
                cantidad=item.cantidad,
                precio_unitario=item.precio_unitario,
                total=item.total
            )

            db.add(item_db)

        db.commit()

        return factura

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()

@app.get("/facturas")
def listar_facturas():
    db = SessionLocal()

    try:
        facturas = db.query(models.FacturaDB).order_by(
            models.FacturaDB.id.desc()
        ).all()

        return [
            {
                "id": factura.id,
                "proveedor": factura.proveedor,
                "nit": factura.nit,
                "cliente": factura.cliente,
                "documento": factura.documento,
                "numero_factura": factura.numero_factura,
                "fecha": factura.fecha,
                "subtotal": factura.subtotal,
                "iva": factura.iva,
                "total": factura.total
            }
            for factura in facturas
        ]

    finally:
        db.close()

@app.get("/facturas/exportar-excel")
def exportar_facturas_excel():

    db = SessionLocal()

    try:
        facturas = db.query(models.FacturaDB).order_by(
            models.FacturaDB.id.asc()
        ).all()

        # Crear archivo Excel
        wb = Workbook()

        # =========================
        # HOJA 1: FACTURAS
        # =========================

        ws_facturas = wb.active
        ws_facturas.title = "Facturas"

        ws_facturas.append([
            "ID",
            "Proveedor",
            "NIT",
            "Cliente",
            "Documento",
            "Número Factura",
            "Fecha",
            "Subtotal",
            "IVA",
            "Total"
        ])

        for factura in facturas:
            ws_facturas.append([
                factura.id,
                factura.proveedor,
                factura.nit,
                factura.cliente,
                factura.documento,
                factura.numero_factura,
                factura.fecha,
                factura.subtotal,
                factura.iva,
                factura.total
            ])

        # =========================
        # HOJA 2: PRODUCTOS
        # =========================

        ws_productos = wb.create_sheet("Productos")

        ws_productos.append([
            "Factura ID",
            "Número Factura",
            "Descripción",
            "Cantidad",
            "Precio Unitario",
            "Total"
        ])

        for factura in facturas:

            for item in factura.items:
                ws_productos.append([
                    factura.id,
                    factura.numero_factura,
                    item.descripcion,
                    item.cantidad,
                    item.precio_unitario,
                    item.total
                ])

        # Crear Excel en memoria
        archivo = BytesIO()

        wb.save(archivo)

        archivo.seek(0)

        return StreamingResponse(
            archivo,
            media_type=(
                "application/vnd.openxmlformats-officedocument."
                "spreadsheetml.sheet"
            ),
            headers={
                "Content-Disposition":
                    'attachment; filename="facturas.xlsx"'
            }
        )

    finally:
        db.close()  


@app.get("/facturas/{factura_id}")
def obtener_factura(factura_id: int):
    db = SessionLocal()

    try:
        factura = db.query(models.FacturaDB).filter(
            models.FacturaDB.id == factura_id
        ).first()

        if not factura:
            raise HTTPException(
                status_code=404,
                detail="Factura no encontrada"
            )

        return {
            "id": factura.id,
            "proveedor": factura.proveedor,
            "nit": factura.nit,
            "cliente": factura.cliente,
            "documento": factura.documento,
            "numero_factura": factura.numero_factura,
            "fecha": factura.fecha,
            "subtotal": factura.subtotal,
            "iva": factura.iva,
            "total": factura.total,
            "items": [
                {
                    "id": item.id,
                    "descripcion": item.descripcion,
                    "cantidad": item.cantidad,
                    "precio_unitario": item.precio_unitario,
                    "total": item.total
                }
                for item in factura.items
            ]
        }

    finally:
        db.close()


@app.put("/facturas/{factura_id}")
def editar_factura(factura_id: int, datos: FacturaEditar):

    db = SessionLocal()

    try:
        factura_db = db.query(models.FacturaDB).filter(
            models.FacturaDB.id == factura_id
        ).first()

        if not factura_db:
            raise HTTPException(
                status_code=404,
                detail="Factura no encontrada"
            )

        # Actualizar datos generales
        factura_db.proveedor = datos.proveedor
        factura_db.nit = datos.nit
        factura_db.cliente = datos.cliente
        factura_db.documento = datos.documento
        factura_db.numero_factura = datos.numero_factura
        factura_db.fecha = datos.fecha
        factura_db.subtotal = datos.subtotal
        factura_db.iva = datos.iva
        factura_db.total = datos.total

        # Eliminar los productos anteriores
        factura_db.items.clear()

        # Guardar los productos corregidos
        for item in datos.items:

            nuevo_item = models.ItemFacturaDB(
                descripcion=item.descripcion,
                cantidad=item.cantidad,
                precio_unitario=item.precio_unitario,
                total=item.total
            )

            factura_db.items.append(nuevo_item)

        db.commit()

        return {
            "mensaje": "Factura actualizada correctamente",
            "id": factura_db.id
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()

@app.delete("/facturas/{factura_id}")
def eliminar_factura(factura_id: int):

    db = SessionLocal()

    try:
        factura = db.query(models.FacturaDB).filter(
            models.FacturaDB.id == factura_id
        ).first()

        if not factura:
            raise HTTPException(
                status_code=404,
                detail="Factura no encontrada"
            )

        db.delete(factura)
        db.commit()

        return {
            "mensaje": "Factura eliminada correctamente"
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()