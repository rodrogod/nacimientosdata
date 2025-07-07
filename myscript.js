// Espera a que todo el contenido del DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    
    // --- Selección de Elementos del DOM ---
    const map = document.querySelector('svg');
    const edos = document.querySelectorAll('path'); // Corregido: Selecciona TODOS los 'path'
    const sidepanel = document.querySelector('.side-panel');
    const container = document.querySelector('.side-panel .container');
    const closeBtn = document.querySelector('.close-btn');
    const loading = document.querySelector('.loading');
    
    // Crear overlay para el panel
    const overlay = document.createElement('div');
    overlay.className = 'side-panel-overlay';
    document.body.appendChild(overlay);

    // --- Elementos para mostrar los datos ---
    const entidadFederativaTitulo = document.querySelector('.nombre-estado'); // Asumo que tienes un título para el estado
    const diferenciaEdadPromedio = document.querySelector('.promedio-valor');
    const padreProm = document.querySelector('.PadreProm');
    const padreMin = document.querySelector('.PadreMin');
    const padreMax = document.querySelector('.PadreMax');
    const padreValid = document.querySelector('.PadreValid');
    const madreProm = document.querySelector('.MadreProm');
    const madreMin = document.querySelector('.MadreMin');
    const madreMax = document.querySelector('.MadreMax');
    const madreValid = document.querySelector('.MadreValid');
    const imagenDist = document.querySelector('.img-dist');

    // --- Elementos de control de zoom ---
    const zoomInBtn = document.querySelector('.zoom-in');
    const zoomOutBtn = document.querySelector('.zoom-out');
    const zoomResetBtn = document.querySelector('.zoom-reset');
    const zoomValue = document.querySelector('.zoom-value'); // Nuevo: elemento para mostrar el valor de zoom

    let datosEstadisticos = {}; // Variable para guardar los datos del JSON (ahora es un objeto)

    // --- Variables para el control de zoom ---
    let currentZoom = 1;
    let currentX = 0;
    let currentY = 0;
    const zoomStep = 0.2;
    const minZoom = 0.5;
    const maxZoom = 3;

    // --- Función para actualizar el valor de zoom en la interfaz ---
    function actualizarZoomValue() {
        if (zoomValue) {
            zoomValue.textContent = Math.round(currentZoom * 100) + '%';
        }
    }

    // --- Función para aplicar transformación al mapa ---
    function aplicarTransformacion() {
        if (map) {
            // Aplicar límites de movimiento para evitar que el mapa se salga demasiado
            const maxOffset = 300; // Límite máximo de desplazamiento
            currentX = Math.max(-maxOffset, Math.min(maxOffset, currentX));
            currentY = Math.max(-maxOffset, Math.min(maxOffset, currentY));
            
            const transform = `translate(${currentX}px, ${currentY}px) scale(${currentZoom})`;
            map.style.transform = transform;
            map.style.transformOrigin = 'center center';
            actualizarZoomValue(); // Actualizar el valor de zoom en la interfaz
        }
    }

    // --- Función para hacer zoom in ---
    function zoomIn() {
        if (currentZoom < maxZoom) {
            currentZoom += zoomStep;
            aplicarTransformacion();
        }
    }

    // --- Función para hacer zoom out ---
    function zoomOut() {
        if (currentZoom > minZoom) {
            currentZoom -= zoomStep;
            aplicarTransformacion();
        }
    }

    // --- Función para restablecer zoom ---
    function zoomReset() {
        currentZoom = 1;
        currentX = 0;
        currentY = 0;
        aplicarTransformacion();
    }

    // --- Funcionalidad de arrastre del mapa ---
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartMapX = 0;
    let dragStartMapY = 0;
    let lastDragTime = 0;
    const dragThrottle = 16; // ~60fps

    // Función para iniciar arrastre
    function startDrag(e) {
        // Prevenir el arrastre si se hace clic en un estado (para evitar conflictos)
        if (e.target.tagName === 'path' && e.target.getAttribute('name')) {
            return;
        }
        
        isDragging = true;
        map.style.cursor = 'grabbing';
        map.style.userSelect = 'none';
        
        // Obtener coordenadas del mouse/touch
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        dragStartX = clientX;
        dragStartY = clientY;
        dragStartMapX = currentX;
        dragStartMapY = currentY;
        lastDragTime = Date.now();
    }

    // Función para arrastrar
    function drag(e) {
        if (!isDragging) return;
        
        e.preventDefault();
        
        // Throttle para mejorar rendimiento
        const now = Date.now();
        if (now - lastDragTime < dragThrottle) return;
        lastDragTime = now;
        
        // Obtener coordenadas del mouse/touch
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        const deltaX = clientX - dragStartX;
        const deltaY = clientY - dragStartY;
        
        currentX = dragStartMapX + deltaX;
        currentY = dragStartMapY + deltaY;
        
        aplicarTransformacion();
    }

    // Función para terminar arrastre
    function endDrag() {
        if (!isDragging) return;
        
        isDragging = false;
        map.style.cursor = 'grab';
        map.style.userSelect = 'auto';
    }

    // --- Event listeners para zoom con botones ---
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', zoomIn);
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', zoomOut);
    }

    if (zoomResetBtn) {
        zoomResetBtn.addEventListener('click', zoomReset);
    }

    // --- Event listeners para zoom con rueda del mouse ---
    if (map) {
        map.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            if (e.deltaY < 0) {
                zoomIn();
            } else {
                zoomOut();
            }
        });

        // --- Event listeners para arrastre con mouse ---
        map.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('mouseleave', endDrag); // Prevenir arrastre fuera de la ventana

        // --- Event listeners para arrastre con touch (dispositivos móviles) ---
        map.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                e.preventDefault(); // Prevenir zoom del navegador
                startDrag(e);
            }
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && isDragging) {
                e.preventDefault(); // Prevenir scroll
                drag(e);
            }
        }, { passive: false });

        document.addEventListener('touchend', endDrag);
        document.addEventListener('touchcancel', endDrag); // Manejar cancelación de touch

        // Establecer cursor inicial
        map.style.cursor = 'grab';
    }

    // --- Función para normalizar nombres de estados ---
    function normalizarNombreEstado(nombre) {
        if (!nombre) return '';
        
        // Convertir a string y limpiar espacios
        let normalizado = nombre.toString().trim();
        
        // Mapeo de caracteres con problemas de codificación
        const mapaCaracteres = {
            'Ã¡': 'á',
            'Ã©': 'é',
            'Ã­': 'í',
            'Ã³': 'ó',
            'Ãº': 'ú',
            'Ã¼': 'ü',
            'Ã±': 'ñ',
            'Ã': 'Á',
            'Ã‰': 'É',
            'Ã': 'Í',
            'Ã"': 'Ó',
            'Ãš': 'Ú',
            'Ã': 'Ñ'
        };
        
        // Reemplazar caracteres mal codificados
        Object.keys(mapaCaracteres).forEach(caracter => {
            normalizado = normalizado.replace(new RegExp(caracter, 'g'), mapaCaracteres[caracter]);
        });
        
        // Normalizar usando Unicode (NFD y NFC)
        try {
            normalizado = normalizado.normalize('NFD').normalize('NFC');
        } catch (e) {
            console.warn('Error al normalizar:', e);
        }
        
        return normalizado;
    }

    // --- Función para buscar estado por nombre (con búsqueda flexible) ---
    function buscarEstadoEnDatos(nombreBuscado) {
        const nombreNormalizado = normalizarNombreEstado(nombreBuscado);
        
        // Buscar coincidencia exacta primero
        if (datosEstadisticos[nombreNormalizado]) {
            return datosEstadisticos[nombreNormalizado];
        }
        
        // Buscar sin acentos
        const sinAcentos = nombreNormalizado
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
        
        // Buscar en todas las claves del JSON
        for (const [clave, valor] of Object.entries(datosEstadisticos)) {
            const claveNormalizada = normalizarNombreEstado(clave);
            const claveSinAcentos = claveNormalizada
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase();
            
            // Comparar sin acentos
            if (claveSinAcentos === sinAcentos) {
                return valor;
            }
            
            // Comparar si contiene el nombre
            if (claveSinAcentos.includes(sinAcentos) || sinAcentos.includes(claveSinAcentos)) {
                return valor;
            }
        }
        
        return null;
    }

    // --- 1. Cargar los Datos del JSON ---
    // Cambia 'datos.json' por el nombre real de tu archivo JSON
    fetch('resultados_estadisticas_nacimientos.json') // o 'datos.json' según el nombre de tu archivo
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar el archivo JSON: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            // Accedemos a la propiedad 'entidades_federativas' de tu JSON
            datosEstadisticos = data.entidades_federativas;
            
            // Normalizar las claves del objeto de datos
            const datosNormalizados = {};
            Object.keys(datosEstadisticos).forEach(clave => {
                const claveNormalizada = normalizarNombreEstado(clave);
                datosNormalizados[claveNormalizada] = datosEstadisticos[clave];
            });
            datosEstadisticos = datosNormalizados;
            
            // Ocultar el 'loading' inicial una vez que los datos están listos
            loading.classList.add('hide'); 
            console.log('Datos cargados exitosamente:', Object.keys(datosEstadisticos));
        })
        .catch(error => {
            console.error('Hubo un problema con la operación fetch:', error);
            loading.innerText = "Error al cargar los datos.";
        });

    // --- 2. Función para Actualizar el Panel Lateral ---
    function actualizarPanel(nombreEstado) {
        // Normalizar el nombre del estado
        const nombreNormalizado = normalizarNombreEstado(nombreEstado);
        
        // Buscar el estado en nuestros datos cargados usando la función flexible
        const estadoData = buscarEstadoEnDatos(nombreNormalizado);

        // Si no encontramos el estado, mostrar un error y salir
        if (!estadoData) {
            console.error(`No se encontraron datos para el estado: ${nombreEstado}`);
            console.log('Nombre normalizado:', nombreNormalizado);
            console.log('Estados disponibles:', Object.keys(datosEstadisticos));
            loading.innerText = "Datos no disponibles para este estado.";
            container.classList.add('hide');
            loading.classList.remove('hide');
            return;
        }

        // --- 3. Conectar las variables con los datos del JSON ---
        if (entidadFederativaTitulo) {
            entidadFederativaTitulo.textContent = nombreNormalizado;
        }
        
        // Diferencia de edad promedio
        if (diferenciaEdadPromedio) {
            diferenciaEdadPromedio.textContent = estadoData.diferencia_edad.promedio_padre_minus_madre.toFixed(2) + ' años';
        }
        
        // Estadísticas del padre
        if (padreProm) {
            padreProm.textContent = estadoData.estadisticas_padre.promedio_edad.toFixed(2);
        }
        if (padreMin) {
            padreMin.textContent = estadoData.estadisticas_padre.edad_minima;
        }
        if (padreMax) {
            padreMax.textContent = estadoData.estadisticas_padre.edad_maxima;
        }
        if (padreValid) {
            padreValid.textContent = estadoData.estadisticas_padre.total_registros_validos.toLocaleString('es-MX');
        }

        // Estadísticas de la madre
        if (madreProm) {
            madreProm.textContent = estadoData.estadisticas_madre.promedio_edad.toFixed(2);
        }
        if (madreMin) {
            madreMin.textContent = estadoData.estadisticas_madre.edad_minima;
        }
        if (madreMax) {
            madreMax.textContent = estadoData.estadisticas_madre.edad_maxima;
        }
        if (madreValid) {
            madreValid.textContent = estadoData.estadisticas_madre.total_registros_validos.toLocaleString('es-MX');
        }

        // Imagen
        if (imagenDist && estadoData.archivo_grafico) {
            imagenDist.src = estadoData.archivo_grafico;
            imagenDist.alt = `Gráfica de ${nombreNormalizado}`;
        }

        // Mostrar el contenido y ocultar el 'loading'
        container.classList.remove('hide');
        loading.classList.add('hide');
    }

    // --- 4. Añadir Eventos a cada Estado del Mapa ---
    edos.forEach(edo => {
        // Evento para el hover (efecto visual)
        edo.addEventListener("mouseenter", function() {
            this.style.fill = "#443d4b"; // Cambia el color al pasar el mouse
        });
        edo.addEventListener("mouseleave", function() {
            this.style.fill = ""; // Restaura el color original al quitar el mouse
        });

        // Evento principal al hacer clic
        edo.addEventListener("click", function(e) {
            // Prevenir el arrastre cuando se hace clic en un estado
            e.stopPropagation();
            
            // Mostrar overlay y panel
            overlay.classList.add("active");
            sidepanel.classList.add("side-panel-open");
            loading.innerText = "Cargando..."; 
            container.classList.add('hide');
            loading.classList.remove('hide');
            
            // IMPORTANTE: Obtenemos el nombre del estado del atributo 'name' del SVG
            let clickedStateName = this.getAttribute("name");
            
            // Si no tiene 'name', intentar con otros atributos
            if (!clickedStateName) {
                clickedStateName = this.getAttribute("data-name") || 
                                 this.getAttribute("id") || 
                                 this.getAttribute("title");
            }
            
            if (clickedStateName) {
                console.log('Estado clickeado (original):', clickedStateName);
                console.log('Estado clickeado (normalizado):', normalizarNombreEstado(clickedStateName));
                // Llamamos a la función que actualiza el panel con los datos
                actualizarPanel(clickedStateName);
            } else {
                console.error("El elemento <path> no tiene un atributo 'name'.", this);
                loading.innerText = "Error: Falta el nombre del estado en el mapa.";
            }
        });

        // Evento para selección en móviles (touch)
        edo.addEventListener("touchend", function(e) {
            e.preventDefault(); // Evita doble disparo y scroll
            e.stopPropagation();

            overlay.classList.add("active");
            sidepanel.classList.add("side-panel-open");
            loading.innerText = "Cargando..."; 
            container.classList.add('hide');
            loading.classList.remove('hide');

            let clickedStateName = this.getAttribute("name");
            if (!clickedStateName) {
                clickedStateName = this.getAttribute("data-name") || 
                                   this.getAttribute("id") || 
                                   this.getAttribute("title");
            }
            if (clickedStateName) {
                actualizarPanel(clickedStateName);
            } else {
                loading.innerText = "Error: Falta el nombre del estado en el mapa.";
            }
        }, { passive: false });
    });

    // Evento para cerrar el panel lateral
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            cerrarPanel();
        });
    }
    
    // Evento para cerrar el panel al hacer clic en el overlay
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            cerrarPanel();
        }
    });
    
    // Evento para cerrar el panel con la tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidepanel.classList.contains('side-panel-open')) {
            cerrarPanel();
        }
    });
    
    // Función para cerrar el panel con animación
    function cerrarPanel() {
        // Agregar clase de cierre para animar el contenido
        sidepanel.classList.add('closing');
        
        // Esperar a que termine la animación del contenido
        setTimeout(() => {
            sidepanel.classList.remove('side-panel-open', 'closing');
            overlay.classList.remove('active');
        }, 400); // Tiempo de la animación de salida del contenido
    }

    // --- Función adicional para debugging ---
    // Esta función te ayudará a ver qué nombres de estados están disponibles
    window.mostrarEstadosDisponibles = function() {
        if (datosEstadisticos && Object.keys(datosEstadisticos).length > 0) {
            console.log('Estados disponibles en el JSON:');
            Object.keys(datosEstadisticos).forEach(estado => {
                console.log(`- ${estado}`);
            });
        } else {
            console.log('Los datos aún no se han cargado');
        }
    };

    // --- Función para debugging de codificación ---
    window.debugCodificacion = function(texto) {
        console.log('Texto original:', texto);
        console.log('Texto normalizado:', normalizarNombreEstado(texto));
        console.log('Códigos de caracteres:', Array.from(texto).map(c => c.charCodeAt(0)));
    };

    // --- Función para centrar el mapa en un estado específico ---
    function centrarEnEstado(nombreEstado) {
        const estadoElement = document.querySelector(`path[name="${nombreEstado}"]`);
        if (estadoElement) {
            const bbox = estadoElement.getBBox();
            const mapBbox = map.getBBox();
            
            // Calcular el centro del estado
            const estadoCenterX = bbox.x + bbox.width / 2;
            const estadoCenterY = bbox.y + bbox.height / 2;
            
            // Calcular el centro del mapa
            const mapCenterX = mapBbox.x + mapBbox.width / 2;
            const mapCenterY = mapBbox.y + mapBbox.height / 2;
            
            // Calcular el offset necesario
            currentX = (mapCenterX - estadoCenterX) * currentZoom;
            currentY = (mapCenterY - estadoCenterY) * currentZoom;
            
            aplicarTransformacion();
        }
    }

    // --- Funciones públicas para control de zoom y movimiento ---
    window.mapControls = {
        zoomIn: zoomIn,
        zoomOut: zoomOut,
        zoomReset: zoomReset,
        centrarEnEstado: centrarEnEstado,
        getCurrentZoom: () => currentZoom,
        getCurrentPosition: () => ({ x: currentX, y: currentY })
    };
});