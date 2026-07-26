import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'

import OtherToolsMenu from '@/components/layout/OtherToolsMenu.vue'

async function mountMenu() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/',
        component: { template: '<div>Home</div>' },
      },
      {
        path: '/special-messages/vh',
        component: { template: '<div>Message</div>' },
      },
      {
        path: '/tools/hexagrams',
        component: { template: '<div>Hexagrams</div>' },
      },
    ],
  })

  await router.push('/')
  await router.isReady()

  return mount(OtherToolsMenu, {
    props: {
      mode: 'desktop',
    },
    global: {
      plugins: [router],
    },
  })
}

describe('OtherToolsMenu', () => {
  it('opens a two-level Special Messages menu with the VH entry', async () => {
    const wrapper = await mountMenu()
    const trigger = wrapper.get('.tools-menu-trigger')

    expect(trigger.attributes('aria-expanded')).toBe('false')

    await trigger.trigger('click')

    expect(trigger.attributes('aria-expanded')).toBe('true')
    const hexagramLink = wrapper.get('a.hexagram-link')
    expect(hexagramLink.text()).toContain('Hexagram Library')
    expect(hexagramLink.attributes('href')).toBe('/tools/hexagrams')
    expect(wrapper.get('button.menu-item').text()).toContain('Special Messages')

    await wrapper.get('button.menu-item').trigger('click')

    const messageLink = wrapper.get('a.message-link')
    expect(messageLink.text()).toContain('VH')
    expect(messageLink.attributes('href')).toBe('/special-messages/vh')
  })

  it('closes when Escape is pressed', async () => {
    const wrapper = await mountMenu()

    await wrapper.get('.tools-menu-trigger').trigger('click')
    await wrapper.get('.other-tools-menu').trigger('keydown', { key: 'Escape' })

    expect(wrapper.get('.tools-menu-trigger').attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('.tools-popover').exists()).toBe(false)
  })
})
