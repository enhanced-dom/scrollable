import React, { useCallback, useRef, useState } from 'react'

import { ScrollableWebComponent } from '../src'
import { Scrollable } from './scrollable.component'
import * as styles from './app.pcss'

const App = () => {
  const [dimensions, setDimensions] = useState({ width: 3000, height: 3000 })
  const scrollableRef = useRef<ScrollableWebComponent>(null)
  const resetScroll = useCallback(() => {
    if (scrollableRef.current) {
      scrollableRef.current.scrollLeft = 0
      scrollableRef.current.scrollTop = 0
    }
  }, [scrollableRef])
  return (
    <>
      <div className={styles.container}>
        <Scrollable ref={scrollableRef} scrollbars={[Scrollable.scrollbarPositions.right, Scrollable.scrollbarPositions.bottom]}>
          <div
            style={{ ...dimensions, background: 'radial-gradient(circle, rgba(2,0,36,1) 0%, rgba(9,9,121,1) 35%, rgba(0,212,255,1) 100%)' }}
          />
        </Scrollable>
      </div>
      <button
        onClick={() => {
          setDimensions({ width: dimensions.width - 500, height: dimensions.height - 500 })
        }}
      >
        smaller
      </button>
      <button onClick={resetScroll}>reset scroll</button>
    </>
  )
}

export default App
