// --- Navegacion por scroll ---
// Las secciones estan apiladas verticalmente y el fondo 3D hace morphing
// siguiendo la posicion del scroll: script.js mide que trozo de la pagina
// se esta viendo y le pasa la mezcla (parA, parB, t) a three.js, que escribe
// las posiciones 3D interpoladas con su propio motor (window.establecerMezcla).
const ORDEN_SECCIONES = ["#inicio", "#panel-proyectos", "#panel-informacion", "#panel-contacto"];
const secciones = ORDEN_SECCIONES.map((sel) => document.querySelector(sel)).filter(Boolean);
const enlacesNav = [...document.querySelectorAll(".enlaceNav")];

const prefieraMovimientoReducido = window.matchMedia("(prefers-reduced-motion: reduce)");

let tops = [];
function medir() {
    tops = secciones.map((s) => s.offsetTop);
}
medir();
window.addEventListener("resize", medir);
window.addEventListener("load", () => {
    medir();
    actualizar();
});

// Clic en enlaces/anclas -> scroll suave a la seccion
document.querySelectorAll('a[href^="#"]').forEach((enlace) => {
    enlace.addEventListener("click", (evento) => {
        const destino = enlace.getAttribute("href");
        const objetivo = destino && destino !== "#" ? document.querySelector(destino) : null;
        if (!objetivo) return;

        evento.preventDefault();
        objetivo.scrollIntoView({ behavior: prefieraMovimientoReducido.matches ? "auto" : "smooth" });
        history.replaceState(null, "", destino);
    });
});

const UMBRAL_LOGO = 60;

// --- Instrumentos del marco: contador y leyenda de seccion ---
const ETIQUETAS_SECCION = ["PORTADA", "PROYECTOS", "INFORMACIÓN", "CONTACTO"];
const contadorActual = document.getElementById("contadorActual");
const leyendaSeccion = document.getElementById("leyendaSeccion");
let activoAnterior = -1;

function actualizarInstrumentos(activo) {
    const numero = String(activo + 1).padStart(2, "0");

    if (contadorActual) {
        contadorActual.textContent = numero;
        if (!prefieraMovimientoReducido.matches) {
            gsap.fromTo(contadorActual, { opacity: 0, y: 4 },
                { opacity: 1, y: 0, duration: 0.25, ease: "power1.out" });
        }
    }

    if (leyendaSeccion) {
        leyendaSeccion.textContent = "SEC." + numero + " — " + (ETIQUETAS_SECCION[activo] || "");
        if (!prefieraMovimientoReducido.matches) {
            gsap.fromTo(leyendaSeccion, { opacity: 0, x: 6 },
                { opacity: 1, x: 0, duration: 0.25, ease: "power1.out" });
        }
    }
}

function actualizar() {
    const y = window.scrollY;
    const n = secciones.length;
    if (n === 0) return;

    // Posicion global continua: 0.0 = portada, 1.0 = proyectos, etc.
    let gt = 0;
    if (y >= tops[n - 1]) {
        gt = n - 1;
    } else if (y > 0) {
        for (let k = 0; k < n - 1; k++) {
            const desde = Math.max(tops[k], 0);
            const hasta = tops[k + 1];
            if (y < hasta) {
                gt = k + (y - desde) / Math.max(1, hasta - desde);
                break;
            }
        }
    }

    // Seccion activa: la ultima cuyo top ya paso el 40% del viewport.
    // Responde cuando la seccion entra en pantalla, no a mitad del trayecto
    // entre secciones (que era la causa del desfase con el scroll).
    const vh = window.innerHeight || 1;
    let activo = 0;
    for (let i = 0; i < n; i++) {
        if (tops[i] - y <= vh * 0.4) activo = i;
    }
    secciones.forEach((s, i) => s.classList.toggle("active", i === activo));

    // Progreso continuo del recorrido (0 = portada, 1 = contacto): alimenta
    // la linea del marco y la fase lunar, que lo leen por CSS.
    document.documentElement.style.setProperty(
        "--progresoScroll",
        (n > 1 ? gt / (n - 1) : 0).toFixed(4)
    );

    if (activo !== activoAnterior) {
        activoAnterior = activo;
        actualizarInstrumentos(activo);
    }

    for (const enlace of enlacesNav) {
        enlace.classList.toggle("activo", secciones[activo]
            && enlace.getAttribute("href") === "#" + secciones[activo].id);
    }

    document.body.classList.toggle("enCima", y < UMBRAL_LOGO);

    // Motor 3D: mezcla directa entre el par de estados ponderado por gt
    if (typeof window.establecerMezcla === "function") {
        if (gt >= n - 1) {
            window.establecerMezcla(n - 1, n - 1, 0);
        } else {
            const iA = Math.floor(gt);
            window.establecerMezcla(iA, iA + 1, gt - iA);
        }
    }
}

