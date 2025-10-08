---
applyTo: "**"
---

# Instrucciones de Skill

- Crea una plataforma que permita a los usuarios ver toda la información sobre eventos basado en una plataforma llamada skill, la misma tiene un API con la que se consultaran todos los datos de los eventos.

Debe tener varios modulos: - Modulo de autenticación - Dashboard - Consulta de eventos(Posibilidad de consultar cotizaciones, detalles de los articulos cotizados y reportes) - Calendario de Eventos: Vista de Calendario por mes. - Salones - Articulos de inventario - Clientes - Contactos - Coordinadores de Cuenta

# Interfaz de Usuario

    - Analiza profundamente la mejor forma de implementar un cambio en el código.
    - utiliza unicamente pnpm para la gestión de paquetes.
    - La plataforma debe estar creada con vite + Preact + Typescript.
    - El estilo visual debe ser con Shadcn UI + Tailwind CSS.
    - La plataforma debe ser responsiva y funcionar en dispositivos móviles y de escritorio.
    - La plataforma debe tener un tema oscuro y claro dependiendo de la preferencia del usuario y debe detectarlo automáticamente.
    - La plataforma debe contar con una barra lateral de navegación con los módulos mencionados anteriormente.

# APIS de Conección

La plataforma cuenta con las siguientes accesos al API:

URL Webservice: https://grupoheroicaapi.skillsuite.net/app/wssuite/api
username: wsSk4Api
password: 5qT2Uu!qIjG%$XeD
companyAuthId: xudQREZBrfGdw0ag8tE3NR3XhM6LGa
idData: 14

- Para crear cada connexión al API estos son los url que debes revisar para poder establecer la conexión y obtener los datos necesarios: - Para Autenticación: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2057437200/Por+Token - Para Obtener los Salones: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2109374465/GetRooms - Para Obtener Los Servicios: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2109374481/GetServices - Para obtener Room Rates: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2109374498/GetRoomRates - Para Obtener los Services Rates: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2109374514/GetServiceRates - Para Obtener la Viabilidad de los salones: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2109865985/GetRoomsAvailability - Para Obtener los Tipos de Eventos: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2109898753/GetEventTypes - Para Obetener los Segmentos de mercado: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2109866001/GetEventMarketSegments - Para Obtener los coordinadores de cuenta: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2109374546/GetSalesAgents - Para Obtener el estatus de los Eventos: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2139455489/GetEventStatuses - Para Obtener el Caracter del Evento: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2143584257/GetEventCharacters - Para Obtener el Sector del Evento: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2143617025/GetEventSectors - Para Obtener el tamaño del Evento: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2143682561/GetEventSizes - Para Obtener los tipos de reservación: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2143617041/GetReservationTypes - Para Obtener los usos de la reservación: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2143682577/GetReservationUses - Para obtener las etapas del evento: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2334326800/GetEventStages - Para Obtener los tipos de actividades: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2334326785/GetActivityTypes - Para Obtener los coordinadores de los Eventos: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2172583937/GetEventCoordinators - Para obtener los calendarios: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2186575873/GetSchedules - Para Obtener los Eventos: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2204532737/GetEvents - Para Obtener la cotización de los Eventos: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2219114497/GetEventQuote - Para Obtener las facturas: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2231762946/GetEventInvoices
