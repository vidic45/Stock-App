"""
factura_inventario.py
=====================
Generador de facturas PDF + control de inventario.
Uso: python factura_inventario.py

Dependencias: pip install reportlab
"""

import json
import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph,
    Spacer, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT

# ─── CONFIGURACIÓN DE EMPRESA ────────────────────────────────────────────────
EMPRESA = {
    "nombre": "Mi Negocio S.A.C.",
    "ruc": "20123456789",
    "direccion": "Jr. Los Pinos 123, Chiclayo",
    "telefono": "+51 074 123456",
    "email": "ventas@minegocio.pe",
}

# ─── INVENTARIO (simula una base de datos en JSON) ────────────────────────────
INVENTARIO_FILE = "inventario.json"

INVENTARIO_INICIAL = {
    "P001": {"nombre": "Laptop HP 15",         "precio": 2800.00, "stock": 12, "minimo": 5},
    "P002": {"nombre": "Mouse inalámbrico",     "precio":   45.00, "stock": 3,  "minimo": 10},
    "P003": {"nombre": "Teclado mecánico",      "precio":  189.00, "stock": 0,  "minimo": 5},
    "P004": {"nombre": "Monitor 24 pulgadas",   "precio":  650.00, "stock": 8,  "minimo": 3},
    "P005": {"nombre": "Auriculares USB",       "precio":   85.00, "stock": 20, "minimo": 5},
}


# ─── GESTIÓN DE INVENTARIO ────────────────────────────────────────────────────

