/**
 * ArmySimulationService.js
 * Servicio independiente para manejar la lógica de fatiga y recuperación de ejércitos
 *
 * REGLAS DE NEGOCIO:
 * - Stamina: Cada unidad tiene stamina individual (0-100)
 * - Consumo: El movimiento consume stamina según el terreno
 * - Force Rest: Si stamina llega a 0, la unidad se marca como force_rest = TRUE
 * - Recuperación: +4 stamina por turno cuando el ejército no se mueve
 * - Liberación: Si stamina >= 25 y force_rest = TRUE, se libera (force_rest = FALSE)
 */

const pool = require('../db');
const { Logger } = require('../src/utils/logger');
const h3 = require('h3-js');

class ArmySimulationService {
  /**
   * Método auxiliar interno para consumir stamina con un client específico
   * @private
   */
  static async _consumeStaminaWithClient(client, armyId, terrainMovementCost) {
    // Obtener todas las unidades del ejército
    const troopsResult = await client.query(
      `SELECT troop_id, unit_type_id, quantity, stamina, force_rest
       FROM troops
       WHERE army_id = $1`,
      [armyId]
    );

    if (troopsResult.rows.length === 0) {
      Logger.army(armyId, 'ERROR', 'Ejército no tiene unidades');
      return {
        success: false,
        message: `Ejército no tiene unidades`,
        exhaustedUnits: 0
      };
    }

    // Calcular stamina mínima antes del consumo
    const minStaminaBefore = Math.min(...troopsResult.rows.map(t => t.stamina));

    let exhaustedCount = 0;
    let collapseCount = 0;

    // Actualizar stamina de cada unidad
    for (const troop of troopsResult.rows) {
      const newStamina = Math.max(0, troop.stamina - terrainMovementCost);
      const willBeExhausted = newStamina <= 0;

      await client.query(
        `UPDATE troops
         SET stamina = $1,
             force_rest = CASE WHEN $2 <= 0 THEN TRUE ELSE force_rest END
         WHERE troop_id = $3`,
        [newStamina, newStamina, troop.troop_id]
      );

      if (willBeExhausted && !troop.force_rest) {
        exhaustedCount++;
        collapseCount++;

        // Log individual de colapso por fatiga
        Logger.army(armyId, 'FATIGUE_COLLAPSE',
          `Troop ${troop.troop_id} (unit_type: ${troop.unit_type_id}) ¡Esfuerzo extra detectado! force_rest activado y stamina a 0`,
          { troop_id: troop.troop_id, unit_type_id: troop.unit_type_id, previous_stamina: troop.stamina }
        );
      }
    }

    // Calcular stamina mínima después del consumo
    const minStaminaAfter = Math.min(...troopsResult.rows.map(t => Math.max(0, t.stamina - terrainMovementCost)));

    // Log del consumo de stamina
    Logger.army(armyId, 'STAMINA_DECREASE',
      `Consumo de ${terrainMovementCost} puntos. Stamina mínima: ${minStaminaBefore} → ${minStaminaAfter}`,
      {
        cost: terrainMovementCost,
        min_stamina_before: minStaminaBefore,
        min_stamina_after: minStaminaAfter,
        exhausted_units: exhaustedCount,
        total_troops: troopsResult.rows.length
      }
    );

    return {
      success: true,
      exhaustedUnits: exhaustedCount
    };
  }

  /**
   * Consume stamina de todas las unidades de un ejército
   * @param {number} armyId - ID del ejército
   * @param {number} terrainMovementCost - Coste de movimiento del terreno (ej: 5, 10, 15)
   * @returns {Promise<Object>} - { success: boolean, message: string, exhaustedUnits?: number }
   */
  static async consumeStamina(armyId, terrainMovementCost) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Validar que el ejército existe
      const armyCheck = await client.query(
        'SELECT army_id, name FROM armies WHERE army_id = $1',
        [armyId]
      );

      if (armyCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        Logger.army(armyId, 'ERROR', 'Ejército no encontrado en BD');
        return {
          success: false,
          message: `Ejército ${armyId} no encontrado`
        };
      }

