import { useCallback, useRef } from 'react'
import { StandaloneKlineApp } from './KlineContent'
import type { ClientContext } from './host-services'

/** Slot the paper-trading panel declares for the full chart. */
const PAPER_KLINE_SLOT = 'paperTrading.kline'

/**
 * Embeddable K-line workspace for the paper-trading panel.
 *
 * The host declares the `paperTrading.kline` slot and passes the selected
 * symbol plus an identity callback. dsh_kline owns the chart, its data source
 * and the in-chart search; selecting an instrument there updates the paper
 * ticket through `onIdentity`.
 */
export function PaperKlinePanel({ symbol, onIdentity }: {
  symbol?: string
  onIdentity?: (symbol?: string, name?: string) => void
}) {
  // The host may hand over a fresh callback per render; keep the chart's effect
  // dependencies stable through a ref so a re-render never remounts it.
  const identity = useRef(onIdentity)
  identity.current = onIdentity
  const publishIdentity = useCallback((nextSymbol?: string, name?: string) => {
    identity.current?.(nextSymbol, name)
  }, [])

  return (
    <div className="dsh-kline-paper-panel" data-symbol={symbol ?? ''} style={{ width: '100%', height: '100%', minHeight: 360 }}>
      <StandaloneKlineApp
        conversationId="paper-trading"
        embedded
        // The rail keeps the symbol search (the chart owns it) and drops the
        // rest of the workspace, which belongs to the sidebar.
        chrome="chart-search"
        symbol={symbol}
        onIdentity={publishIdentity}
      />
    </div>
  )
}

/** Fill the paper-trading chart slot, only when the host declares it. */
export function registerPaperTradingHost(ctx: ClientContext): void {
  ctx.inject(['slots'], scope => {
    const slots = scope.slots
    if (slots === undefined) return
    slots.inject(PAPER_KLINE_SLOT, () => slots.register(
      { name: PAPER_KLINE_SLOT },
      PaperKlinePanel,
    ))
  })
}
