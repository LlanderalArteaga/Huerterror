# 🎃 EL HUERTERROR - Videojuego Web 3D

**El Huerterror** es un videojuego Web 3D de supervivencia y acción en
tercera persona desarrollado con **Three.js**, **JavaScript ES6** y
**Bootstrap 5**.

El jugador deberá defender un huerto embrujado de hordas de zombies
utilizando jitomates como proyectiles físicos, recolectando llaves
místicas y completando misiones a lo largo de **3 niveles progresivos**.

------------------------------------------------------------------------

## 🔗 Enlace a la Aplicación Pública

-   🎮 **Página del juego:** [Jugar a El Huerterror en GitHub
    Pages](https://llanderalarteaga.github.io/Huerterror/)


------------------------------------------------------------------------

## 📜 Historia y Contexto de la Misión

Una extraña maldición de Halloween ha caído sobre la granja.

Las cosechas de jitomates han cobrado propiedades místicas y la tierra
expulsó una horda de zombies sedientos de sangre.

Para romper el hechizo y escapar con vida, deberás cosechar tus
jitomates, defender el huerto, encontrar las llaves sagradas ocultas y
despertar al legendario **Esqueleto Guardián**, quien abrirá la puerta
del portal final.

------------------------------------------------------------------------

## 🎮 Controles de Juego

  -----------------------------------------------------------------------
  Acción                  Control Teclado / Mouse Descripción
  ----------------------- ----------------------- -----------------------
  **Movimiento**          `W A S D`               Desplaza al personaje
                                                  en el espacio 3D según
                                                  la cámara.

  **Correr**              `Shift`                 Aumenta la velocidad de
                                                  desplazamiento.

  **Girar Cámara**        Movimiento del mouse    Permite rotar la cámara
                                                  en tercera persona.

  **Lanzar Jitomate**     Clic izquierdo          Dispara un jitomate
                                                  consumiendo munición.

  **Interactuar /         `E`                     Recoge munición de las
  Cosechar**                                      plantas o activa
                                                  objetos y llaves.

  **Ajustar Potencia**    Deslizador de la        Modifica la fuerza
                          interfaz                inicial del lanzamiento
                                                  del proyectil.
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 🎯 Reglas del Juego y Niveles

## 🧟 Nivel 1: Cacería Inicial

### Objetivo

Eliminar a **10 zombies** utilizando los jitomates como proyectiles.

### Mecánica

-   El jugador cuenta con munición limitada.
-   Puede acercarse a los cultivos y utilizar `E` para cosechar más
    jitomates.
-   Los jitomates pueden lanzarse utilizando el clic izquierdo.
-   Al eliminar a los 10 zombies se activará el portal místico verde.

### Misión

Atravesar el portal para avanzar al **Nivel 2**.

------------------------------------------------------------------------

## 🔑 Nivel 2: La Horda y las Llaves

### Objetivo

Explorar la granja y recolectar **3 Llaves Místicas Brillantes**.

### Mecánica

-   Las llaves se encuentran distribuidas por el escenario.
-   El jugador debe acercarse a ellas y utilizar `E` para recogerlas.
-   Los zombies reaparecen continuamente.
-   Es necesario mantenerse en movimiento mientras se explora el mapa.

### Misión

Recolectar las 3 llaves y dirigirse al portal de salida para acceder al
**Nivel 3**.

------------------------------------------------------------------------

## 💀 Nivel 3: La Batalla Final

### Objetivo

Encontrar **5 Llaves/Cofres Místicos** y llevarlos hasta el **Ataúd
Sagrado** ubicado en el centro del mapa.

### Mecánica

-   Los zombies entran en estado de furia permanente.
-   Los enemigos aumentan su velocidad y daño.
-   El jugador debe encontrar los 5 objetos místicos.
-   Los objetos deben entregarse en el Ataúd Sagrado.
-   Al completar la entrega, despertará el **Esqueleto Guardián**.

### Misión

Seguir al Esqueleto Guardián hasta la puerta mística que seleccionará
aleatoriamente para escapar definitivamente.

------------------------------------------------------------------------

## 🛑 Condiciones de Victoria y Derrota

### 🏆 Victoria

Escapar a través del portal activado en el **Nivel 3**.

### 💀 Derrota

Perder la totalidad de la vida, llegando a **0%**, después de recibir
ataques de los zombies.

### 🔄 Reinicio

Después de perder, aparece una pantalla interactiva que permite
**reiniciar la partida inmediatamente sin recargar el navegador**.

------------------------------------------------------------------------

# ⚙️ Mecánicas Principales y Sistema de Física

## 🍅 Lanzamiento de Proyectiles

Los jitomates funcionan como proyectiles dinámicos calculados mediante
vectores de velocidad y aceleración por gravedad.

La gravedad utilizada en el juego es:

``` text
g = 7.0 m/s²
```

Al impactar contra el suelo, enemigos o límites del escenario, los
proyectiles se destruyen y generan un sistema de partículas que
representa la pulpa del jitomate.

------------------------------------------------------------------------

## 🎚️ Parámetro Configurable de Potencia

El juego cuenta con un control deslizante:

``` text
throwForceSlider
```

Este permite modificar dinámicamente la fuerza inicial de lanzamiento
del jitomate.

### Rango

``` text
10 - 50 unidades
```

El control se encuentra disponible en el HUD y en las pantallas de
transición entre niveles.

------------------------------------------------------------------------

## 🧱 Límites y Colisiones

El sistema utiliza detección de colisiones mediante:

-   Bounding Boxes.
-   Rangos de proximidad.
-   Límites definidos para el mapa.
-   Detección de obstáculos y estructuras.

Esto evita que el jugador atraviese muros, vallas, estructuras o salga
de los límites establecidos del escenario.

------------------------------------------------------------------------

# 🛠️ Tecnologías Utilizadas

  -----------------------------------------------------------------------
  Tecnología                          Uso
  ----------------------------------- -----------------------------------
  **Three.js v0.160.0**               Renderizado 3D, iluminación,
                                      sombras y cámaras.

  **GLTFLoader**                      Carga de modelos `.glb` y `.gltf`.

  **SkeletonUtils**                   Clonación de modelos 3D con
                                      jerarquías y esqueletos.

  **AnimationMixer**                  Control de animaciones de
                                      personajes.

  **Bootstrap 5**                     Diseño del HUD y elementos de
                                      interfaz.

  **CSS3**                            Estilos personalizados y efectos
                                      visuales.

  **HTML5**                           Estructura de la aplicación web.

  **JavaScript ES6 Modules**          Lógica y arquitectura modular del
                                      videojuego.

  **Git**                             Control de versiones.

  **GitHub Pages**                    Despliegue público de la
                                      aplicación.
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 📁 Estructura del Proyecto

``` text
.
├── index.html                  # Interfaz principal, HUD y pantallas de transición
├── README.md                   # Documentación del proyecto
└── assets/
    ├── css/
    │   └── styles.css          # Estilos personalizados y del HUD
    ├── js/
    │   ├── animals.js          # Lógica y comportamiento de animales en la escena
    │   ├── chests.js           # Manejo e interacción con cofres
    │   ├── doors.js            # Lógica de apertura/cierre de puertas y portales
    │   ├── enemies.js          # IA de zombies y esqueleto guardián
    │   ├── game.js             # Bucle de juego, estados y gestión de niveles
    │   ├── keys.js             # Lógica de recolección de llaves místicas
    │   ├── main.js             # Punto de entrada e inicialización de la escena
    │   ├── mapLoader.js        # Carga y estructuración del mapa
    │   ├── physics.js          # Sistema de colisiones y límites del mapa
    │   ├── player.js           # Movimiento, cámara y animaciones del jugador
    │   ├── tomato.js           # Física de proyectiles, partículas y cultivos
    │   ├── tomb.js             # Manejo e interacción con el ataúd sagrado
    │   └── ui.js               # HUD, sliders y pantallas de interfaz
    ├── map/                    # Archivos y elementos estructurados del mapa
    │   ├── animals/
    │   ├── blocks/
    │   ├── characters/
    │   ├── enemies/
    │   ├── envirioment/
    │   ├── farm/
    │   ├── food/
    │   ├── halloween/
    │   ├── pixel_blocks/
    │   └── tools/
    ├── models/                 # Modelos 3D (.glb / .gltf)
    │   ├── character/
    │   ├── enemies/
    │   ├── environment/
    │   └── props/
    └── textures/               # Texturas y mapas de imagen del juego
```

------------------------------------------------------------------------

# 📑 Créditos y Licencias de Recursos Externos

Los recursos 3D utilizados en este proyecto respetan las licencias
otorgadas por sus respectivos creadores.

## 🎨 Quaternius

Se utilizaron recursos pertenecientes a los siguientes paquetes:

-   **Cube World Kit**
-   **Farm Buildings**
-   **Nature Crops Pack**
-   **Ultimate Food Pack**

**Autor:** Quaternius (@Quaternius)

**Fuente:** [Quaternius](https://www.patreon.com/quaternius)

**Licencia:** CC0 1.0 Universal (Public Domain Dedication).

Los recursos bajo esta licencia pueden utilizarse para proyectos
personales y comerciales sin necesidad de atribución obligatoria.

------------------------------------------------------------------------

## 🎃 Halloween Bits Pack

**Autor:** Kay Lousberg

**Fuente:** [Poly Pizza - Halloween
Bits](https://poly.pizza/bundle/Halloween-Bits-5J1jHdy21M)

**Licencia:** Public Domain (CC0).

El recurso puede utilizarse para proyectos personales y comerciales sin
atribución obligatoria.

------------------------------------------------------------------------

# 🤖 Uso de Inteligencia Artificial como Asistente

Durante el desarrollo de este proyecto se utilizó **Inteligencia
Artificial como herramienta de asistencia para programación y resolución
de problemas técnicos**.

La IA fue utilizada principalmente para:

1.  Apoyar la estructuración modular de los scripts JavaScript mediante
    `import` y `export`.
2.  Asistir en cálculos matemáticos relacionados con trayectorias
    parabólicas.
3.  Apoyar en la implementación de la física de lanzamiento de
    jitomates.
4.  Apoyar en la generación y dispersión de partículas.
5.  Revisar y optimizar rutinas de detección de colisiones.
6.  Resolver problemas relacionados con límites y posiciones dentro del
    mapa.

### 🔧 Ajustes y validaciones manuales

El desarrollo también incluyó ajustes y pruebas realizadas manualmente,
entre ellos:

-   Corrección de escalas, posiciones y rotaciones de modelos `.glb`.
-   Sincronización de animaciones mediante `AnimationMixer`.
-   Configuración de los estados de movimiento del personaje.
-   Creación y vinculación del control configurable de potencia con el
    HUD.
-   Corrección de rutas relativas para garantizar el funcionamiento en
    GitHub Pages.
-   Pruebas de funcionamiento y depuración del videojuego.

------------------------------------------------------------------------

# 💻 Instrucciones para Ejecución Local

## 1. Clonar el repositorio

``` bash
git clone https://github.com/LlanderalArteaga/Huerterror.git
```

## 2. Abrir el proyecto

Abre la carpeta del proyecto utilizando **Visual Studio Code**.

## 3. Iniciar un servidor local

Se recomienda utilizar una extensión como **Live Server**.

También puede utilizarse:

``` bash
npx serve
```

## 4. Abrir el videojuego

Si utilizas Live Server, normalmente estará disponible en:

``` text
http://127.0.0.1:5500
```

Abre la dirección en un navegador web compatible con WebGL.

------------------------------------------------------------------------

# 🌐 Compatibilidad

El videojuego está diseñado para ejecutarse en navegadores web modernos
compatibles con **WebGL** y **JavaScript ES6 Modules**.

Se recomienda utilizar:

-   Google Chrome
-   Microsoft Edge
-   Mozilla Firefox

Para una mejor experiencia se recomienda utilizar una computadora con
mouse y teclado.

------------------------------------------------------------------------

# 🎓 Información del Proyecto

**Proyecto:** El Huerterror\
**Tipo:** Videojuego Web 3D\
**Género:** Supervivencia / Acción\
**Perspectiva:** Tercera persona\
**Motor / Librería:** Three.js\
**Plataforma:** Navegador Web\
**Despliegue:** GitHub Pages

------------------------------------------------------------------------

## 📚 Examen

Proyecto desarrollado como parte del:

> **Examen del Tema 1: Introducción a las interfaces 3D y experiencia de
> usuario**

El proyecto integra conceptos de:

-   Escenas 3D.
-   Modelos tridimensionales.
-   Cámaras.
-   Iluminación.
-   Animaciones.
-   Interacción con el usuario.
-   Física de proyectiles.
-   Colisiones.
-   Diseño de interfaces.
-   Experiencia de usuario.

------------------------------------------------------------------------

# 👻 ¡Sobrevive al Huerterror!

**¿Tendrás lo necesario para defender el huerto, encontrar las llaves y
escapar antes de que los zombies te alcancen?** 🎃🧟🍅💀