def cargar_inventario():
    if os.path.exists(INVENTARIO_FILE):
        with open(INVENTARIO_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    guardar_inventario(INVENTARIO_INICIAL)
    return INVENTARIO_INICIAL.copy()


def guardar_inventario(inv):
    with open(INVENTARIO_FILE, "w", encoding="utf-8") as f:
        json.dump(inv, f, ensure_ascii=False, indent=2)


def mostrar_inventario(inv):
    print("\n" + "═" * 65)
    print(f"  {'CÓDIGO':<8} {'PRODUCTO':<30} {'PRECIO':>10} {'STOCK':>6} {'ESTADO'}")
    print("═" * 65)
    for codigo, prod in inv.items():
        if prod["stock"] == 0:
            estado = "❌ AGOTADO"
        elif prod["stock"] <= prod["minimo"]:
            estado = "⚠️  STOCK BAJO"
        else:
            estado = "✅ OK"
        print(f"  {codigo:<8} {prod['nombre']:<30} S/{prod['precio']:>9.2f} {prod['stock']:>6}  {estado}")
    print("═" * 65 + "\n")


def descontar_stock(inv, items_venta):
    """
    items_venta: lista de dicts con keys: codigo, cantidad
    Retorna True si todo OK, o lista de errores.
    """
    errores = []
    for item in items_venta:
        codigo = item["codigo"]
        cantidad = item["cantidad"]
        if codigo not in inv:
            errores.append(f"Código {codigo} no existe.")
        elif inv[codigo]["stock"] < cantidad:
            errores.append(
                f"Stock insuficiente para {inv[codigo]['nombre']} "
                f"(disponible: {inv[codigo]['stock']}, pedido: {cantidad})"
            )
    if errores:
        return errores
    for item in items_venta:
        inv[item["codigo"]]["stock"] -= item["cantidad"]
    return True


# ─── GENERADOR DE PDF ─────────────────────────────────────────────────────────

VERDE = colors.HexColor("#1a6b4a")
GRIS_CLARO = colors.HexColor("#f5f5f0")
GRIS_BORDE = colors.HexColor("#d0d0c8")
BLANCO = colors.white
NEGRO = colors.HexColor("#0f0f0f")


def generar_factura(numero, cliente, items_venta, inv):
    """
    numero      : str  — número de factura, ej. "F001-0042"
    cliente     : dict — nombre, ruc, direccion
    items_venta : lista de dicts — codigo, cantidad
    inv         : inventario actual
    """
    nombre_archivo = f"Factura_{numero.replace('-', '_')}.pdf"
    doc = SimpleDocTemplate(
        nombre_archivo,
        pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
    )

    styles = getSampleStyleSheet()
    s_titulo   = ParagraphStyle("titulo",   fontSize=22, textColor=VERDE,  fontName="Helvetica-Bold",  alignment=TA_LEFT)
    s_subtitulo= ParagraphStyle("sub",      fontSize=9,  textColor=colors.HexColor("#888"),fontName="Helvetica", alignment=TA_LEFT)
    s_header   = ParagraphStyle("header",   fontSize=10, textColor=NEGRO,  fontName="Helvetica-Bold",  alignment=TA_LEFT)
    s_normal   = ParagraphStyle("normal",   fontSize=9,  textColor=NEGRO,  fontName="Helvetica",       alignment=TA_LEFT)
    s_right    = ParagraphStyle("right",    fontSize=9,  textColor=NEGRO,  fontName="Helvetica",       alignment=TA_RIGHT)
    s_total    = ParagraphStyle("total",    fontSize=11, textColor=VERDE,  fontName="Helvetica-Bold",  alignment=TA_RIGHT)
    s_footer   = ParagraphStyle("footer",   fontSize=8,  textColor=colors.HexColor("#aaa"), fontName="Helvetica", alignment=TA_CENTER)

    story = []
    ancho_util = A4[0] - 4*cm  # 17 cm aprox

    # ── CABECERA ──
    header_data = [[
        Paragraph(f"<b>{EMPRESA['nombre']}</b>", s_titulo),
        Paragraph(f"<b>FACTURA ELECTRÓNICA</b>", ParagraphStyle("fn", fontSize=14, textColor=VERDE, fontName="Helvetica-Bold", alignment=TA_RIGHT)),
    ]]
    t_header = Table(header_data, colWidths=[ancho_util*0.6, ancho_util*0.4])
    t_header.setStyle(TableStyle([("VALIGN", (0,0), (-1,-1), "BOTTOM")]))
    story.append(t_header)
    story.append(Spacer(1, 0.2*cm))

    # Datos empresa + número factura
    datos_empresa = (
        f"{EMPRESA['ruc']} | {EMPRESA['direccion']}<br/>"
        f"{EMPRESA['telefono']} | {EMPRESA['email']}"
    )
    info_factura = (
        f"<b>N°:</b> {numero}<br/>"
        f"<b>Fecha:</b> {datetime.now().strftime('%d/%m/%Y')}<br/>"
        f"<b>Hora:</b> {datetime.now().strftime('%H:%M')}"
    )
    sub_data = [[
        Paragraph(datos_empresa, s_subtitulo),
        Paragraph(info_factura, ParagraphStyle("inf", fontSize=9, fontName="Helvetica", alignment=TA_RIGHT, textColor=NEGRO)),
    ]]
    t_sub = Table(sub_data, colWidths=[ancho_util*0.6, ancho_util*0.4])
    story.append(t_sub)
    story.append(HRFlowable(width="100%", thickness=1.5, color=VERDE, spaceAfter=0.4*cm, spaceBefore=0.3*cm))

    # ── DATOS DEL CLIENTE ──
    cliente_data = [
        [Paragraph("CLIENTE / RECEPTOR", ParagraphStyle("cl", fontSize=8, textColor=VERDE, fontName="Helvetica-Bold"))],
        [Paragraph(f"<b>{cliente['nombre']}</b>", s_header)],
        [Paragraph(f"RUC / DNI: {cliente.get('ruc','—')}  |  {cliente.get('direccion','—')}", s_normal)],
    ]
    t_cliente = Table(cliente_data, colWidths=[ancho_util])
    t_cliente.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), GRIS_CLARO),
        ("LEFTPADDING",  (0,0), (-1,-1), 8),
        ("RIGHTPADDING", (0,0), (-1,-1), 8),
        ("TOPPADDING",   (0,0), (-1,-1), 4),
        ("BOTTOMPADDING",(0,0), (-1,-1), 4),
        ("BOX", (0,0), (-1,-1), 0.5, GRIS_BORDE),
    ]))
    story.append(t_cliente)
    story.append(Spacer(1, 0.5*cm))

    # ── TABLA DE PRODUCTOS ──
    col_desc  = ancho_util * 0.40
    col_cant  = ancho_util * 0.10
    col_pu    = ancho_util * 0.18
    col_igv   = ancho_util * 0.15
    col_total = ancho_util * 0.17

    encabezado = [
        Paragraph("DESCRIPCIÓN",    ParagraphStyle("eh", fontSize=9, textColor=BLANCO, fontName="Helvetica-Bold")),
        Paragraph("CANT.",          ParagraphStyle("eh", fontSize=9, textColor=BLANCO, fontName="Helvetica-Bold", alignment=TA_CENTER)),
        Paragraph("P. UNIT. (S/)", ParagraphStyle("eh", fontSize=9, textColor=BLANCO, fontName="Helvetica-Bold", alignment=TA_RIGHT)),
        Paragraph("IGV (18%)",      ParagraphStyle("eh", fontSize=9, textColor=BLANCO, fontName="Helvetica-Bold", alignment=TA_RIGHT)),
        Paragraph("TOTAL (S/)",     ParagraphStyle("eh", fontSize=9, textColor=BLANCO, fontName="Helvetica-Bold", alignment=TA_RIGHT)),
    ]
    tabla_items = [encabezado]

    subtotal = 0.0
    for item in items_venta:
        prod     = inv[item["codigo"]]
        p_unit   = prod["precio"]
        cantidad = item["cantidad"]
        base     = p_unit / 1.18          # precio sin IGV
        igv_item = p_unit * 0.18 / 1.18  # IGV del ítem
        total    = p_unit * cantidad

        subtotal += total
        tabla_items.append([
            Paragraph(f"<b>{prod['nombre']}</b><br/><font size=8 color='#888'>Cód: {item['codigo']}</font>", s_normal),
            Paragraph(str(cantidad), ParagraphStyle("c", fontSize=9, fontName="Helvetica", alignment=TA_CENTER)),
            Paragraph(f"{base:.2f}", s_right),
            Paragraph(f"{igv_item:.2f}", s_right),
            Paragraph(f"{total:.2f}", s_right),
        ])

    igv_total  = subtotal * 0.18 / 1.18
    base_total = subtotal - igv_total

    t_items = Table(
        tabla_items,
        colWidths=[col_desc, col_cant, col_pu, col_igv, col_total],
        repeatRows=1,
    )
    t_items.setStyle(TableStyle([
        ("BACKGROUND",   (0,0), (-1,0), VERDE),
        ("TEXTCOLOR",    (0,0), (-1,0), BLANCO),
        ("FONTNAME",     (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",     (0,0), (-1,-1), 9),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[BLANCO, GRIS_CLARO]),
        ("GRID",         (0,0), (-1,-1), 0.4, GRIS_BORDE),
        ("LEFTPADDING",  (0,0), (-1,-1), 6),
        ("RIGHTPADDING", (0,0), (-1,-1), 6),
        ("TOPPADDING",   (0,0), (-1,-1), 5),
        ("BOTTOMPADDING",(0,0), (-1,-1), 5),
        ("VALIGN",       (0,0), (-1,-1), "MIDDLE"),
    ]))
    story.append(t_items)
    story.append(Spacer(1, 0.4*cm))

    # ── TOTALES ──
    totales_data = [
        ["", Paragraph("Valor venta (sin IGV):", s_right), Paragraph(f"S/ {base_total:.2f}", s_right)],
        ["", Paragraph("IGV (18%):",             s_right), Paragraph(f"S/ {igv_total:.2f}",  s_right)],
        ["", Paragraph("<b>TOTAL A PAGAR:</b>",  s_total), Paragraph(f"<b>S/ {subtotal:.2f}</b>", s_total)],
    ]
    t_totales = Table(totales_data, colWidths=[ancho_util*0.55, ancho_util*0.28, ancho_util*0.17])
    t_totales.setStyle(TableStyle([
        ("LINEABOVE",   (1,2), (-1,2), 1.2, VERDE),
        ("TOPPADDING",  (0,0), (-1,-1), 4),
        ("BOTTOMPADDING",(0,0),(-1,-1), 4),
        ("RIGHTPADDING",(0,0),(-1,-1), 6),
    ]))
    story.append(t_totales)
    story.append(Spacer(1, 0.8*cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=GRIS_BORDE, spaceAfter=0.3*cm))

    # ── PIE DE PÁGINA ──
    story.append(Paragraph(
        f"{EMPRESA['nombre']} — {EMPRESA['ruc']} | {EMPRESA['email']} | {EMPRESA['telefono']}<br/>"
        "Documento generado electrónicamente. Válido como comprobante de pago.",
        s_footer
    ))

    doc.build(story)
    return nombre_archivo


# ─── MENÚ INTERACTIVO ─────────────────────────────────────────────────────────

def menu():
    inv = cargar_inventario()
    contador_factura = 1

    while True:
        print("\n╔════════════════════════════════╗")
        print("║   SISTEMA DE INVENTARIO + PDF  ║")
        print("╠════════════════════════════════╣")
        print("║  1. Ver inventario             ║")
        print("║  2. Generar factura PDF        ║")
        print("║  3. Actualizar stock           ║")
        print("║  4. Salir                      ║")
        print("╚════════════════════════════════╝")
        opcion = input("Opción: ").strip()

        if opcion == "1":
            mostrar_inventario(inv)

        elif opcion == "2":
            mostrar_inventario(inv)
            print("Ingresa los productos para la factura (escribe 'listo' para terminar):")
            items_venta = []
            while True:
                codigo = input("  Código de producto: ").strip().upper()
                if codigo == "LISTO":
                    break
                if codigo not in inv:
                    print("  ⚠ Código no encontrado.")
                    continue
                try:
                    cantidad = int(input(f"  Cantidad de '{inv[codigo]['nombre']}': "))
                except ValueError:
                    print("  ⚠ Cantidad inválida.")
                    continue
                items_venta.append({"codigo": codigo, "cantidad": cantidad})

            if not items_venta:
                print("No ingresaste productos.")
                continue

            resultado = descontar_stock(inv, items_venta)
            if resultado is not True:
                print("\n❌ Errores en el pedido:")
                for e in resultado:
                    print(f"   - {e}")
                continue

            print("\n─ Datos del cliente ─")
            cliente = {
                "nombre":    input("  Nombre / Razón Social: ").strip() or "Cliente General",
                "ruc":       input("  RUC / DNI: ").strip() or "00000000",
                "direccion": input("  Dirección: ").strip() or "—",
            }

            numero = f"F001-{contador_factura:04d}"
            archivo = generar_factura(numero, cliente, items_venta, inv)
            guardar_inventario(inv)
            contador_factura += 1
            print(f"\n✅ Factura generada: {archivo}")
            print(f"   Stock actualizado en {INVENTARIO_FILE}")

        elif opcion == "3":
            mostrar_inventario(inv)
            codigo = input("Código de producto a actualizar: ").strip().upper()
            if codigo not in inv:
                print("⚠ Código no encontrado.")
                continue
            try:
                nuevo_stock = int(input(f"Nuevo stock para '{inv[codigo]['nombre']}': "))
                inv[codigo]["stock"] = nuevo_stock
                guardar_inventario(inv)
                print("✅ Stock actualizado.")
            except ValueError:
                print("⚠ Valor inválido.")

        elif opcion == "4":
            print("Hasta luego 👋")
            break
        else:
            print("⚠ Opción no válida.")


if __name__ == "__main__":
    menu()
