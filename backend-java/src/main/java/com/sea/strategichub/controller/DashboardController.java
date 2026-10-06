package com.sea.strategichub.controller;

import com.sea.strategichub.service.GenericDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private GenericDataService genericDataService;

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        try {
            Map<String, Object> stats = new HashMap<>();

            // 1. Total Deuda
            String totalDeudaSql = "SELECT COALESCE(SUM(monto), 0) FROM cxp WHERE estatus != 'Pagado' AND estatus != 'Pagada'";
            Double totalDeuda = jdbcTemplate.queryForObject(totalDeudaSql, Double.class);
            stats.put("totalDeuda", totalDeuda);

            // 2. Facturas Próximas (próximos 14 días)
            String facturasProximasSql = "SELECT COUNT(*) FROM cxp WHERE vencimiento <= CURRENT_DATE + 14 AND estatus != 'Pagado' AND estatus != 'Pagada'";
            Integer facturasProximas = jdbcTemplate.queryForObject(facturasProximasSql, Integer.class);
            stats.put("facturasProximas", facturasProximas);

            // 3. Próximas 5 Facturas (listado)
            String proximasFacturasSql = "SELECT proveedor, monto, vencimiento as \"fecha\" " +
                    "FROM cxp " +
                    "WHERE estatus != 'Pagado' AND estatus != 'Pagada' " +
                    "ORDER BY vencimiento ASC FETCH FIRST 5 ROWS ONLY";
            List<Map<String, Object>> proximasFacturas = jdbcTemplate.queryForList(proximasFacturasSql)
                    .stream().map(genericDataService::keysToLowerCase).collect(Collectors.toList());
            stats.put("proximasFacturas", proximasFacturas);

            // 4. Gastos por Mes (últimos 6 meses)
            String gastosMensualesSql = "SELECT TO_CHAR(fecha, 'Mon') as \"mes\", SUM(monto) as \"monto\" " +
                    "FROM pagos " +
                    "WHERE fecha >= SYSDATE - 180 " +
                    "GROUP BY TO_CHAR(fecha, 'Mon') " +
                    "ORDER BY MIN(fecha)";
            List<Map<String, Object>> gastosMensuales = jdbcTemplate.queryForList(gastosMensualesSql)
                    .stream().map(genericDataService::keysToLowerCase).collect(Collectors.toList());
            stats.put("gastosMensuales", gastosMensuales);

            // 5. Envejecimiento de Deuda (Aging)
            String agingSql = "SELECT " +
                    "  CASE " +
                    "    WHEN vencimiento - SYSDATE <= 30 THEN '0-30 días' " +
                    "    WHEN vencimiento - SYSDATE <= 60 THEN '31-60 días' " +
                    "    ELSE '+60 días' " +
                    "  END as \"rango\", " +
                    "  SUM(monto) as \"monto\" " +
                    "FROM cxp " +
                    "WHERE estatus != 'Pagado' AND estatus != 'Pagada' " +
                    "GROUP BY " +
                    "  CASE " +
                    "    WHEN vencimiento - SYSDATE <= 30 THEN '0-30 días' " +
                    "    WHEN vencimiento - SYSDATE <= 60 THEN '31-60 días' " +
                    "    ELSE '+60 días' " +
                    "  END";
            List<Map<String, Object>> aging = jdbcTemplate.queryForList(agingSql)
                    .stream().map(genericDataService::keysToLowerCase).collect(Collectors.toList());
            stats.put("aging", aging);

            // 6. Centros de Costo
            String centrosCostoSql = "SELECT centro_costo as \"name\", SUM(monto_estimado) as \"value\" " +
                    "FROM requerimientos " +
                    "GROUP BY centro_costo " +
                    "ORDER BY \"value\" DESC FETCH FIRST 4 ROWS ONLY";
            List<Map<String, Object>> centrosCosto = jdbcTemplate.queryForList(centrosCostoSql)
                    .stream().map(genericDataService::keysToLowerCase).collect(Collectors.toList());
            stats.put("centrosCosto", centrosCosto);

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error al obtener estadísticas: " + e.getMessage()));
        }
    }
}
