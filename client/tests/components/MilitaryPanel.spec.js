import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MilitaryPanel from '@/components/MilitaryPanel.vue'

describe('MilitaryPanel.vue', () => {
  const dummyFief = {
    h3_index: '123',
    name: 'Castillo Prueba',
    wood: 100,
    stone: 100,
    iron: 100
  }

  const dummyUnits = [
    {
      unit_type_id: 1,
      name: 'Milicia',
      attack: 10,
      health_points: 50,
      speed: 1,
      descrip: 'Campesinos armados.',
      gold_upkeep: 2,
      requirements: [
        { resource_type: 'gold', amount: 10 }
      ],
      culture_id: 1
    },
    {
      unit_type_id: 2,
      name: 'Caballero',
      attack: 50,
      health_points: 200,
      speed: 3,
      descrip: 'Elite de caballería.',
      gold_upkeep: 15,
      requirements: [
        { resource_type: 'gold', amount: 100 },
        { resource_type: 'iron_stored', amount: 50 } 
      ],
      culture_id: 1
    }
  ]

  it('renderiza mensaje vacío si no hay feudo (fief es null)', () => {
    const wrapper = mount(MilitaryPanel, {
      props: {
        fief: null,
        unitTypes: dummyUnits,
        playerGold: 500
      }
    })

    expect(wrapper.text()).toContain('Debes seleccionar un feudo desde la tabla')
    expect(wrapper.find('.unit-types-grid').exists()).toBe(false)
  })

  it('renderiza el nombre del feudo y los modos de reclutamiento cuando hay feudo', () => {
    const wrapper = mount(MilitaryPanel, {
      props: {
        fief: dummyFief,
        unitTypes: dummyUnits,
        playerGold: 500,
        playerCultureId: 1
      }
    })

    // Debe mostrar el título del feudo
    expect(wrapper.text()).toContain('Castillo Prueba')
    // Deben existir los botones de modo
    expect(wrapper.text()).toContain('Incorporar al Ejército')
    expect(wrapper.text()).toContain('Acuartelar')
    
    // Deberían mostrarse las dos unidades
    const unitCards = wrapper.findAll('.unit-card')
    expect(unitCards.length).toBe(2)
    expect(unitCards[0].text()).toContain('Milicia')
    expect(unitCards[1].text()).toContain('Caballero')
  })

  it('deshabilita el botón + si el jugador no tiene suficientes recursos', async () => {
    const wrapper = mount(MilitaryPanel, {
      props: {
        fief: { ...dummyFief, iron: 0 }, // Cero hierro para fallar compra del caballero
        unitTypes: dummyUnits,
        playerGold: 1000,
        playerCultureId: 1
      }
    })

    const unitCards = wrapper.findAll('.unit-card')
    
    // Milicia: oro 10. Jugador tiene 1000. Debe poder incrementarse.
    const militiaPlusBtn = unitCards[0].find('.quantity-selector button:last-child')
    expect(militiaPlusBtn.attributes('disabled')).toBeUndefined()

    // Caballero: iron 50. Feudo tiene iron 0. Debe estar deshabilitado.
    const knightPlusBtn = unitCards[1].find('.quantity-selector button:last-child')
    expect(knightPlusBtn.attributes('disabled')).toBeDefined()
  })

  it('emite el evento bulkRecruit con los datos correctos al reclutar', async () => {
    const wrapper = mount(MilitaryPanel, {
      props: {
        fief: dummyFief,
        unitTypes: dummyUnits,
        playerGold: 500,
        playerCultureId: 1,
        armyCount: 0,
        armyLimit: 2
      }
    })

    // Añadir 2 Milicias (clicks al botón + de milicia)
    const militiaPlusBtn = wrapper.findAll('.unit-card')[0].find('.quantity-selector button:last-child')
    await militiaPlusBtn.trigger('click')
    await militiaPlusBtn.trigger('click')

    // Poner un nombre al ejército
    const nameInput = wrapper.find('.army-name-section input')
    await nameInput.setValue('Ejército de Luz')

    // Click en Reclutar Lote
    const recruitBtn = wrapper.find('.btn-recruit')
    expect(recruitBtn.attributes('disabled')).toBeUndefined()
    await recruitBtn.trigger('click')

    // Verificar emisión del evento
    expect(wrapper.emitted()).toHaveProperty('bulkRecruit')
    const eventPayload = wrapper.emitted().bulkRecruit[0][0]
    
    expect(eventPayload).toEqual({
      fief: dummyFief,
      army_name: 'Ejército de Luz',
      units: [
        { unit_type_id: 1, quantity: 2 }
      ],
      mode: 'field'
    })
  })
})
