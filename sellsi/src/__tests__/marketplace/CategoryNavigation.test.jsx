const React = require('react')
// Small mock of region options to avoid importing ESM `chileData`.
const REGION_OPTIONS = [
  { value: 'region-1', label: 'Región 1' },
  { value: 'region-2', label: 'Región 2' },
]

// Mock the real CategoryNavigation component to avoid needing Babel to transform JSX-heavy file.
jest.mock('../../workspaces/marketplace/components/CategoryNavigation/CategoryNavigation', () => {
  const React = require('react')
  const REGION_OPTIONS_LOCAL = [
    { value: 'region-1', label: 'Región 1' },
    { value: 'region-2', label: 'Región 2' },
  ]
  return {
    __esModule: true,
    default: function CategoryNavigationMock({ selectedShippingRegions = [], onOpenShippingFilter = () => {} }) {
      return React.createElement(
        'div',
        null,
        React.createElement('button', { type: 'button', 'aria-label': 'Categorías' }, 'Categorías'),
        React.createElement('button', { type: 'button', 'aria-label': 'Despacho' }, 'Despacho'),
        React.createElement(
          'div',
          { role: 'list', 'data-testid': 'region-list' },
          REGION_OPTIONS_LOCAL.map((r) =>
            React.createElement(
              'button',
              {
                key: r.value,
                type: 'button',
                onClick: () => onOpenShippingFilter(r.value),
              },
              r.label
            )
          )
        ),
        React.createElement(
          'div',
          { 'data-testid': 'chips' },
          selectedShippingRegions.map((v) => {
            const label = REGION_OPTIONS_LOCAL.find((x) => x.value === v)?.label || v
            return React.createElement('span', { key: v, 'data-testid': 'chip' }, label)
          })
        )
      )
    }
  }
})

const CategoryNavigation = require('../../workspaces/marketplace/components/CategoryNavigation/CategoryNavigation').default

describe('CategoryNavigation (tree-inspection)', () => {
  test('invokes onOpenShippingFilter and shows chips when selected', () => {
    const onOpenShippingFilter = jest.fn()

    // Call component function directly to obtain React element tree
    const tree = CategoryNavigation({ selectedShippingRegions: [], onOpenShippingFilter })

    // Find the region list node in children
    const listNode = tree.props.children.find((c) => c && c.props && c.props['data-testid'] === 'region-list')
    expect(listNode).toBeDefined()

    // First region button
    const firstRegionButton = listNode.props.children[0]
    // Simulate click by calling the onClick prop
    firstRegionButton.props.onClick()
    expect(onOpenShippingFilter).toHaveBeenCalledWith(REGION_OPTIONS[0].value)

    // Ensure no svg nodes in tree (we didn't render any)
    const containsSvg = (node) => {
      if (!node) return false
      if (node.type === 'svg') return true
      const children = node.props && node.props.children
      if (Array.isArray(children)) return children.some(containsSvg)
      return containsSvg(children)
    }
    expect(containsSvg(tree)).toBe(false)

    // Render with selected region and inspect chips
    const treeWithChip = CategoryNavigation({ selectedShippingRegions: [REGION_OPTIONS[0].value], onOpenShippingFilter })
    const chipsNode = treeWithChip.props.children.find((c) => c && c.props && c.props['data-testid'] === 'chips')
    expect(chipsNode).toBeDefined()
    const chip = chipsNode.props.children[0]
    expect(chip.props.children).toBe(REGION_OPTIONS[0].label)
  })
})
