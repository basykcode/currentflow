import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { defineComponent, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { alchemyChildRoutes } from '../alchemy.routes'
import AlchemyShell from '../components/AlchemyShell.vue'
import type { AlchemyProvider } from '../domain/provider'
import { ContractUnavailableAlchemyProvider } from '../providers/contractUnavailableAlchemyProvider'
import { DemoAlchemyProvider } from '../providers/demoAlchemyProvider'
import { installAlchemyProvider } from '../providers/providerInjection'
import { useAlchemyWorkbenchStore } from '../stores/workbench'

const Host = defineComponent({ template: '<RouterView />' })
const ShellRoute = defineComponent({ render: () => h(AlchemyShell) })

const mountAlchemy = async (path: string, provider: AlchemyProvider) => {
  const pinia = createPinia()
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/alchemy',
        component: ShellRoute,
        children: [...alchemyChildRoutes],
      },
    ],
  })
  await router.push(path)
  await router.isReady()
  const wrapper = mount(Host, {
    global: {
      plugins: [
        pinia,
        router,
        {
          install(app) {
            installAlchemyProvider(app, provider)
          },
        },
      ],
    },
  })
  await new Promise((resolve) => window.setTimeout(resolve, 10))
  await flushPromises()
  return { wrapper, router, pinia }
}

describe('Alchemy routes and shell', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows the active demo mode and keyboard-usable internal navigation', async () => {
    const { wrapper } = await mountAlchemy('/alchemy/materia-medica', new DemoAlchemyProvider(0))

    expect(wrapper.text()).toContain('Synthetic demo data')
    expect(wrapper.text()).toContain('Research and educational information only')
    expect(wrapper.find('nav[aria-label="Alchemy sections"]').findAll('a')).toHaveLength(5)
    expect(wrapper.find('#materia-search').attributes('type')).toBe('search')
  })

  it('loads a directly addressed herb record with conflicts and citations', async () => {
    const { wrapper } = await mountAlchemy(
      '/alchemy/materia-medica/demo:herb:root-a',
      new DemoAlchemyProvider(0),
    )

    expect(wrapper.text()).toContain('Demo Root A')
    expect(wrapper.text()).toContain('Conflicting sources remain visible')
    expect(wrapper.text()).toContain('Synthetic Materia Index')
    expect(wrapper.text()).toContain('Entity relationships')
  })

  it('synchronizes debounced material search into the URL', async () => {
    const { wrapper, router } = await mountAlchemy(
      '/alchemy/materia-medica',
      new DemoAlchemyProvider(0),
    )
    await wrapper.find('#materia-search').setValue('Seed B')
    await new Promise((resolve) => window.setTimeout(resolve, 330))
    await flushPromises()

    expect(router.currentRoute.value.query['q']).toBe('Seed B')
    expect(wrapper.text()).toContain('Demo Seed B')
  })

  it('shows API-unavailable mode without synthetic fallback', async () => {
    const { wrapper } = await mountAlchemy(
      '/alchemy/materia-medica',
      new ContractUnavailableAlchemyProvider(),
    )

    expect(wrapper.text()).toContain('Alchemy API not configured')
    expect(wrapper.text()).toContain('API mode is selected')
    expect(wrapper.text()).not.toContain('Demo Root A')
  })

  it('loads a directly addressed formula into an independent local draft', async () => {
    const provider = new DemoAlchemyProvider(0)
    const source = await provider.getFormula('demo:formula:one')
    const sourceBefore = structuredClone(source)
    const { wrapper, pinia } = await mountAlchemy('/alchemy/formulas/demo:formula:one', provider)

    expect(wrapper.text()).toContain('Demo Formula One')
    expect(wrapper.text()).toContain('Source variants')
    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Load into Workbench'))
      ?.trigger('click')

    const workbench = useAlchemyWorkbenchStore(pinia)
    expect(workbench.drafts).toHaveLength(1)
    expect(workbench.activeDraft?.sourceFormulaId).toBe(source.id)
    const line = workbench.activeDraft?.ingredients[0]
    if (line && workbench.activeDraft) {
      workbench.updateIngredient(workbench.activeDraft.id, line.id, { amountText: '99' })
    }
    expect(source).toEqual(sourceBefore)
  })

  it('renders provider analysis and comparison versions for valid local formulas', async () => {
    const provider = new DemoAlchemyProvider(0)
    const { wrapper, pinia } = await mountAlchemy('/alchemy/workbench', provider)
    const workbench = useAlchemyWorkbenchStore(pinia)
    workbench.importFormula(await provider.getFormula('demo:formula:one'))
    workbench.importFormula(await provider.getFormula('demo:formula:two'))
    await flushPromises()

    const analyzeButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Analyze current formula'))
    expect(analyzeButton?.attributes('disabled')).toBeUndefined()
    await analyzeButton?.trigger('click')
    await new Promise((resolve) => window.setTimeout(resolve, 10))
    await flushPromises()
    expect(wrapper.text()).toContain('demo-analysis-1.0')

    const compareButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Compare open formulas'))
    expect(compareButton?.attributes('disabled')).toBeUndefined()
    await compareButton?.trigger('click')
    await new Promise((resolve) => window.setTimeout(resolve, 10))
    await flushPromises()
    expect(wrapper.text()).toContain('demo-comparison-1.0')
    expect(wrapper.text()).toContain('does not express clinical similarity')
  })

  it('prepares selected source passages without creating an AI response', async () => {
    const { wrapper } = await mountAlchemy('/alchemy/texts', new DemoAlchemyProvider(0))
    const passageSelections = wrapper.findAll('input[type="checkbox"]')
    expect(passageSelections.length).toBeGreaterThanOrEqual(2)
    await passageSelections[0]?.setValue(true)
    await passageSelections[1]?.setValue(true)

    const prepareButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Prepare research context'))
    expect(prepareButton?.attributes('disabled')).toBeUndefined()
    await prepareButton?.trigger('click')
    await new Promise((resolve) => window.setTimeout(resolve, 10))
    await flushPromises()

    expect(wrapper.text()).toContain('Selected passages')
    expect(wrapper.text()).toContain('Unresolved ambiguities')
    expect(wrapper.text()).toContain('No AI model receives this data')
    expect(wrapper.find('[data-testid="assistant-response"]').exists()).toBe(false)
  })

  it('keeps Guided Inquiry disabled without creating a fake answer', async () => {
    const { wrapper } = await mountAlchemy('/alchemy/inquiry', new DemoAlchemyProvider(0))

    expect(wrapper.text()).toContain('Model not connected')
    expect(wrapper.find('#inquiry-composer').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('No external AI request or synthetic response')
    expect(wrapper.find('[data-testid="assistant-response"]').exists()).toBe(false)
  })
})
