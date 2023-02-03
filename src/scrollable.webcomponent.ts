import { WebcomponentRenderer, IRenderingEngine } from '@enhanced-dom/webcomponent'
import { EventListenerTracker, SECTION_ID } from '@enhanced-dom/dom'
import { STYLESHEET_ATTRIBUTE_NAME, StylesheetsRepository } from '@enhanced-dom/css'
import { ScrollbarWebComponent } from '@enhanced-dom/scrollbar'
import classNames from 'classnames'
import debounce from 'lodash.debounce'
import uniqueId from 'lodash.uniqueid'

import * as styles from './scrollable.webcomponent.pcss'
import { selectors, URN_PREFIX } from './scrollable.selectors'

export enum ScrollbarPositions {
  right = 'right',
  bottom = 'bottom',
}

export interface ScrollableWebComponentAttributes {
  scrollbars: ScrollbarPositions[]
}

const SCROLLABLE_STYLESHET_NAME = `${URN_PREFIX}:styles`

export class ScrollableWebComponent extends HTMLElement {
  static get observedAttributes() {
    return ['scrollbars', 'class', 'style']
  }

  static cssVariables = {
    scrollableGap: styles.variablesScrollableGap,
    scrollbarThickness: styles.variablesScrollbarThickness,
  }

  static sectionIdentifiers = selectors

  static scrollbarPositions = ScrollbarPositions

  static tag = 'enhanced-dom-scrollable'
  static register = () => {
    if (!window.customElements.get(ScrollableWebComponent.tag)) {
      window.customElements.define(ScrollableWebComponent.tag, ScrollableWebComponent)
    }
    ScrollbarWebComponent.register()
  }

  static template = ({ scrollbars, scrollTop, scrollLeft, containerId, ...rest }: Record<string, any> = {}) => {
    const scrollbarNodes = []
    if (scrollbars?.includes(ScrollbarPositions.right)) {
      scrollbarNodes.push({
        tag: ScrollbarWebComponent.tag,
        attributes: {
          orientation: ScrollbarWebComponent.orientations.vertical,
          for: containerId,
          value: scrollTop,
          class: styles.right,
          [SECTION_ID]: ScrollableWebComponent.sectionIdentifiers.RIGHT_SCROLLBAR,
        },
      })
    }
    if (scrollbars?.includes(ScrollbarPositions.bottom)) {
      scrollbarNodes.push({
        tag: ScrollbarWebComponent.tag,
        attributes: {
          orientation: ScrollbarWebComponent.orientations.horizontal,
          for: containerId,
          value: scrollLeft,
          class: styles.bottom,
          [SECTION_ID]: ScrollableWebComponent.sectionIdentifiers.BOTTOM_SCROLLBAR,
        },
      })
    }

    return [
      {
        tag: 'head',
        children: [
          {
            tag: 'style',
            attributes: {
              [STYLESHEET_ATTRIBUTE_NAME]: SCROLLABLE_STYLESHET_NAME,
            },
          },
        ],
      },
      {
        tag: 'div',
        attributes: {
          ...rest,
          class: classNames(styles.scrollable, rest.class, {
            [styles.scrollableBottom]: scrollbars?.includes(ScrollbarPositions.bottom) && scrollbars?.length === 1,
            [styles.scrollableRight]: scrollbars?.includes(ScrollbarPositions.right) && scrollbars?.length === 1,
            [styles.scrollableBoth]: scrollbars?.length === 2,
          }),
          [SECTION_ID]: ScrollableWebComponent.sectionIdentifiers.WRAPPER,
        },
        children: [
          {
            tag: 'div',
            attributes: {
              class: styles.main,
              id: containerId,
              [SECTION_ID]: ScrollableWebComponent.sectionIdentifiers.SCROLL_CONTAINER,
            },
            children: [
              {
                tag: 'div',
                attributes: {
                  class: styles.window,
                  [SECTION_ID]: ScrollableWebComponent.sectionIdentifiers.SCROLL_SIZER,
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
    containerId: uniqueId(URN_PREFIX),
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
    if (this._attributes.scrollbars?.includes(ScrollbarPositions.right)) {
      this._eventListenerTracker.register({
        hook: (e: Element) => {
          const monitorRightScrollbarScroll = (event) => {
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
    if (this._attributes.scrollbars?.includes(ScrollbarPositions.bottom)) {
      this._eventListenerTracker.register({
        hook: (e: Element) => {
          const monitorBottomScrollbarScroll = (event) => {
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
    return this.shadowRoot.querySelector(`*[${SECTION_ID}="${ScrollableWebComponent.sectionIdentifiers.SCROLL_SIZER}"]`)
  }

  private _findScrollContainer = () => {
    return this.shadowRoot.querySelector(`*[${SECTION_ID}="${ScrollableWebComponent.sectionIdentifiers.SCROLL_CONTAINER}"]`)
  }

  private _findRightScrollbar = (): ScrollbarWebComponent => {
    return this.shadowRoot.querySelector(`*[${SECTION_ID}="${ScrollableWebComponent.sectionIdentifiers.RIGHT_SCROLLBAR}"]`)
  }

  private _findBottomScrollbar = (): ScrollbarWebComponent => {
    return this.shadowRoot.querySelector(`*[${SECTION_ID}="${ScrollableWebComponent.sectionIdentifiers.BOTTOM_SCROLLBAR}"]`)
  }

  private _scrollSizeObserver = new ResizeObserver((entries) => {
    this._stylesheetsRepository.setProperty(
      SCROLLABLE_STYLESHET_NAME,
      styles.right,
      ScrollbarWebComponent.cssVariables.scrollSize,
      `${entries[0].target.scrollHeight}px`,
    )
    this._stylesheetsRepository.setProperty(
      SCROLLABLE_STYLESHET_NAME,
      styles.bottom,
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

  attributeChangedCallback(name: string, oldVal: string, newVal: string) {
    if (oldVal !== newVal) {
      switch (name) {
        case 'scrollbars':
          this.scrollbars = newVal
          break
        default:
          this._attributes[name] = newVal
          break
      }
      this.render()
    }
  }
}
