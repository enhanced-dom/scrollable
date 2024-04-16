import { WebcomponentRenderer, type IRenderingEngine } from '@enhanced-dom/webcomponent'
import { EventListenerTracker, type IAbstractNode } from '@enhanced-dom/dom'
import { STYLESHEET_ATTRIBUTE_NAME, StylesheetsRepository } from '@enhanced-dom/css'
import { ScrollbarWebComponent } from '@enhanced-dom/scrollbar'
import classNames from 'classnames'
import debounce from 'lodash.debounce'
import uniqueId from 'lodash.uniqueid'

import * as styles from './scrollable.webcomponent.pcss'
import { Parts } from './scrollable.selectors'

export enum ScrollbarPositions {
  RIGHT = 'right',
  BOTTOM = 'bottom',
}

export interface ScrollableWebComponentAttributes {
  scrollbars: ScrollbarPositions[]
  delegated?: Record<string, string | number | boolean>
}

export class ScrollableWebComponent extends HTMLElement {
  static get observedAttributes() {
    return ['scrollbars', 'delegated']
  }

  static cssVariables = {
    scrollableGap: styles.variablesScrollableGap,
    scrollbarThickness: styles.variablesScrollbarThickness,
  }
  static scrollbarPositions = ScrollbarPositions

  static tag = 'enhanced-dom-scrollable'
  static identifier = 'urn:enhanced-dom:scrollable'
  static parts = Parts
  static register = () => {
    if (!window.customElements.get(ScrollableWebComponent.tag)) {
      window.customElements.define(ScrollableWebComponent.tag, ScrollableWebComponent)
    }
    ScrollbarWebComponent.register()
  }

  static template = ({
    scrollbars,
    scrollTop,
    scrollLeft,
    containerId,
    delegated = {},
    ...rest
  }: Record<string, any> = {}): IAbstractNode[] => {
    const scrollbarNodes = []
    if (scrollbars?.includes(ScrollbarPositions.RIGHT)) {
      scrollbarNodes.push({
        tag: ScrollbarWebComponent.tag,
        attributes: {
          orientation: ScrollbarWebComponent.orientations.VERTICAL,
          for: containerId,
          value: scrollTop,
          class: styles.right,
          part: ScrollableWebComponent.parts.RIGHT_SCROLLBAR,
        },
      })
    }
    if (scrollbars?.includes(ScrollbarPositions.BOTTOM)) {
      scrollbarNodes.push({
        tag: ScrollbarWebComponent.tag,
        attributes: {
          orientation: ScrollbarWebComponent.orientations.HORIZONTAL,
          for: containerId,
          value: scrollLeft,
          class: styles.bottom,
          part: ScrollableWebComponent.parts.BOTTOM_SCROLLBAR,
        },
      })
    }

    return [
      {
        tag: 'style',
        attributes: {
          [STYLESHEET_ATTRIBUTE_NAME]: ScrollableWebComponent.tag,
        },
        children: [{ content: styles.css }],
        ignoreChildren: true,
      },
      {
        tag: 'div',
        attributes: {
          ...rest,
          ...delegated,
          class: classNames(styles.scrollable, delegated.class, {
            [styles.scrollableBottom]: scrollbars?.includes(ScrollbarPositions.BOTTOM) && scrollbars?.length === 1,
            [styles.scrollableRight]: scrollbars?.includes(ScrollbarPositions.RIGHT) && scrollbars?.length === 1,
            [styles.scrollableBoth]: scrollbars?.length === 2,
          }),
          part: ScrollableWebComponent.parts.WRAPPER,
        },
        children: [
          {
            tag: 'div',
            attributes: {
              class: styles.main,
              id: containerId,
              part: ScrollableWebComponent.parts.SCROLL_CONTAINER,
            },
            children: [
              {
                tag: 'div',
                attributes: {
                  class: styles.window,
                  part: ScrollableWebComponent.parts.SCROLL_SIZER,
                },
                children: [
                  {
                    tag: 'slot',
                  },
                ],
              },
            ],
          },
          ...scrollbarNodes,
        ],
      },
    ]
  }
  static renderer: IRenderingEngine = new WebcomponentRenderer('@enhanced-dom/ScrollableWebComponent', ScrollableWebComponent.template)
  private _attributes: Record<string, any> = {
    scrollbars: [],
    containerId: uniqueId(ScrollableWebComponent.identifier),
  }
  private _eventListenerTracker = new EventListenerTracker()
  private _stylesheetsRepository: StylesheetsRepository

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  private _removeEventListeners() {
    this._eventListenerTracker.unregister({ nodeLocator: this._findScrollContainer })
    this._eventListenerTracker.unregister({ nodeLocator: this._findRightScrollbar })
    this._eventListenerTracker.unregister({ nodeLocator: this._findBottomScrollbar })
  }

