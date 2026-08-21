export type ManualStage = "extractor" | "transformer" | "loader" | "telemetry";

export interface ManualStep {
  stepNumber: number;
  stage: ManualStage;
  title: string;
  subtitle: string;
  description: string;
  configSummary?: Record<string, string | number | boolean>;
  codeSnippet?: string;
  tips?: string;
}

export interface ManualUseCase {
  id: string;
  pipelineId: string;
  title: string;
  subtitle: string;
  category: string;
  status: "COMPLETED" | "RUNNING" | "PENDING";
  description: string;
  architectureNodes: {
    label: string;
    type: "extractor" | "transformer" | "loader";
    tech: string;
  }[];
  metricsSummary: {
    label: string;
    value: string;
    unit?: string;
  }[];
  steps: ManualStep[];
}

export const MANUAL_USE_CASES: ManualUseCase[] = [
  {
    id: "case-sales-sync",
    pipelineId: "etl-sales-sync",
    title: "Sincronización de Ventas PostgreSQL -> BigQuery",
    subtitle: "Extracción continua e ingesta analítica en columnas",
    category: "Data Warehouse & Analytics",
    status: "COMPLETED",
    description:
      "Automatiza el flujo continuo de transacciones desde bases de datos transaccionales PostgreSQL hacia Google BigQuery, aplicando normalización de monedas y tipos de cambio antes de la ingesta en Parquet comprimido.",
    architectureNodes: [
      { label: "Extractor Postgres", type: "extractor", tech: "PostgreSQL" },
      { label: "Transformador Mapeo", type: "transformer", tech: "Python/Celery" },
      { label: "Cargador BigQuery", type: "loader", tech: "BigQuery API" },
    ],
    metricsSummary: [
      { label: "Registros / Lote", value: "5,000", unit: "filas" },
      { label: "Latencia Promedio", value: "320", unit: "ms" },
      { label: "Tasa de Éxito", value: "99.98", unit: "%" },
    ],
    steps: [
      {
        stepNumber: 1,
        stage: "extractor",
        title: "Paso 1: Extracción Transaccional PostgreSQL",
        subtitle: "Configuración del origen de datos y particionamiento",
        description:
          "El nodo extractor realiza consultas incrementales sobre la tabla 'sales_orders' utilizando una marca de agua temporal para capturar únicamente transacciones nuevas o modificadas.",
        configSummary: {
          tableName: "sales_orders",
          batchSize: 5000,
          queryFilter: "updated_at >= NOW() - INTERVAL '15 minutes'",
        },
        codeSnippet: `// Configuración del Nodo Extractor
{
  "sourceType": "PostgreSQL",
  "tableName": "sales_orders",
  "batchSize": 5000,
  "cursorColumn": "updated_at",
  "isolationLevel": "READ_COMMITTED"
}`,
        tips: "Asegúrate de tener un índice B-Tree en la columna 'updated_at' para evitar sequential scans en PostgreSQL.",
      },
      {
        stepNumber: 2,
        stage: "transformer",
        title: "Paso 2: Transformación y Normalización de Moneda",
        subtitle: "Sanitización de esquemas y tipos numéricos",
        description:
          "Se aplica la función distribuida 'clean_currency_fields' en los workers de Celery, convirtiendo divisas extranjeras a USD base, redondeando céntimos y estructurando metadatos en JSON estándar.",
        configSummary: {
          transformFunction: "clean_currency_fields",
          currencyTarget: "USD",
          nullPolicy: "COALESCE_ZERO",
        },
        codeSnippet: `def clean_currency_fields(record: dict) -> dict:
    raw_amount = record.get("amount", 0)
    rate = get_exchange_rate(record.get("currency", "USD"))
    record["amount_usd"] = round(raw_amount * rate, 2)
    record["processed_at"] = datetime.utcnow().isoformat()
    return record`,
        tips: "La transformación se ejecuta en memoria y de forma asíncrona a través de Celery con paralelismo de 4 workers.",
      },
      {
        stepNumber: 3,
        stage: "loader",
        title: "Paso 3: Carga Analítica en BigQuery",
        subtitle: "Ingesta por streaming y particionado por fecha",
        description:
          "Los lotes limpios se transmiten directamente al dataset 'analytics.fact_sales' en BigQuery, optimizando el particionado por 'order_date' y agrupamiento por 'customer_id'.",
        configSummary: {
          destinationType: "BigQuery",
          tableName: "analytics.fact_sales",
          partitionField: "order_date",
          compression: "SNAPPY",
        },
        codeSnippet: `// Configuración de Ingesta BigQuery
{
  "destinationType": "BigQuery",
  "dataset": "analytics",
  "table": "fact_sales",
  "writeDisposition": "WRITE_APPEND",
  "clusteringFields": ["customer_id", "status"]
}`,
        tips: "El particionado diario reduce el costo de lectura en BigQuery hasta en un 90% para consultas de analistas.",
      },
      {
        stepNumber: 4,
        stage: "telemetry",
        title: "Paso 4: Verificación y Telemetría en Vivo",
        subtitle: "Monitoreo reactivo vía WebSockets",
        description:
          "Monitorea en tiempo real el progreso de los nodos mediante el canal WebSocket. Observa las transiciones PENDING -> RUNNING -> COMPLETED y los logs de auditoría.",
        codeSnippet: `// Evento WebSocket en vivo
{
  "event": "NODE_UPDATED",
  "node_id": "node-3",
  "status": "COMPLETED",
  "metrics": {
    "records_processed": 5000,
    "execution_time_ms": 320.4
  }
}`,
        tips: "Puedes abrir el visualizador de logs para consultar los mensajes emitidos por cada worker de Celery en milisegundos.",
      },
    ],
  },
  {
    id: "case-user-segmentation",
    pipelineId: "etl-user-segmentation",
    title: "Segmentación de Usuarios & ML Pipeline",
    subtitle: "Ingesta en streaming y vectorización de comportamiento",
    category: "Machine Learning & Streaming",
    status: "RUNNING",
    description:
      "Captura el flujo de eventos de navegación de usuarios desde Redis Streams, vectoriza sus patrones de clics e interacciones y deposita los datasets preparados en un Data Lake AWS S3 para inferencia de modelos predictivos.",
    architectureNodes: [
      { label: "Extractor Eventos", type: "extractor", tech: "Redis Streams" },
      { label: "Vectorizador ML", type: "transformer", tech: "NumPy / Encoders" },
      { label: "Cargador S3", type: "loader", tech: "AWS S3 / Parquet" },
    ],
    metricsSummary: [
      { label: "Throughput", value: "10,000", unit: "eventos/s" },
      { label: "Tiempo de Inferencia", value: "85", unit: "ms" },
      { label: "Tasa de Error", value: "0.01", unit: "%" },
    ],
    steps: [
      {
        stepNumber: 1,
        stage: "extractor",
        title: "Paso 1: Consumo de Redis Event Streams",
        subtitle: "Suscripción Pub/Sub en tiempo real",
        description:
          "El extractor se conecta al stream 'user_activity_stream' de Redis mediante grupos de consumidores distribuidos, asegurando procesamiento at-least-once sin duplicación.",
        configSummary: {
          tableName: "user_activity_stream",
          consumerGroup: "ml_vectorizers",
          maxReadBatch: 1000,
        },
        codeSnippet: `// Configuración Redis Consumer
{
  "sourceType": "RedisStream",
  "streamKey": "user_activity_stream",
  "group": "ml_vectorizers",
  "batchSize": 1000,
  "blockTimeoutMs": 2000
}`,
        tips: "Utiliza grupos de consumidores para balancear la carga horizontalmente entre múltiples workers Celery.",
      },
      {
        stepNumber: 2,
        stage: "transformer",
        title: "Paso 2: Transformación y Encoders ML",
        subtitle: "Vectorización de características numéricas y categóricas",
        description:
          "Transforma secuencias de clicks, tiempos de permanencia y categorías visitadas en vectores numéricos normalizados mediante 'vectorize_features', listos para algoritmos de clustering.",
        configSummary: {
          transformFunction: "vectorize_features",
          normalization: "MinMax",
          featureDimensions: 64,
        },
        codeSnippet: `def vectorize_features(event_payload: dict) -> dict:
    click_count = event_payload.get("clicks", 0)
    session_duration = event_payload.get("duration_sec", 0)
    # Generar vector estandarizado para ML
    features = [click_count / 100.0, session_duration / 3600.0]
    return {"user_id": event_payload["user_id"], "features": features}`,
        tips: "La normalización rápida en memoria evita cuellos de botella antes de la persistencia masiva.",
      },
      {
        stepNumber: 3,
        stage: "loader",
        title: "Paso 3: Carga en Data Lake AWS S3",
        subtitle: "Almacenamiento columnar particionado",
        description:
          "Exporta los lotes vectorizados hacia 's3://pipelify-datalake/features/user_segmentation/' organizados en carpetas temporales 'year=YYYY/month=MM/day=DD' con compresión Zstandard.",
        configSummary: {
          destinationType: "AWS S3",
          bucket: "pipelify-datalake",
          format: "Parquet (ZSTD)",
        },
        codeSnippet: `// Configuración AWS S3 Target
{
  "destinationType": "AWS S3",
  "bucketName": "pipelify-datalake",
  "keyPrefix": "features/user_segmentation/",
  "compression": "ZSTD",
  "maxPartSizeMb": 64
}`,
        tips: "El formato Parquet con compresión Zstandard optimiza tanto el almacenamiento como la velocidad de escaneo en AWS Athena.",
      },
      {
        stepNumber: 4,
        stage: "telemetry",
        title: "Paso 4: Inspección de Métricas de Ingesta",
        subtitle: "Telemetría continua de throughput y latencia",
        description:
          "Verifica el rendimiento en vivo. Durante la ejecución en streaming, los nodos emiten eventos 'NODE_UPDATED' con métricas de throughput (RPS) y tiempo de procesamiento en milisegundos.",
        codeSnippet: `// Métrica en tiempo real vía WebSocket
{
  "event": "NODE_UPDATED",
  "node_id": "node-2",
  "status": "RUNNING",
  "metrics": {
    "records_processed": 10000,
    "execution_time_ms": 85.2,
    "throughput_rps": 117.6
  }
}`,
        tips: "Si el pipeline reporta sobrecarga, el indicador de estado te alertará antes de que se acumule lag en Redis.",
      },
    ],
  },
  {
    id: "case-inventory-cleanup",
    pipelineId: "etl-inventory-cleanup",
    title: "Depuración Diaria de Inventarios",
    subtitle: "Conciliación de stock ERP y precalentamiento de Cache",
    category: "Conciliación & Cache Warming",
    status: "PENDING",
    description:
      "Realiza el recálculo nocturno de inventarios físicos y comprometidos entre los sistemas ERP principales y las bases de datos de pedidos, resolviendo discrepancias y actualizando la caché de alta velocidad en Redis.",
    architectureNodes: [
      { label: "Extractor ERP", type: "extractor", tech: "ERP Oracle / Postgres" },
      { label: "Calculador Delta", type: "transformer", tech: "Python Delta Engine" },
      { label: "Cargador Redis", type: "loader", tech: "Redis Cluster" },
    ],
    metricsSummary: [
      { label: "SKUs Procesados", value: "50,000", unit: "items" },
      { label: "Tiempo Total", value: "45", unit: "segundos" },
      { label: "Discrepancias", value: "0", unit: "alertas" },
    ],
    steps: [
      {
        stepNumber: 1,
        stage: "extractor",
        title: "Paso 1: Extracción de Tablas ERP de Inventario",
        subtitle: "Lectura masiva de almacenes y reservas",
        description:
          "Extrae la totalidad del catálogo activo de la tabla 'inventory_items', capturando existencias físicas, órdenes en tránsito y reservas de clientes.",
        configSummary: {
          tableName: "inventory_items",
          batchSize: 10000,
          readReplicas: true,
        },
        codeSnippet: `// Configuración Extractor ERP
{
  "sourceType": "PostgreSQL / ERP",
  "tableName": "inventory_items",
  "selectColumns": ["sku", "warehouse_id", "stock_qty", "reserved_qty"],
  "batchSize": 10000
}`,
        tips: "La lectura se efectúa sobre réplicas de sólo lectura para no comprometer las operaciones del almacén.",
      },
      {
        stepNumber: 2,
        stage: "transformer",
        title: "Paso 2: Algoritmo de Conciliación Delta",
        subtitle: "Cálculo de stock neto disponible",
        description:
          "Aplica la función 'calculate_delta' para restar las reservas activas del stock físico, detectando anomalías o inventarios negativos y alertando a los administradores.",
        configSummary: {
          transformFunction: "calculate_delta",
          safetyStockMargin: 5,
          alertOnNegative: true,
        },
        codeSnippet: `def calculate_delta(item: dict) -> dict:
    stock = item.get("stock_qty", 0)
    reserved = item.get("reserved_qty", 0)
    available = max(0, stock - reserved)
    return {
        "sku": item["sku"],
        "available_stock": available,
        "is_low_stock": available < 5
    }`,
        tips: "Las inconsistencias detectadas se registran automáticamente en el visor de logs del pipeline.",
      },
      {
        stepNumber: 3,
        stage: "loader",
        title: "Paso 3: Precalentamiento de Redis Cache",
        subtitle: "Actualización atómica MSET con TTL",
        description:
          "Escribe directamente las claves 'inventory:{sku}' en Redis Cache con un TTL de 24 horas, permitiendo que la tienda online consulte existencias con latencias menores a 2ms.",
        configSummary: {
          destinationType: "Redis",
          keyTemplate: "inventory:{sku}",
          ttlSeconds: 86400,
        },
        codeSnippet: `// Configuración Cargador Redis
{
  "destinationType": "Redis",
  "keyPattern": "inventory:{sku}",
  "operation": "MSET",
  "ttlSeconds": 86400
}`,
        tips: "Utilizar MSET en lugar de llamadas SET individuales reduce los roundtrips de red en un 95%.",
      },
      {
        stepNumber: 4,
        stage: "telemetry",
        title: "Paso 4: Auditoría y Resumen de Ejecución",
        subtitle: "Revisión del reporte de cierre y logs de nodo",
        description:
          "Al finalizar la ejecución, el evento 'EXECUTION_FINISHED' consolida el recuento total de SKUs actualizados y genera un sumario accesible desde el panel de ejecuciones.",
        codeSnippet: `// Evento de Finalización
{
  "event": "EXECUTION_FINISHED",
  "status": "COMPLETED",
  "metrics": {
    "total_records": 50000,
    "total_duration_ms": 45120.0
  }
}`,
        tips: "Puedes programar este pipeline mediante Celery Beat para que se ejecute todas las noches a las 02:00 UTC.",
      },
    ],
  },
];
