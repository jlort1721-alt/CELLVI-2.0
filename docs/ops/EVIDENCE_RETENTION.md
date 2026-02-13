# Política de Retención de Evidencia de Auditoría

Esta política define los periodos de almacenamiento, acceso y disposición final de la evidencia forense generada por CELLVI 2.0.

## 1. Alcance (Scope)
Aplica a:
*   Paquetes de Evidencia (Evidence Packs).
*   Reportes de SLO.
*   Logs de Auditoría (DB).
*   Backups de Base de Datos.

## 2. Periodos de Retención (SLA)

| Tipo de Evidencia | Retención Mínima | Ubicación Primaria | Almacenamiento en Frío |
| :--- | :---: | :--- | :--- |
| **Evidence Pack (ZIP)** | 5 Años | S3 Infrequent Access | Glacier (Year 2+) |
| **Audit Logs (DB)** | 12 Meses | PostgreSQL (Particionado) | S3 Parquet (Post-dump) |
| **SLO Reports** | 24 Meses | PostgreSQL (`slo_reports`) | N/A |
| **Backups Diarios** | 30 Días | S3 Standard | N/A |
| **Backups Mensuales** | 12 Meses | S3 IA | Glacier |

## 3. Control de Acceso
*   **Lectura:** Exclusivo para Roles: `auditor`, `cto`, `compliance_officer`.
*   **Escritura:** Solo procesos automatizados (`system`) o `ops_lead` durante Drill.
*   **Borrado:** Prohibido antes del vencimiento. Requiere aprobación dual para purga manual.

## 4. Disposición Final
Al cumplir el periodo de retención, los datos deben ser eliminados de forma segura (Crypto-shredding o borrado lógico verificable), salvo que exista una orden legal de preservación ("Legal Hold").