      const armyName = armyCheck.rows[0].name;

      // Delegar la lógica al helper interno
      const result = await this._consumeStaminaWithClient(client, armyId, terrainMovementCost);

      if (!result.success) {
        await client.query('ROLLBACK');
        return result;
      }

      await client.query('COMMIT');

      Logger.army(armyId, 'STAMINA_MANUAL_CONSUME',
        `Consumo manual de stamina. Coste: ${terrainMovementCost}. Unidades agotadas: ${result.exhaustedUnits}`,
        { army_name: armyName, cost: terrainMovementCost, exhausted_units: result.exhaustedUnits }
      );

      return {
        success: true,
        message: result.exhaustedUnits > 0
          ? `${result.exhaustedUnits} unidad(es) agotada(s) - Descanso forzado activado`
          : 'Stamina consumida correctamente',
        exhaustedUnits: result.exhaustedUnits
      };

    } catch (error) {
      await client.query('ROLLBACK');
      Logger.army(armyId, 'ERROR', `Error consumiendo stamina: ${error.message}`, { error: error.stack });
      Logger.error(error, { context: 'ArmySimulationService.consumeStamina', armyId });
      return {
        success: false,
        message: 'Error al consumir stamina del ejército',
        error: error.message
      };
    } finally {
      client.release();
    }
  }

  /**
   * Procesa la recuperación pasiva de stamina de todas las unidades de un ejército
   * Recupera +4 stamina por turno (máximo 100)
   * Libera unidades de force_rest si stamina >= 25
   *
   * @param {number} armyId - ID del ejército
   * @returns {Promise<Object>} - { success: boolean, message: string, releasedUnits?: number }
   */
  static async processPassiveRecovery(armyId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Validar que el ejército existe
      const armyCheck = await client.query(
        'SELECT army_id, name FROM armies WHERE army_id = $1',
        [armyId]
      );

      if (armyCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        Logger.army(armyId, 'ERROR', 'Ejército no encontrado');
        return {
          success: false,
          message: `Ejército ${armyId} no encontrado`
        };
      }

      const armyName = armyCheck.rows[0].name;

      // Obtener todas las unidades del ejército
      const troopsResult = await client.query(
        `SELECT troop_id, stamina, force_rest
         FROM troops
         WHERE army_id = $1`,
        [armyId]
      );

      if (troopsResult.rows.length === 0) {
        await client.query('ROLLBACK');
        Logger.army(armyId, 'ERROR', 'Ejército no tiene unidades');
        return {
          success: false,
          message: `Ejército ${armyName} no tiene unidades`
        };
      }

      let releasedCount = 0;
      const RECOVERY_RATE = 4;
      const RELEASE_THRESHOLD = 25;
      const MAX_STAMINA = 100;

      // Calcular stamina mínima antes de la recuperación
      const minStaminaBefore = Math.min(...troopsResult.rows.map(t => t.stamina));
      const unitsInForceRest = troopsResult.rows.filter(t => t.force_rest).length;

      // Procesar recuperación de cada unidad
      for (const troop of troopsResult.rows) {
        const newStamina = Math.min(MAX_STAMINA, troop.stamina + RECOVERY_RATE);
        const shouldRelease = troop.force_rest && newStamina >= RELEASE_THRESHOLD;

        await client.query(
          `UPDATE troops
           SET stamina = $1,
               force_rest = CASE WHEN force_rest = TRUE AND $2 >= $3 THEN FALSE ELSE force_rest END
           WHERE troop_id = $4`,
          [newStamina, newStamina, RELEASE_THRESHOLD, troop.troop_id]
        );

        if (shouldRelease) {
          releasedCount++;
          Logger.army(armyId, 'UNIT_RELEASED',
            `Troop ${troop.troop_id} liberado de force_rest (stamina: ${troop.stamina} → ${newStamina})`,
            { troop_id: troop.troop_id, stamina_before: troop.stamina, stamina_after: newStamina }
          );
        }
      }

      // Calcular stamina mínima después de la recuperación
      const minStaminaAfter = Math.min(MAX_STAMINA, minStaminaBefore + RECOVERY_RATE);

      await client.query('COMMIT');

      // Log de recuperación
      Logger.army(armyId, 'STAMINA_RECOVERY',
        `+${RECOVERY_RATE} puntos aplicados. Stamina mínima: ${minStaminaBefore} → ${minStaminaAfter}. Force_rest: ${unitsInForceRest - releasedCount}/${unitsInForceRest} unidades`,
        {
          army_name: armyName,
          recovery_rate: RECOVERY_RATE,
          min_stamina_before: minStaminaBefore,
          min_stamina_after: minStaminaAfter,
          units_released: releasedCount,
          units_still_resting: unitsInForceRest - releasedCount,
          total_units_resting: unitsInForceRest
        }
      );

      return {
        success: true,
        message: releasedCount > 0
          ? `Recuperación completada. ${releasedCount} unidad(es) lista(s) para moverse`
          : 'Recuperación completada',
        releasedUnits: releasedCount
      };

    } catch (error) {
      await client.query('ROLLBACK');
      Logger.army(armyId, 'ERROR', `Error procesando recuperación: ${error.message}`, { error: error.stack });
      Logger.error(error, { context: 'ArmySimulationService.processPassiveRecovery', armyId });
      return {
        success: false,
        message: 'Error al procesar recuperación del ejército',
        error: error.message
      };
    } finally {
      client.release();
    }
  }

  /**
   * Obtiene el estado de fatiga de un ejército (eslabón más débil)
   * @param {number} armyId - ID del ejército
   * @returns {Promise<Object>} - { minStamina, hasForceRest, totalUnits, exhaustedUnits }
   */
  static async getArmyFatigueStatus(armyId) {
    try {
      const result = await pool.query(
        `SELECT
          MIN(stamina) as min_stamina,
          COUNT(*) as total_units,
          SUM(CASE WHEN force_rest = TRUE THEN 1 ELSE 0 END) as exhausted_units,
          BOOL_OR(force_rest) as has_force_rest
         FROM troops
         WHERE army_id = $1`,
        [armyId]
      );

      if (result.rows.length === 0 || result.rows[0].total_units === null) {
        Logger.army(armyId, 'STATUS_QUERY', 'Ejército no tiene unidades');
        return {
          success: false,
          message: 'Ejército no tiene unidades'
        };
      }

      const status = result.rows[0];

      Logger.army(armyId, 'STATUS_QUERY',
        `Consulta de estado - Stamina mín: ${status.min_stamina}, Force_rest: ${status.exhausted_units}/${status.total_units}`,
        {
          min_stamina: parseFloat(status.min_stamina) || 0,
          has_force_rest: status.has_force_rest || false,
          total_units: parseInt(status.total_units) || 0,
          exhausted_units: parseInt(status.exhausted_units) || 0
        }
      );

      return {
        success: true,
        minStamina: parseFloat(status.min_stamina) || 0,
        hasForceRest: status.has_force_rest || false,
        totalUnits: parseInt(status.total_units) || 0,
        exhaustedUnits: parseInt(status.exhausted_units) || 0
      };

    } catch (error) {
      Logger.army(armyId, 'ERROR', `Error obteniendo estado de fatiga: ${error.message}`, { error: error.stack });
      Logger.error(error, { context: 'ArmySimulationService.getArmyFatigueStatus', armyId });
      return {
        success: false,
        message: 'Error al obtener estado de fatiga',
        error: error.message
      };
    }
  }

  /**
   * Verifica si un ejército puede moverse (no tiene force_rest activo)
   * @param {number} armyId - ID del ejército
   * @returns {Promise<boolean>} - true si puede moverse, false si está en descanso forzado
   */
  static async canArmyMove(armyId) {
    try {
      const result = await pool.query(
        `SELECT BOOL_OR(force_rest) as has_force_rest
         FROM troops
         WHERE army_id = $1`,
        [armyId]
      );

      if (result.rows.length === 0) {
        Logger.army(armyId, 'MOVE_CHECK', 'No tiene unidades - no puede moverse');
        return false;
      }

      const canMove = !result.rows[0].has_force_rest;
      Logger.army(armyId, 'MOVE_CHECK',
        canMove ? 'Puede moverse - no tiene force_rest' : 'Bloqueado - tiene force_rest activo',
        { can_move: canMove, has_force_rest: result.rows[0].has_force_rest }
      );

      return canMove;

    } catch (error) {
      Logger.army(armyId, 'ERROR', `Error verificando si puede moverse: ${error.message}`, { error: error.stack });
      Logger.error(error, { context: 'ArmySimulationService.canArmyMove', armyId });
      return false;
    }
  }

  /**
   * Ejecuta el turno de movimiento completo de un ejército.
   * Calcula PM desde la velocidad base de las unidades y mueve
   * al ejército tantos pasos como permitan los PM.
   *
   * @param {number} armyId - ID del ejército
   * @returns {Promise<Object>} - { success, moved, arrived, stepsCount, forceExhausted, message }
   */
  static async executeArmyTurn(armyId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Obtener estado del ejército
      const armyResult = await client.query(
        `SELECT army_id, name, h3_index, destination, recovering, player_id
         FROM armies WHERE army_id = $1`,
        [armyId]
      );

      if (armyResult.rows.length === 0) {
        await client.query('ROLLBACK');
        Logger.army(armyId, 'ERROR', 'Ejército no encontrado en BD');
        return { success: false, moved: false, message: `Ejército ${armyId} no encontrado` };
      }

      const army = armyResult.rows[0];

      // Sin destino → no hacer nada
      if (!army.destination) {
        await client.query('ROLLBACK');
        return { success: true, moved: false, message: `${army.name} no tiene destino` };
      }

      // En recovering → no puede moverse
      if (parseInt(army.recovering) > 0) {
        await client.query('ROLLBACK');
        Logger.army(armyId, 'MOVE_BLOCKED',
          `En recuperación (${army.recovering} turnos restantes)`,
          { recovering: army.recovering }
        );
        return { success: true, moved: false, message: `${army.name} se está recuperando` };
      }

      // ── PASO 1: Calcular Puntos de Movimiento ────────────────────────────────
      const troopsResult = await client.query(
        `SELECT t.troop_id, t.stamina, t.force_rest, ut.speed
         FROM troops t
         JOIN unit_types ut ON t.unit_type_id = ut.unit_type_id
         WHERE t.army_id = $1`,
        [armyId]
      );

      if (troopsResult.rows.length === 0) {
        await client.query('ROLLBACK');
        Logger.army(armyId, 'ERROR', 'Sin unidades');
        return { success: false, moved: false, message: `${army.name} no tiene unidades` };
      }

      const hasForceRest = troopsResult.rows.some(t => t.force_rest);
      const minSpeed     = Math.min(...troopsResult.rows.map(t => parseInt(t.speed) || 1));
      let pm             = hasForceRest ? 0 : minSpeed;

      Logger.army(armyId, 'TURN_START',
        `PM totales ${pm} (velocidad mínima: ${minSpeed}, force_rest: ${hasForceRest})`,
        { army_name: army.name, destination: army.destination, min_speed: minSpeed, pm_assigned: pm, has_force_rest: hasForceRest }
      );

      if (pm === 0) {
        await client.query('ROLLBACK');
        Logger.army(armyId, 'MOVE_BLOCKED', 'Sin PM - force_rest activo');
        return { success: true, moved: false, message: `${army.name} no puede moverse (force_rest activo)` };
      }

      // ── PASO 2: Bucle de Desplazamiento ──────────────────────────────────────
      let currentPos   = army.h3_index;
      const destination = army.destination;
      let stepsCount   = 0;
      let forceExhausted = false;

      while (pm > 0 && currentPos !== destination) {
        // Obtener vecinos y sus costes de terreno en una sola query
        const neighbors = h3.gridDisk(currentPos, 1).filter(hex => hex !== currentPos);

        const terrainResult = await client.query(
          `SELECT hm.h3_index, tt.movement_cost
           FROM h3_map hm
           JOIN terrain_types tt ON hm.terrain_type_id = tt.terrain_type_id
           WHERE hm.h3_index = ANY($1)`,
          [neighbors]
        );

        // Construir mapa de coste por hexágono
        const costMap = {};
        for (const row of terrainResult.rows) {
          costMap[row.h3_index] = parseFloat(row.movement_cost);
        }

        // Seleccionar vecino más cercano al destino que NO sea impassable
        let closestNeighbor   = null;
        let neighborCost      = 0;
        let minDist           = Infinity;

        for (const neighbor of neighbors) {
          const rawCost = costMap[neighbor];
          if (rawCost === undefined || rawCost < 0) continue; // fuera del mapa o impassable

          const cost = Math.max(1, rawCost); // Mínimo 1 para evitar bucle infinito

          const dist = h3.gridDistance(neighbor, destination);
          if (dist < minDist) {
            minDist         = dist;
            closestNeighbor = neighbor;
            neighborCost    = cost;
          }
        }

        if (!closestNeighbor) {
          Logger.army(armyId, 'MOVE_BLOCKED', `Sin vecinos accesibles desde ${currentPos}`);
          break; // Bloqueado por terreno
        }

        // ── Regla de Avance ───────────────────────────────────────────────────
        if (pm >= neighborCost) {
          // Paso normal: restar coste a PM y a stamina
          pm -= neighborCost;

          await this._consumeStaminaWithClient(client, armyId, neighborCost);

        } else {
          // Esfuerzo extra: PM insuficiente pero el ejército fuerza el paso
          forceExhausted = true;
          const pmBeforeExhaustion = pm;
          pm = 0;

          // Todas las unidades quedan a stamina 0 con force_rest
          await client.query(
            `UPDATE troops SET stamina = 0, force_rest = TRUE WHERE army_id = $1`,
            [armyId]
          );
          // Periodo de recuperación obligatorio
          await client.query(
            `UPDATE armies SET recovering = 1 WHERE army_id = $1`,
            [armyId]
          );

          Logger.army(armyId, 'FATIGUE_COLLAPSE',
            `¡Esfuerzo extra! PM insuficientes (${pmBeforeExhaustion} PM disponibles, coste ${neighborCost}). force_rest activado en todas las unidades. recovering = 1`,
            { pm_available: pmBeforeExhaustion, terrain_cost: neighborCost }
          );
        }

        // Mover el ejército al siguiente hexágono
        const prevPos = currentPos;
        currentPos = closestNeighbor;
        await client.query(
          `UPDATE armies SET h3_index = $1 WHERE army_id = $2`,
          [currentPos, armyId]
        );
        stepsCount++;

        Logger.army(armyId, 'STEP',
          `De ${prevPos} a ${closestNeighbor}. PM restantes: ${pm}`,
          { from: prevPos, to: closestNeighbor, pm_remaining: pm, terrain_cost: neighborCost, step: stepsCount }
        );

        if (forceExhausted) break; // No seguir tras agotamiento total
      }

      // ── Verificar si llegó al destino ─────────────────────────────────────
      const arrived = currentPos === destination;
      if (arrived) {
        await client.query(
          'UPDATE armies SET destination = NULL WHERE army_id = $1',
          [armyId]
        );
        Logger.army(armyId, 'MOVE_ARRIVED',
          `Llegó a su destino ${destination} en ${stepsCount} pasos`,
          { destination, steps: stepsCount }
        );
      }

      await client.query('COMMIT');

      Logger.army(armyId, 'TURN_END',
        `Turno completado. Pasos: ${stepsCount}, Llegó: ${arrived}, Agotado: ${forceExhausted}`,
        { steps: stepsCount, arrived, force_exhausted: forceExhausted, final_pos: currentPos }
      );

      return {
        success: true,
        moved: stepsCount > 0,
        arrived,
        stepsCount,
        forceExhausted,
        message: arrived
          ? `${army.name} llegó a su destino`
          : `${army.name} avanzó ${stepsCount} pasos`
      };

    } catch (error) {
      await client.query('ROLLBACK');
      Logger.army(armyId, 'ERROR',
        `Error en executeArmyTurn: ${error.message}`,
        { error: error.stack }
      );
      Logger.error(error, { context: 'ArmySimulationService.executeArmyTurn', armyId });
      return { success: false, moved: false, message: error.message };
    } finally {
      client.release();
    }
  }

  /**
   * Procesa un paso de movimiento automático para un ejército con destino
   * @deprecated Usar executeArmyTurn en su lugar
   * @param {number} armyId - ID del ejército
   * @returns {Promise<Object>} - { success, moved, arrived, message }
   */
  static async processMovementStep(armyId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Obtener estado del ejército
      const armyResult = await client.query(
        `SELECT
          a.army_id, a.name, a.h3_index, a.destination, a.recovering,
          a.movement_points, a.player_id
         FROM armies a
         WHERE a.army_id = $1`,
        [armyId]
      );

      if (armyResult.rows.length === 0) {
        await client.query('ROLLBACK');
        Logger.army(armyId, 'ERROR', 'Ejército no encontrado en BD');
        return {
          success: false,
          moved: false,
          message: `Ejército ${armyId} no encontrado`
        };
      }

      const army = armyResult.rows[0];

      // Log de inicio de movimiento
      if (army.destination) {
        Logger.army(armyId, 'MOVE_START',
          `Destino: ${army.destination}, PM iniciales: ${army.movement_points}`,
          {
            army_name: army.name,
            current_pos: army.h3_index,
            destination: army.destination,
            movement_points: army.movement_points,
            recovering: army.recovering
          }
        );
      }

      // 2. Verificaciones previas
      // Si no tiene destino, no hacer nada
      if (!army.destination || army.destination === null) {
        await client.query('ROLLBACK');
        Logger.army(armyId, 'MOVE_SKIP', 'No tiene destino asignado');
        return {
          success: true,
          moved: false,
          message: `Ejército ${army.name} no tiene destino`
        };
      }

      // Si está en recovering, no puede moverse
      if (army.recovering && parseInt(army.recovering) > 0) {
        await client.query('ROLLBACK');
        Logger.army(armyId, 'MOVE_BLOCKED',
          `Se está recuperando (${army.recovering} turnos restantes)`,
          { recovering_turns: army.recovering }
        );
        return {
          success: true,
          moved: false,
          message: `Ejército ${army.name} se está recuperando (${army.recovering} turnos)`
        };
      }

      // Si tiene force_rest, no puede moverse
      const canMove = await this.canArmyMove(armyId);
      if (!canMove) {
        await client.query('ROLLBACK');
        Logger.army(armyId, 'MOVE_BLOCKED', 'Unidades agotadas - force_rest activo');
        return {
          success: true,
          moved: false,
          message: `Ejército ${army.name} tiene unidades agotadas y debe descansar`
        };
      }

      // 3. Verificar si ya llegó al destino
      if (army.h3_index === army.destination) {
        // Llegó al destino, limpiar destination
        await client.query(
          'UPDATE armies SET destination = NULL WHERE army_id = $1',
          [armyId]
        );
        await client.query('COMMIT');

        Logger.army(armyId, 'MOVE_ARRIVED',
          `Llegó a su destino ${army.destination}`,
          { destination: army.destination, army_name: army.name }
        );

        return {
          success: true,
          moved: false,
          arrived: true,
          message: `${army.name} ha llegado a su destino`
        };
      }

      // 4. Calcular siguiente paso (vecino más cercano al destino)
      const currentPos = army.h3_index;
      const destination = army.destination;

      // Obtener vecinos del hexágono actual (radio 1)
      const neighbors = h3.gridDisk(currentPos, 1).filter(hex => hex !== currentPos);

      if (neighbors.length === 0) {
        await client.query('ROLLBACK');
        Logger.army(armyId, 'ERROR', `No se pudieron calcular vecinos para ${currentPos}`);
        return {
          success: false,
          moved: false,
          message: `No se pudieron calcular vecinos para ${currentPos}`
        };
      }

      // Encontrar el vecino más cercano al destino
      let closestNeighbor = neighbors[0];
      let minDistance = h3.gridDistance(neighbors[0], destination);

      for (const neighbor of neighbors) {
        const distance = h3.gridDistance(neighbor, destination);
        if (distance < minDistance) {
          minDistance = distance;
          closestNeighbor = neighbor;
        }
      }

      // 5. Calcular coste de movimiento (por ahora fijo, TODO: obtener del terreno)
      const MOVEMENT_COST_PER_HEX = 10; // Coste base de stamina
      const MOVEMENT_COST_PM = 1; // Coste en puntos de movimiento

      // 6. Verificar si tiene puntos de movimiento
      const currentPM = parseFloat(army.movement_points) || 0;

      if (currentPM < MOVEMENT_COST_PM) {
        // No tiene PM suficientes, no puede moverse este turno
        await client.query('ROLLBACK');
        Logger.army(armyId, 'MOVE_BLOCKED',
          `PM insuficientes (${currentPM}/${MOVEMENT_COST_PM})`,
          { current_pm: currentPM, required_pm: MOVEMENT_COST_PM }
        );
        return {
          success: true,
          moved: false,
          message: `${army.name} no tiene puntos de movimiento suficientes (${currentPM}/${MOVEMENT_COST_PM})`
        };
      }

      // Log del cálculo de paso
      Logger.army(armyId, 'MOVE_STEP',
        `De ${currentPos} a ${closestNeighbor}. Coste terreno: ${MOVEMENT_COST_PER_HEX}. PM restantes: ${currentPM - MOVEMENT_COST_PM}`,
        {
          from: currentPos,
          to: closestNeighbor,
          destination: destination,
          distance_to_destination: minDistance,
          terrain_cost: MOVEMENT_COST_PER_HEX,
          pm_cost: MOVEMENT_COST_PM,
          pm_before: currentPM,
          pm_after: currentPM - MOVEMENT_COST_PM
        }
      );

      // 7. Consumir stamina de todas las unidades (usar helper interno para evitar nested transactions)
      const staminaResult = await this._consumeStaminaWithClient(client, armyId, MOVEMENT_COST_PER_HEX);

      if (!staminaResult.success) {
        await client.query('ROLLBACK');
        return {
          success: false,
          moved: false,
          message: `Error al consumir stamina: ${staminaResult.message}`
        };
      }

      // 8. Mover el ejército al siguiente hexágono
      const newPM = Math.max(0, currentPM - MOVEMENT_COST_PM);

      await client.query(
        `UPDATE armies
         SET h3_index = $1,
             movement_points = $2
         WHERE army_id = $3`,
        [closestNeighbor, newPM, armyId]
      );

      await client.query('COMMIT');

      // Log final de movimiento exitoso
      Logger.army(armyId, 'MOVE_SUCCESS',
        `Movido de ${currentPos} → ${closestNeighbor}. PM: ${currentPM} → ${newPM}. Unidades agotadas: ${staminaResult.exhaustedUnits || 0}`,
        {
          army_name: army.name,
          from: currentPos,
          to: closestNeighbor,
          pm_before: currentPM,
          pm_after: newPM,
          stamina_consumed: MOVEMENT_COST_PER_HEX,
          exhausted_units: staminaResult.exhaustedUnits || 0,
          destination: army.destination,
          distance_remaining: minDistance
        }
      );

      return {
        success: true,
        moved: true,
        arrived: false,
        message: `${army.name} se movió de ${currentPos} a ${closestNeighbor}`,
        data: {
          from: currentPos,
          to: closestNeighbor,
          remaining_pm: newPM,
          stamina_consumed: MOVEMENT_COST_PER_HEX,
          exhausted_units: staminaResult.exhaustedUnits || 0
        }
      };

    } catch (error) {
      await client.query('ROLLBACK');
      Logger.army(armyId, 'ERROR',
        `Error procesando paso de movimiento: ${error.message}`,
        { error: error.stack }
      );
      Logger.error(error, {
        context: 'ArmySimulationService.processMovementStep',
        armyId
      });
      return {
        success: false,
        moved: false,
        message: 'Error al procesar movimiento del ejército',
        error: error.message
      };
    } finally {
      client.release();
    }
  }
}

module.exports = ArmySimulationService;
