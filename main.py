import os
import base64
import json

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File,  HTTPException
from anthropic import Anthropic
from pydantic import BaseModel

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse


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
    numero_factura: str | None = None
    fecha: str | None = None
    subtotal: float | None = None
    iva: float | None = None
    total: float | None = None
    items: list[ItemFactura] = []


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
- NIT
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

    return factura