let marcando = false;
window.addEventListener("scroll", () => {
    if (marcando) return;
    marcando = true;
    requestAnimationFrame(() => {
        marcando = false;
        actualizar();
    });
}, { passive: true });

actualizar();

// --- Panel de proyectos ---
const botonesProyecto = [...document.querySelectorAll(".botonProyectos")];

const detalleTitulo = document.getElementById("detalle-titulo");
const detalleFecha = document.getElementById("detalle-fecha");
const detalleDescripcion = document.getElementById("detalle-descripcion");
const detalleImagen = document.getElementById("detalle-imagen");
const detalleTags = document.getElementById("detalle-tags");
const detalleEnlace = document.getElementById("detalle-enlace");
const REPO_POR_DEFECTO = "https://github.com/HVT-IAN";

function mostrarProyecto(boton) {
    for (const b of botonesProyecto) b.classList.toggle("active", b === boton);

    const bloque = boton.closest(".itemBoton");
    const fecha = bloque && bloque.querySelector(".fechaBoton");
    const descripcion = bloque && bloque.querySelector(".descripcionBoton");
    const titulo = boton.textContent.trim();

    if (detalleTitulo) detalleTitulo.textContent = titulo;
    if (detalleFecha) detalleFecha.textContent = fecha ? fecha.textContent.trim() : "";
    if (detalleDescripcion) {
        detalleDescripcion.textContent = descripcion ? descripcion.textContent.trim() : "";
    }

    if (detalleTags && bloque) {
        detalleTags.textContent = "";
        const listaTags = bloque.querySelectorAll(".tagsProyecto li");
        for (const tag of listaTags) {
            const li = document.createElement("li");
            li.textContent = tag.textContent.trim();
            detalleTags.appendChild(li);
        }
    }

    if (detalleEnlace) {
        detalleEnlace.href = boton.dataset.repo || REPO_POR_DEFECTO;
    }

    if (!detalleImagen) return;

    const src = boton.dataset.imagen;
    if (src) {
        detalleImagen.src = src;
        detalleImagen.alt = "Imagen de " + titulo;
        detalleImagen.hidden = false;
    } else {
        detalleImagen.removeAttribute("src");
        detalleImagen.hidden = true;
    }
}

for (const boton of botonesProyecto) {
    boton.addEventListener("click", () => mostrarProyecto(boton));
}

const proyectoInicial = botonesProyecto.find((b) => b.classList.contains("active"))
    || botonesProyecto[0];
if (proyectoInicial) mostrarProyecto(proyectoInicial);

// --- Rejilla de puntos pulsantes del fondo ---
const contenedorOndas = document.querySelector(".gridOndas");

function pintarOndas() {
    if (!contenedorOndas) return;

    const columnas = getComputedStyle(contenedorOndas)
        .gridTemplateColumns
        .split(" ")
        .filter(Boolean)
        .length;

    const necesarias = columnas * 15;

    if (contenedorOndas.childElementCount === necesarias) return;

    contenedorOndas.textContent = "";
    const fragmento = document.createDocumentFragment();
    for (let i = 0; i < necesarias; i++) {
        fragmento.appendChild(document.createElement("span"));
    }
    contenedorOndas.appendChild(fragmento);
}

pintarOndas();
window.addEventListener("resize", pintarOndas);
