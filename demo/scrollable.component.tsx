import React from 'react'
import { withReactAdapter } from '@enhanced-dom/react'

import { ScrollableWebComponent, ScrollableWebComponentAttributes } from '../src'

declare interface ScrollableAttributes
  extends ScrollableWebComponentAttributes,
    Omit<React.DetailedHTMLProps<React.HTMLAttributes<ScrollableWebComponent>, ScrollableWebComponent>, 'class' | 'style'> {
  className?: string
  style?: React.CSSProperties
}

const Scrollable = withReactAdapter<
  ScrollableWebComponent,
  never[],
  typeof ScrollableWebComponent,
  ScrollableAttributes,
  never,
  'renderer' | 'scrollbarPositions' | 'cssVariables' | 'sectionIdentifiers'
>({
  type: ScrollableWebComponent,
  hoistedProps: ['renderer', 'scrollbarPositions', 'cssVariables', 'sectionIdentifiers'],
})

export default Scrollable
