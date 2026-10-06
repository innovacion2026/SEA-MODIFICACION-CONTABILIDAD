package com.sea.strategichub.controller;

import com.sea.strategichub.service.GenericDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/contabilidad")
public class ContabilidadController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private GenericDataService genericDataService;

    // ═══════════════════════════════════════════════════════════════
    //  1. COMPROBANTES DE INTERFAZ CONTABLE
    // ═══════════════════════════════════════════════════════════════

    @GetMapping("/comprobantes")
    public ResponseEntity<?> getComprobantes() {
        try {
            List<Map<String, Object>> comprobantes = jdbcTemplate.queryForList(
                    "SELECT * FROM CONT_COMPROBANTES_INTERFAZ ORDER BY id DESC"
            ).stream().map(genericDataService::keysToLowerCase).collect(Collectors.toList());

            for (Map<String, Object> comp : comprobantes) {
                Long compId = ((Number) comp.get("id")).longValue();
                List<Map<String, Object>> lineas = jdbcTemplate.queryForList(
                        "SELECT * FROM CONT_COMPROBANTES_LINEAS WHERE comprobante_id = ? ORDER BY linea_nro ASC",
                        compId
                ).stream().map(genericDataService::keysToLowerCase).collect(Collectors.toList());
                comp.put("lineas", lineas);
            }

            return ResponseEntity.ok(comprobantes);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error al consultar comprobantes: " + e.getMessage()));
        }
    }

    @GetMapping("/comprobantes/{id}")
    public ResponseEntity<?> getComprobanteById(@PathVariable Long id) {
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT * FROM CONT_COMPROBANTES_INTERFAZ WHERE id = ?", id
            );
            if (rows.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Comprobante no encontrado"));
            }
            Map<String, Object> comp = genericDataService.keysToLowerCase(rows.get(0));
            List<Map<String, Object>> lineas = jdbcTemplate.queryForList(
                    "SELECT * FROM CONT_COMPROBANTES_LINEAS WHERE comprobante_id = ? ORDER BY linea_nro ASC",
                    id
            ).stream().map(genericDataService::keysToLowerCase).collect(Collectors.toList());
            comp.put("lineas", lineas);
            return ResponseEntity.ok(comp);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error al consultar comprobante: " + e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  2. MAPEO DE CUENTAS
    // ═══════════════════════════════════════════════════════════════

    @GetMapping("/mapeos")
    public ResponseEntity<?> getMapeos() {
        try {
            List<Map<String, Object>> mapeos = jdbcTemplate.queryForList(
                    "SELECT * FROM CONT_MAPEO_CUENTAS ORDER BY modulo_origen, id ASC"
            ).stream().map(genericDataService::keysToLowerCase).collect(Collectors.toList());
            return ResponseEntity.ok(mapeos);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error al consultar mapeos: " + e.getMessage()));
        }
    }

    @PostMapping("/mapeos")
    public ResponseEntity<?> saveMapeo(@RequestBody Map<String, Object> body) {
        try {
            String modulo = (String) body.get("modulo_origen");
            String concepto = (String) body.get("concepto_operacion");
            String partida = (String) body.get("codigo_partida_sea");
            String cuenta = (String) body.get("cuenta_contable");
            String nombreCuenta = (String) body.get("nombre_cuenta");
            String centroCosto = (String) body.get("centro_costo");
            String estatus = body.get("estatus") != null ? (String) body.get("estatus") : "Activo";

            if (body.get("id") != null) {
                Long id = ((Number) body.get("id")).longValue();
                jdbcTemplate.update(
                        "UPDATE CONT_MAPEO_CUENTAS SET modulo_origen = ?, concepto_operacion = ?, codigo_partida_sea = ?, cuenta_contable = ?, nombre_cuenta = ?, centro_costo = ?, estatus = ? WHERE id = ?",
                        modulo, concepto, partida, cuenta, nombreCuenta, centroCosto, estatus, id
                );
            } else {
                jdbcTemplate.update(
                        "INSERT INTO CONT_MAPEO_CUENTAS (modulo_origen, concepto_operacion, codigo_partida_sea, cuenta_contable, nombre_cuenta, centro_costo, estatus) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        modulo, concepto, partida, cuenta, nombreCuenta, centroCosto, estatus
                );
            }
            return ResponseEntity.ok(Map.of("message", "Mapeo guardado exitosamente"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error al guardar mapeo: " + e.getMessage()));
        }
    }

    @DeleteMapping("/mapeos/{id}")
    public ResponseEntity<?> deleteMapeo(@PathVariable Long id) {
        try {
            jdbcTemplate.update("DELETE FROM CONT_MAPEO_CUENTAS WHERE id = ?", id);
            return ResponseEntity.ok(Map.of("message", "Mapeo eliminado correctamente"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error al eliminar mapeo: " + e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  3. TRANSMISIÓN Y TRANSMISIÓN EN LOTE A CONTABILIDAD CENTRAL
    // ═══════════════════════════════════════════════════════════════

    @PostMapping("/transmitir/{id}")
    @Transactional
    public ResponseEntity<?> transmitirComprobante(@PathVariable Long id) {
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT * FROM CONT_COMPROBANTES_INTERFAZ WHERE id = ?", id
            );
            if (rows.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Comprobante no encontrado"));
            }

            Map<String, Object> comp = genericDataService.keysToLowerCase(rows.get(0));
            String estatusActual = (String) comp.get("estatus_envio");

            if ("PROCESADO".equalsIgnoreCase(estatusActual)) {
                return ResponseEntity.badRequest().body(Map.of("error", "El comprobante ya fue procesado previamente."));
            }

            // Simular respuesta exitosa de la Contabilidad Central
            String nroAsientoCentral = "AST-2026-" + (1000 + (int)(Math.random() * 9000));
            String mensaje = "Asiento contabilizado exitosamente en el Sistema Contable Central.";

            jdbcTemplate.update(
                    "UPDATE CONT_COMPROBANTES_INTERFAZ SET estatus_envio = 'PROCESADO', fecha_envio = SYSDATE, contabilidad_nro_asiento = ?, mensaje_respuesta = ? WHERE id = ?",
                    nroAsientoCentral, mensaje, id
            );

            jdbcTemplate.update(
                    "INSERT INTO CONT_LOG_TRANSMISION (comprobante_id, fecha_intento, tipo_transmision, estado_resultado, codigo_respuesta, detalle_respuesta) VALUES (?, SYSDATE, 'MANUAL', 'OK', '200', ?)",
                    id, mensaje + " Asiento Nro: " + nroAsientoCentral
            );

            return ResponseEntity.ok(Map.of(
                    "message", "Comprobante transmitido exitosamente al Sistema Contable Central",
                    "nro_asiento", nroAsientoCentral,
                    "estatus", "PROCESADO"
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error al transmitir comprobante: " + e.getMessage()));
        }
    }

    @PostMapping("/transmitir-lote")
    @Transactional
    public ResponseEntity<?> transmitirLote() {
        try {
            List<Map<String, Object>> pendientes = jdbcTemplate.queryForList(
                    "SELECT id FROM CONT_COMPROBANTES_INTERFAZ WHERE estatus_envio = 'PENDIENTE' OR estatus_envio = 'ERROR'"
            );

            int procesados = 0;
            for (Map<String, Object> row : pendientes) {
                Long id = ((Number) row.get("ID")).longValue();
                String nroAsientoCentral = "AST-2026-" + (1000 + (int)(Math.random() * 9000));
                String mensaje = "Lote procesado exitosamente en Contabilidad Central.";

                jdbcTemplate.update(
                        "UPDATE CONT_COMPROBANTES_INTERFAZ SET estatus_envio = 'PROCESADO', fecha_envio = SYSDATE, contabilidad_nro_asiento = ?, mensaje_respuesta = ? WHERE id = ?",
                        nroAsientoCentral, mensaje, id
                );

                jdbcTemplate.update(
                        "INSERT INTO CONT_LOG_TRANSMISION (comprobante_id, fecha_intento, tipo_transmision, estado_resultado, codigo_respuesta, detalle_respuesta) VALUES (?, SYSDATE, 'LOTE_AUTOMATICO', 'OK', '200', ?)",
                        id, mensaje + " Asiento Nro: " + nroAsientoCentral
                );

                procesados++;
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Lote de comprobantes transmitido exitosamente",
                    "total_procesados", procesados
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error al transmitir lote: " + e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  4. LOGS DE TRANSMISIÓN
    // ═══════════════════════════════════════════════════════════════

    @GetMapping("/logs")
    public ResponseEntity<?> getLogs() {
        try {
            List<Map<String, Object>> logs = jdbcTemplate.queryForList(
                    "SELECT l.*, c.codigo_comprobante, c.modulo_origen FROM CONT_LOG_TRANSMISION l LEFT JOIN CONT_COMPROBANTES_INTERFAZ c ON l.comprobante_id = c.id ORDER BY l.id DESC"
            ).stream().map(genericDataService::keysToLowerCase).collect(Collectors.toList());
            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error al consultar logs: " + e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  5. RESET DEMO DATA (RE-POBLAR BD CON DATOS LIMPIOS DE PRUEBA)
    // ═══════════════════════════════════════════════════════════════

    @PostMapping("/reset-demo")
    @Transactional
    public ResponseEntity<?> resetDemoData() {
        try {
            jdbcTemplate.update("DELETE FROM CONT_LOG_TRANSMISION");
            jdbcTemplate.update("DELETE FROM CONT_COMPROBANTES_LINEAS");
            jdbcTemplate.update("DELETE FROM CONT_COMPROBANTES_INTERFAZ");
            jdbcTemplate.update("DELETE FROM CONT_MAPEO_CUENTAS");

            // MAPEOS DE CUENTAS
            jdbcTemplate.update("INSERT INTO CONT_MAPEO_CUENTAS (MODULO_ORIGEN, CONCEPTO_OPERACION, CODIGO_PARTIDA_SEA, CUENTA_CONTABLE, NOMBRE_CUENTA, CENTRO_COSTO, ESTATUS) VALUES ('CXP', 'Factura de Proveedor Bienes y Servicios', 'PART-401.01.02', '510201001', 'Gastos de Equipos Informaticos', 'CC-IT01', 'Activo')");
            jdbcTemplate.update("INSERT INTO CONT_MAPEO_CUENTAS (MODULO_ORIGEN, CONCEPTO_OPERACION, CODIGO_PARTIDA_SEA, CUENTA_CONTABLE, NOMBRE_CUENTA, CENTRO_COSTO, ESTATUS) VALUES ('CXP', 'Pasivo CxP Proveedores Nacionales', NULL, '211010101', 'Cuentas por Pagar Proveedores', 'CC-ADM01', 'Activo')");
            jdbcTemplate.update("INSERT INTO CONT_MAPEO_CUENTAS (MODULO_ORIGEN, CONCEPTO_OPERACION, CODIGO_PARTIDA_SEA, CUENTA_CONTABLE, NOMBRE_CUENTA, CENTRO_COSTO, ESTATUS) VALUES ('PAGOS', 'Pago con Banco Mercantil Cta Cte', NULL, '111020101', 'Banco Mercantil Cta Cte', 'CC-TES01', 'Activo')");
            jdbcTemplate.update("INSERT INTO CONT_MAPEO_CUENTAS (MODULO_ORIGEN, CONCEPTO_OPERACION, CODIGO_PARTIDA_SEA, CUENTA_CONTABLE, NOMBRE_CUENTA, CENTRO_COSTO, ESTATUS) VALUES ('VIATICOS', 'Anticipo / Gasto de Viatico', NULL, '510502001', 'Gastos de Viaje y Viaticos', 'CC-ADM01', 'Activo')");
            jdbcTemplate.update("INSERT INTO CONT_MAPEO_CUENTAS (MODULO_ORIGEN, CONCEPTO_OPERACION, CODIGO_PARTIDA_SEA, CUENTA_CONTABLE, NOMBRE_CUENTA, CENTRO_COSTO, ESTATUS) VALUES ('CAJA_CHICA', 'Fondo Fijo / Reposicion Caja Chica', NULL, '111010201', 'Caja Chica Sucursal Principal', 'CC-ADM01', 'Activo')");

            // COMPROBANTES Y LINEAS
            // CMP 1 - PROCESADO
            jdbcTemplate.update("INSERT INTO CONT_COMPROBANTES_INTERFAZ (CODIGO_COMPROBANTE, MODULO_ORIGEN, REFERENCIA_ORIGEN_ID, NRO_DOCUMENTO_ORIGEN, FECHA_COMPROBANTE, CONCEPTO, TOTAL_DEBE, TOTAL_HABER, ESTATUS_ENVIO, FECHA_ENVIO, CONTABILIDAD_NRO_ASIENTO, MENSAJE_RESPUESTA) VALUES ('CMP-2026-001', 'CXP', 1, 'FACT-99882', SYSDATE - 4, 'Recepcion de Factura Proveedor Distribuidora Andina C.A.', 1500.00, 1500.00, 'PROCESADO', SYSDATE - 4, 'AST-2026-8801', 'Asiento contabilizado exitosamente en el Sistema Contable Central')");
            Long id1 = jdbcTemplate.queryForObject("SELECT id FROM CONT_COMPROBANTES_INTERFAZ WHERE codigo_comprobante = 'CMP-2026-001'", Long.class);
            jdbcTemplate.update("INSERT INTO CONT_COMPROBANTES_LINEAS (COMPROBANTE_ID, LINEA_NRO, CUENTA_CONTABLE, DESCRIPCION_CUENTA, TIPO_MOVIMIENTO, MONTO, CENTRO_COSTO, AUXILIAR_RIF) VALUES (?, 1, '510201001', 'Gastos de Equipos Informaticos', 'DEBE', 1500.00, 'CC-IT01', 'J-31002233-0')", id1);
            jdbcTemplate.update("INSERT INTO CONT_COMPROBANTES_LINEAS (COMPROBANTE_ID, LINEA_NRO, CUENTA_CONTABLE, DESCRIPCION_CUENTA, TIPO_MOVIMIENTO, MONTO, CENTRO_COSTO, AUXILIAR_RIF) VALUES (?, 2, '211010101', 'Cuentas por Pagar Proveedores', 'HABER', 1500.00, 'CC-ADM01', 'J-31002233-0')", id1);
            jdbcTemplate.update("INSERT INTO CONT_LOG_TRANSMISION (COMPROBANTE_ID, FECHA_INTENTO, TIPO_TRANSMISION, ESTADO_RESULTADO, CODIGO_RESPUESTA, DETALLE_RESPUESTA) VALUES (?, SYSDATE - 4, 'AUTOMATICA', 'OK', '200', 'Asiento contabilizado exitosamente en el Sistema Contable Central. Asiento Nro: AST-2026-8801')", id1);

            // CMP 2 - PROCESADO
            jdbcTemplate.update("INSERT INTO CONT_COMPROBANTES_INTERFAZ (CODIGO_COMPROBANTE, MODULO_ORIGEN, REFERENCIA_ORIGEN_ID, NRO_DOCUMENTO_ORIGEN, FECHA_COMPROBANTE, CONCEPTO, TOTAL_DEBE, TOTAL_HABER, ESTATUS_ENVIO, FECHA_ENVIO, CONTABILIDAD_NRO_ASIENTO, MENSAJE_RESPUESTA) VALUES ('CMP-2026-002', 'PAGOS', 1, 'TRF-554102', SYSDATE - 3, 'Pago de Factura FACT-99882 a Distribuidora Andina C.A.', 1500.00, 1500.00, 'PROCESADO', SYSDATE - 3, 'AST-2026-8802', 'Asiento contabilizado exitosamente en el Sistema Contable Central')");
            Long id2 = jdbcTemplate.queryForObject("SELECT id FROM CONT_COMPROBANTES_INTERFAZ WHERE codigo_comprobante = 'CMP-2026-002'", Long.class);
            jdbcTemplate.update("INSERT INTO CONT_COMPROBANTES_LINEAS (COMPROBANTE_ID, LINEA_NRO, CUENTA_CONTABLE, DESCRIPCION_CUENTA, TIPO_MOVIMIENTO, MONTO, CENTRO_COSTO, AUXILIAR_RIF) VALUES (?, 1, '211010101', 'Cuentas por Pagar Proveedores', 'DEBE', 1500.00, 'CC-ADM01', 'J-31002233-0')", id2);
            jdbcTemplate.update("INSERT INTO CONT_COMPROBANTES_LINEAS (COMPROBANTE_ID, LINEA_NRO, CUENTA_CONTABLE, DESCRIPCION_CUENTA, TIPO_MOVIMIENTO, MONTO, CENTRO_COSTO, AUXILIAR_RIF) VALUES (?, 2, '111020101', 'Banco Mercantil Cta Cte', 'HABER', 1500.00, 'CC-TES01', 'J-31002233-0')", id2);
            jdbcTemplate.update("INSERT INTO CONT_LOG_TRANSMISION (COMPROBANTE_ID, FECHA_INTENTO, TIPO_TRANSMISION, ESTADO_RESULTADO, CODIGO_RESPUESTA, DETALLE_RESPUESTA) VALUES (?, SYSDATE - 3, 'AUTOMATICA', 'OK', '200', 'Asiento contabilizado exitosamente en el Sistema Contable Central. Asiento Nro: AST-2026-8802')", id2);

            // CMP 3 - PENDIENTE
            jdbcTemplate.update("INSERT INTO CONT_COMPROBANTES_INTERFAZ (CODIGO_COMPROBANTE, MODULO_ORIGEN, REFERENCIA_ORIGEN_ID, NRO_DOCUMENTO_ORIGEN, FECHA_COMPROBANTE, CONCEPTO, TOTAL_DEBE, TOTAL_HABER, ESTATUS_ENVIO, FECHA_ENVIO, CONTABILIDAD_NRO_ASIENTO, MENSAJE_RESPUESTA) VALUES ('CMP-2026-003', 'CXP', 2, 'FACT-4401', SYSDATE - 1, 'Recepcion de Factura Licenciamiento Software Tecnologia Global S.A.', 8900.00, 8900.00, 'PENDIENTE', NULL, NULL, NULL)");
            Long id3 = jdbcTemplate.queryForObject("SELECT id FROM CONT_COMPROBANTES_INTERFAZ WHERE codigo_comprobante = 'CMP-2026-003'", Long.class);
            jdbcTemplate.update("INSERT INTO CONT_COMPROBANTES_LINEAS (COMPROBANTE_ID, LINEA_NRO, CUENTA_CONTABLE, DESCRIPCION_CUENTA, TIPO_MOVIMIENTO, MONTO, CENTRO_COSTO, AUXILIAR_RIF) VALUES (?, 1, '510202001', 'Gastos de Licenciamiento y Software', 'DEBE', 8900.00, 'CC-IT02', 'J-31002233-1')", id3);
            jdbcTemplate.update("INSERT INTO CONT_COMPROBANTES_LINEAS (COMPROBANTE_ID, LINEA_NRO, CUENTA_CONTABLE, DESCRIPCION_CUENTA, TIPO_MOVIMIENTO, MONTO, CENTRO_COSTO, AUXILIAR_RIF) VALUES (?, 2, '211010101', 'Cuentas por Pagar Proveedores', 'HABER', 8900.00, 'CC-ADM01', 'J-31002233-1')", id3);

            // CMP 4 - PENDIENTE
            jdbcTemplate.update("INSERT INTO CONT_COMPROBANTES_INTERFAZ (CODIGO_COMPROBANTE, MODULO_ORIGEN, REFERENCIA_ORIGEN_ID, NRO_DOCUMENTO_ORIGEN, FECHA_COMPROBANTE, CONCEPTO, TOTAL_DEBE, TOTAL_HABER, ESTATUS_ENVIO, FECHA_ENVIO, CONTABILIDAD_NRO_ASIENTO, MENSAJE_RESPUESTA) VALUES ('CMP-2026-004', 'VIATICOS', 1, 'VIA-2026-01', SYSDATE - 1, 'Anticipo Viatico M. Perez Inspeccion Planta Maracaibo', 1240.00, 1240.00, 'PENDIENTE', NULL, NULL, NULL)");
            Long id4 = jdbcTemplate.queryForObject("SELECT id FROM CONT_COMPROBANTES_INTERFAZ WHERE codigo_comprobante = 'CMP-2026-004'", Long.class);
            jdbcTemplate.update("INSERT INTO CONT_COMPROBANTES_LINEAS (COMPROBANTE_ID, LINEA_NRO, CUENTA_CONTABLE, DESCRIPCION_CUENTA, TIPO_MOVIMIENTO, MONTO, CENTRO_COSTO, AUXILIAR_RIF) VALUES (?, 1, '510502001', 'Gastos de Viaje y Viaticos', 'DEBE', 1240.00, 'CC-ADM01', 'V-14552001')", id4);
            jdbcTemplate.update("INSERT INTO CONT_COMPROBANTES_LINEAS (COMPROBANTE_ID, LINEA_NRO, CUENTA_CONTABLE, DESCRIPCION_CUENTA, TIPO_MOVIMIENTO, MONTO, CENTRO_COSTO, AUXILIAR_RIF) VALUES (?, 2, '111020101', 'Banco Mercantil Cta Cte', 'HABER', 1240.00, 'CC-TES01', 'V-14552001')", id4);

            // CMP 5 - PENDIENTE
            jdbcTemplate.update("INSERT INTO CONT_COMPROBANTES_INTERFAZ (CODIGO_COMPROBANTE, MODULO_ORIGEN, REFERENCIA_ORIGEN_ID, NRO_DOCUMENTO_ORIGEN, FECHA_COMPROBANTE, CONCEPTO, TOTAL_DEBE, TOTAL_HABER, ESTATUS_ENVIO, FECHA_ENVIO, CONTABILIDAD_NRO_ASIENTO, MENSAJE_RESPUESTA) VALUES ('CMP-2026-005', 'CAJA_CHICA', 2, 'CC-2026-053', SYSDATE, 'Reposicion Gastos Papeleria y Consumibles Oficina Principal', 980.00, 980.00, 'PENDIENTE', NULL, NULL, NULL)");
            Long id5 = jdbcTemplate.queryForObject("SELECT id FROM CONT_COMPROBANTES_INTERFAZ WHERE codigo_comprobante = 'CMP-2026-005'", Long.class);
            jdbcTemplate.update("INSERT INTO CONT_COMPROBANTES_LINEAS (COMPROBANTE_ID, LINEA_NRO, CUENTA_CONTABLE, DESCRIPCION_CUENTA, TIPO_MOVIMIENTO, MONTO, CENTRO_COSTO, AUXILIAR_RIF) VALUES (?, 1, '510301001', 'Gastos de Papeleria y Utiles', 'DEBE', 980.00, 'CC-ADM01', 'J-31002233-2')", id5);
            jdbcTemplate.update("INSERT INTO CONT_COMPROBANTES_LINEAS (COMPROBANTE_ID, LINEA_NRO, CUENTA_CONTABLE, DESCRIPCION_CUENTA, TIPO_MOVIMIENTO, MONTO, CENTRO_COSTO, AUXILIAR_RIF) VALUES (?, 2, '111010201', 'Caja Chica Sucursal Principal', 'HABER', 980.00, 'CC-ADM01', 'J-31002233-2')", id5);

            // CMP 6 - ERROR (PERIODO CERRADO)
            jdbcTemplate.update("INSERT INTO CONT_COMPROBANTES_INTERFAZ (CODIGO_COMPROBANTE, MODULO_ORIGEN, REFERENCIA_ORIGEN_ID, NRO_DOCUMENTO_ORIGEN, FECHA_COMPROBANTE, CONCEPTO, TOTAL_DEBE, TOTAL_HABER, ESTATUS_ENVIO, FECHA_ENVIO, CONTABILIDAD_NRO_ASIENTO, MENSAJE_RESPUESTA) VALUES ('CMP-2026-006', 'CXP', 4, 'FACT-7710', SYSDATE - 5, 'Servicio Mantenimiento Electrico Planta Valencia', 2450.00, 2450.00, 'ERROR', SYSDATE - 2, NULL, 'Error 409: Periodo Contable Septiembre 2026 cerrado en el Sistema Contable Central')");
            Long id6 = jdbcTemplate.queryForObject("SELECT id FROM CONT_COMPROBANTES_INTERFAZ WHERE codigo_comprobante = 'CMP-2026-006'", Long.class);
            jdbcTemplate.update("INSERT INTO CONT_COMPROBANTES_LINEAS (COMPROBANTE_ID, LINEA_NRO, CUENTA_CONTABLE, DESCRIPCION_CUENTA, TIPO_MOVIMIENTO, MONTO, CENTRO_COSTO, AUXILIAR_RIF) VALUES (?, 1, '510401001', 'Gastos de Mantenimiento Electrico', 'DEBE', 2450.00, 'CC-MNT01', 'J-31002233-3')", id6);
            jdbcTemplate.update("INSERT INTO CONT_COMPROBANTES_LINEAS (COMPROBANTE_ID, LINEA_NRO, CUENTA_CONTABLE, DESCRIPCION_CUENTA, TIPO_MOVIMIENTO, MONTO, CENTRO_COSTO, AUXILIAR_RIF) VALUES (?, 2, '211010101', 'Cuentas por Pagar Proveedores', 'HABER', 2450.00, 'CC-ADM01', 'J-31002233-3')", id6);
            jdbcTemplate.update("INSERT INTO CONT_LOG_TRANSMISION (COMPROBANTE_ID, FECHA_INTENTO, TIPO_TRANSMISION, ESTADO_RESULTADO, CODIGO_RESPUESTA, DETALLE_RESPUESTA) VALUES (?, SYSDATE - 2, 'MANUAL', 'ERROR', '409', 'Error 409: Periodo Contable Septiembre 2026 cerrado en el Sistema Contable Central')", id6);

            // CMP 7 - ERROR (MAPEO INVALIDO)
            jdbcTemplate.update("INSERT INTO CONT_COMPROBANTES_INTERFAZ (CODIGO_COMPROBANTE, MODULO_ORIGEN, REFERENCIA_ORIGEN_ID, NRO_DOCUMENTO_ORIGEN, FECHA_COMPROBANTE, CONCEPTO, TOTAL_DEBE, TOTAL_HABER, ESTATUS_ENVIO, FECHA_ENVIO, CONTABILIDAD_NRO_ASIENTO, MENSAJE_RESPUESTA) VALUES ('CMP-2026-007', 'RETENCIONES', 1, 'RET-2026-091', SYSDATE - 2, 'Retencion ISLR Comprobante Nro 2026-RET-091', 350.00, 350.00, 'ERROR', SYSDATE - 1, NULL, 'Error 404: Cuenta Contable Central 510999999 no existe o esta inactiva en Catálogo General')");
            Long id7 = jdbcTemplate.queryForObject("SELECT id FROM CONT_COMPROBANTES_INTERFAZ WHERE codigo_comprobante = 'CMP-2026-007'", Long.class);
            jdbcTemplate.update("INSERT INTO CONT_COMPROBANTES_LINEAS (COMPROBANTE_ID, LINEA_NRO, CUENTA_CONTABLE, DESCRIPCION_CUENTA, TIPO_MOVIMIENTO, MONTO, CENTRO_COSTO, AUXILIAR_RIF) VALUES (?, 1, '510999999', 'Cuenta No Encontrada', 'DEBE', 350.00, 'CC-ADM01', 'J-31002233-4')", id7);
            jdbcTemplate.update("INSERT INTO CONT_COMPROBANTES_LINEAS (COMPROBANTE_ID, LINEA_NRO, CUENTA_CONTABLE, DESCRIPCION_CUENTA, TIPO_MOVIMIENTO, MONTO, CENTRO_COSTO, AUXILIAR_RIF) VALUES (?, 2, '213010101', 'Retenciones ISLR por Pagar', 'HABER', 350.00, 'CC-ADM01', 'J-31002233-4')", id7);
            jdbcTemplate.update("INSERT INTO CONT_LOG_TRANSMISION (COMPROBANTE_ID, FECHA_INTENTO, TIPO_TRANSMISION, ESTADO_RESULTADO, CODIGO_RESPUESTA, DETALLE_RESPUESTA) VALUES (?, SYSDATE - 1, 'AUTOMATICA', 'ERROR', '404', 'Error 404: Cuenta Contable Central 510999999 no existe o esta inactiva en Catálogo General')", id7);

            return ResponseEntity.ok(Map.of("message", "Datos demo de contabilidad reiniciados exitosamente"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error al reiniciar datos demo: " + e.getMessage()));
        }
    }
}
