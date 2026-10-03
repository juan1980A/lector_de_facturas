from sqlalchemy import Column, Integer, String, Float, ForeignKey, ForeignKey
from sqlalchemy.orm import relationship

from database import Base



class UsuarioDB(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)

    nombre = Column(String, nullable=False)

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    password_hash = Column(
        String,
        nullable=False
    )

class FacturaDB(Base):
    __tablename__ = "facturas"

    id = Column(Integer, primary_key=True, index=True)

    usuario_id = Column(
        Integer,
        ForeignKey("usuarios.id"),
        nullable=True
    )

    proveedor = Column(String, nullable=True)
    nit = Column(String, nullable=True)

    cliente = Column(String, nullable=True)
    documento = Column(String, nullable=True)

    numero_factura = Column(String, nullable=True)
    fecha = Column(String, nullable=True)
    subtotal = Column(Float, nullable=True)
    iva = Column(Float, nullable=True)
    total = Column(Float, nullable=True)

    items = relationship(
        "ItemFacturaDB",
        back_populates="factura",
        cascade="all, delete-orphan"
    )


class ItemFacturaDB(Base):
    __tablename__ = "items_factura"

    id = Column(Integer, primary_key=True, index=True)
    factura_id = Column(
        Integer,
        ForeignKey("facturas.id"),
        nullable=False
    )

    descripcion = Column(String, nullable=False)
    cantidad = Column(Float, nullable=True)
    precio_unitario = Column(Float, nullable=True)
    total = Column(Float, nullable=True)

    factura = relationship(
        "FacturaDB",
        back_populates="items"
    )