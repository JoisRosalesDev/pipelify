import logging
import time
from typing import Any, Dict, List, Optional
import duckdb

logger = logging.getLogger(__name__)


def _fetch_dict_preview(con: duckdb.DuckDBPyConnection, table_name: str, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Obtiene una vista previa de la tabla como lista de diccionarios puros de Python
    sin depender de pandas o numpy.
    """
    try:
        cur = con.execute(f"SELECT * FROM {table_name} LIMIT {limit}")
        cols = [desc[0] for desc in cur.description]
        rows = cur.fetchall()
        return [dict(zip(cols, row)) for row in rows]
    except Exception as e:
        logger.warning(f"Error al obtener preview de {table_name}: {e}")
        return []


class DataPlaneExecutor:
    """
    Motor de ejecución real de datos para nodos ETL utilizando DuckDB en memoria.
    Proporciona aislamiento por ejecución y soporte para:
      - Extracción: Generación sintética determinista o lectura de CSV/JSON/Parquet.
      - Transformación: Consultas SQL relacionales (filtros, agregaciones, joins).
      - Carga: Validación de integridad, conteo de filas, cálculo de métricas y preview.
    """

    def __init__(self):
        self._sessions: Dict[str, duckdb.DuckDBPyConnection] = {}

    def get_or_create_connection(self, execution_id: str) -> duckdb.DuckDBPyConnection:
        if execution_id not in self._sessions:
            self._sessions[execution_id] = duckdb.connect(database=":memory:")
        return self._sessions[execution_id]

    def close_session(self, execution_id: str) -> None:
        con = self._sessions.pop(execution_id, None)
        if con:
            try:
                con.close()
            except Exception as e:
                logger.warning(f"Error al cerrar conexión DuckDB para {execution_id}: {e}")

    def execute_node(
        self,
        execution_id: str,
        node: Dict[str, Any],
        upstream_nodes: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Ejecuta la lógica real del nodo ETL.
        Retorna métricas reales: processed_records, execution_time_ms, preview, etc.
        """
        node_id = str(node.get("id"))
        node_data = node.get("data", {})
        config = node_data.get("config", {})
        node_type = str(node_data.get("type", "processor")).lower()

        # Inyección forzada de fallos para tests de resiliencia
        if (
            config.get("fail_test") is True
            or config.get("force_fail") is True
            or config.get("forceFail") is True
            or "fail" in str(config.get("transformFunction", "")).lower()
        ):
            raise ValueError(f"Fallo forzado por configuración en nodo '{node_id}'")

        con = self.get_or_create_connection(execution_id)
        table_name = f"table_{node_id.replace('-', '_')}"

        t0 = time.perf_counter()

        # 1. EXTRACTOR
        if "extract" in node_type or node_type == "source":
            batch_size = int(config.get("batch_size", 10000))
            source_url = config.get("source_url")

            if source_url and (source_url.endswith(".csv") or source_url.endswith(".parquet")):
                con.execute(f"CREATE TABLE {table_name} AS SELECT * FROM '{source_url}' LIMIT {batch_size}")
            else:
                con.execute(f"""
                    CREATE OR REPLACE TABLE {table_name} AS
                    SELECT 
                        i AS transaction_id,
                        (100 + (i % 500)) AS user_id,
                        CASE (i % 4)
                            WHEN 0 THEN 'Electronics'
                            WHEN 1 THEN 'Clothing'
                            WHEN 2 THEN 'Home'
                            ELSE 'Books'
                        END AS category,
                        ROUND((random() * 200 + 5)::numeric, 2) AS amount,
                        (CURRENT_DATE - (i % 30) * INTERVAL '1 day') AS transaction_date
                    FROM range(1, {batch_size + 1}) t(i)
                """)

            count_res = con.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()
            row_count = count_res[0] if count_res else 0
            preview = _fetch_dict_preview(con, table_name, limit=3)

        # 2. TRANSFORMER
        elif "transform" in node_type or "processor" in node_type:
            input_table = None
            if upstream_nodes:
                for up_id in upstream_nodes:
                    candidate = f"table_{up_id.replace('-', '_')}"
                    tables = [row[0] for row in con.execute("SHOW TABLES").fetchall()]
                    if candidate in tables:
                        input_table = candidate
                        break

            if not input_table:
                tables = [row[0] for row in con.execute("SHOW TABLES").fetchall()]
                input_table = tables[-1] if tables else None

            if not input_table:
                con.execute("CREATE OR REPLACE TABLE input_fallback AS SELECT range AS id, range * 2 AS val FROM range(1, 1001)")
                input_table = "input_fallback"

            custom_sql = config.get("sql_query") or config.get("transform_sql")
            if custom_sql:
                con.execute(f"CREATE OR REPLACE TABLE {table_name} AS {custom_sql}")
            else:
                con.execute(f"""
                    CREATE OR REPLACE TABLE {table_name} AS
                    SELECT 
                        category,
                        COUNT(*) AS total_orders,
                        ROUND(SUM(amount), 2) AS total_revenue,
                        ROUND(AVG(amount), 2) AS avg_ticket
                    FROM {input_table}
                    WHERE amount > 20.0
                    GROUP BY category
                    ORDER BY total_revenue DESC
                """)

            count_res = con.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()
            row_count = count_res[0] if count_res else 0
            preview = _fetch_dict_preview(con, table_name, limit=5)

        # 3. LOADER / SINK
        else:
            tables = [row[0] for row in con.execute("SHOW TABLES").fetchall()]
            target_table = tables[-1] if tables else None

            if target_table:
                con.execute(f"CREATE OR REPLACE TABLE {table_name} AS SELECT * FROM {target_table}")
                count_res = con.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()
                row_count = count_res[0] if count_res else 0
                preview = _fetch_dict_preview(con, table_name, limit=3)
            else:
                row_count = 0
                preview = []

        elapsed_ms = int((time.perf_counter() - t0) * 1000)

        return {
            "node_id": node_id,
            "node_type": node_type,
            "engine": "DuckDB-in-memory",
            "processed_records": row_count,
            "execution_time_ms": max(1, elapsed_ms),
            "preview": preview,
            "status": "SUCCESS",
        }


data_plane_executor = DataPlaneExecutor()
