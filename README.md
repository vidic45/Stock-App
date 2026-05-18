# Stock. — Inventario y Facturas PDF 📦

Sistema liviano para gestionar inventario y generar facturas PDF profesionales con IGV 18%.  
Un script Python + una landing React. Sin bases de datos, sin servidores.

---

![DEMO](/screenshots/home.png)
![DEMO](/screenshots/example.png)

## Estructura del repo

```
stock-app/
├── README.md
├── script/
│   └── factura_inventario.py   ← el script principal
└── landing/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── index.css
        └── App.jsx
```

---

## Script Python — `factura_inventario.py`

### Requisitos
- Python 3.8+
- `reportlab`

### Instalación y uso

```bash
cd script
pip install reportlab
python factura_inventario.py
```

### Funciones del menú

| Opción | Descripción |
|--------|-------------|
| 1 | Ver inventario con estados (OK / Stock bajo / Agotado) |
| 2 | Generar factura PDF (descuenta stock automáticamente) |
| 3 | Actualizar stock manualmente |
| 4 | Salir |

### Archivos generados

- `inventario.json` — base de datos del stock (auto-generado en primera ejecución)
- `Factura_F001_XXXX.pdf` — factura en formato A4 con RUC, IGV 18% y tabla de productos

---

## Landing React — `landing/`

### Requisitos
- Node.js 18+
- npm

### Instalación y uso

```bash
cd landing
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en el navegador.

### Build para producción

```bash
npm run build
npm run preview
```

---

## Tecnologías

| Capa | Tecnología |
|------|------------|
| Script | Python 3 + ReportLab |
| Landing | React 18 + Vite |
| Estilos | CSS-in-JS (inline styles) |

---

## Hecho con ♥ en Chiclayo, Perú 🇵🇪