  private _addEventListeners = (activate?: boolean) => {
    this._removeEventListeners()
    this._eventListenerTracker.register({
      hook: (e: Element) => {
        const monitorScrollContainerScroll = (event) => {
          if (event.target === this._findScrollContainer()) {
            event.stopPropagation()
            if (this._findRightScrollbar()) {
              this._findRightScrollbar().value = this._findScrollContainer().scrollTop
            }
            if (this._findBottomScrollbar()) {
              this._findBottomScrollbar().value = this._findScrollContainer().scrollLeft
            }
            this.dispatchEvent(new Event('scroll'))
          }
        }
        e.addEventListener('scroll', monitorScrollContainerScroll)
        return (e1: Element) => {
          e1.removeEventListener('scroll', monitorScrollContainerScroll)
        }
      },
      nodeLocator: this._findScrollContainer,
    })
    if (this._attributes.scrollbars?.includes(ScrollbarPositions.RIGHT)) {
      this._eventListenerTracker.register({
        hook: (e: Element) => {
          const monitorRightScrollbarScroll = (event: UIEvent) => {
            if (event.target === this._findRightScrollbar()) {
              event.stopPropagation()
              this._findScrollContainer().scrollTop = this._findRightScrollbar().value
              this.dispatchEvent(new Event('scroll'))
            }
          }
          e.addEventListener('scroll', monitorRightScrollbarScroll)
          return (e1: Element) => {
            e1.removeEventListener('scroll', monitorRightScrollbarScroll)
          }
        },
        nodeLocator: this._findRightScrollbar,
      })
    }
    if (this._attributes.scrollbars?.includes(ScrollbarPositions.BOTTOM)) {
      this._eventListenerTracker.register({
        hook: (e: Element) => {
          const monitorBottomScrollbarScroll = (event: Event) => {
            if (event.target === this._findBottomScrollbar()) {
              event.stopPropagation()
              this._findScrollContainer().scrollLeft = this._findBottomScrollbar().value
              this.dispatchEvent(new Event('scroll'))
            }
          }
          e.addEventListener('scroll', monitorBottomScrollbarScroll)
          return (e1: Element) => {
            e1.removeEventListener('scroll', monitorBottomScrollbarScroll)
          }
        },
        nodeLocator: this._findBottomScrollbar,
      })
    }
    if (activate) {
      this._eventListenerTracker.refreshSubscriptions()
    }
  }

  private get $mainContentElement() {
    return this.shadowRoot.querySelector(`*::part(${ScrollableWebComponent.parts.SCROLL_SIZER})`)
  }

  private _findScrollContainer = () => {
    return this.shadowRoot.querySelector(`*::part(${ScrollableWebComponent.parts.SCROLL_CONTAINER})`)
  }

  private _findRightScrollbar = (): ScrollbarWebComponent => {
    return this.shadowRoot.querySelector(`*::part(${ScrollableWebComponent.parts.RIGHT_SCROLLBAR})`)
  }

  private _findBottomScrollbar = (): ScrollbarWebComponent => {
    return this.shadowRoot.querySelector(`*::part(${ScrollableWebComponent.parts.BOTTOM_SCROLLBAR})`)
  }

  private _scrollSizeObserver = new ResizeObserver((entries) => {
    this._stylesheetsRepository.setProperty(
      ScrollableWebComponent.tag,
      `.${styles.right}`,
      ScrollbarWebComponent.cssVariables.scrollSize,
      `${entries[0].target.scrollHeight}px`,
    )
    this._stylesheetsRepository.setProperty(
      ScrollableWebComponent.tag,
      `.${styles.bottom}`,
      ScrollbarWebComponent.cssVariables.scrollSize,
      `${entries[0].target.scrollWidth}px`,
    )
  })
  private _monitorScrollSize() {
    if (this.$mainContentElement) {
      this._scrollSizeObserver.disconnect()
      this._scrollSizeObserver.observe(this.$mainContentElement)
    }
  }

  render = debounce(
    () => {
      ScrollableWebComponent.renderer.render(this.shadowRoot, this._attributes)
      this._monitorScrollSize()
      this._eventListenerTracker.refreshSubscriptions()
    },
    10,
    { leading: false, trailing: true },
  )

  connectedCallback() {
    this._stylesheetsRepository = new StylesheetsRepository(this.shadowRoot, ScrollableWebComponent.tag)
    this._addEventListeners()
    this.render()
  }

  disconnectedCallback() {
    this.render.cancel()
    this._scrollSizeObserver.disconnect()
    this._removeEventListeners()
  }

  get scrollbars() {
    return JSON.parse(this.getAttribute('scrollbars'))
  }

  set scrollbars(value: ScrollbarPositions[] | string) {
    const parsedValue: ScrollbarPositions[] = typeof value === 'string' ? JSON.parse(value) : value
    this._attributes.scrollbars = parsedValue
    this.setAttribute('scrollbars', JSON.stringify(parsedValue))
    this._addEventListeners(true)
  }

  get scrollLeft(): number {
    return this._findScrollContainer().scrollLeft
  }

  set scrollLeft(newValue: number | string) {
    const numericScrollValue = typeof newValue === 'string' ? parseInt(newValue) : newValue
    this._findScrollContainer().scrollLeft = numericScrollValue
  }

  get scrollTop(): number {
    return this._findScrollContainer().scrollTop
  }

  set scrollTop(newValue: number | string) {
    const numericScrollValue = typeof newValue === 'string' ? parseInt(newValue) : newValue
    this._findScrollContainer().scrollTop = numericScrollValue
  }

  get delegated() {
    return this._attributes.delegated
  }
  set delegated(d: string | Record<string, string | number | boolean>) {
    if (typeof d === 'string') {
      this._attributes.delegated = JSON.parse(d)
    } else {
      this._attributes.delegated = d
    }
  }

  attributeChangedCallback(name: string, oldVal: string, newVal: string) {
    if (oldVal !== newVal) {
      switch (name) {
        case 'scrollbars':
          this.scrollbars = newVal
          break
        case 'delegated':
          this.delegated = newVal
          break
        default:
          this._attributes[name] = newVal
          break
      }
      this.render()
    }
  }
}
