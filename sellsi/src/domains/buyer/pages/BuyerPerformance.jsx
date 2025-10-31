import React from 'react'
import { MarketplaceBuyer } from './index'

// Compatibility stub: BuyerPerformance was removed during refactor.
// Some tests and legacy imports still reference it. Re-export MarketplaceBuyer
// so routes and tests that expect BuyerPerformance continue to work.
export default function BuyerPerformance(props) {
  return <MarketplaceBuyer {...props} />
}
