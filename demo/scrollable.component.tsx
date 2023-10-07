import React from 'react'
import { withReactAdapter } from '@enhanced-dom/react'

import { ScrollableWebComponent, ScrollableWebComponentAttributes } from '../src'

declare type ScrollableComponentProps = ScrollableWebComponentAttributes &
  React.DetailedHTMLProps<React.HTMLAttributes<ScrollableWebComponent>, ScrollableWebComponent>

export const Scrollable = withReactAdapter<
  ScrollableWebComponent,
  never[],
  typeof ScrollableWebComponent,
  ScrollableComponentProps,
  never,
  'renderer' | 'scrollbarPositions' | 'cssVariables' | 'sectionIdentifiers'
>({
  type: ScrollableWebComponent,
  hoistedProps: ['renderer', 'scrollbarPositions', 'cssVariables', 'sectionIdentifiers'],
})
