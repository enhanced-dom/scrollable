import { HtmlRenderer, IRenderingEngine, SECTION_ID, EVENT_EMITTER_TYPE } from '@enhanced-dom/webcomponent'
import classNames from 'classnames'
import debounce from 'lodash.debounce'
import { ScrollbarWebComponent, ScrollDirection } from '@enhanced-dom/scrollbar'
import { StylesheetsRepository } from '@enhanced-dom/css'

import * as styles from './scrollable.webcomponent.css'
import { selectors } from './scrollable.selectors'

export enum ScrollbarPositions {
  right = 'right',
  bottom = 'bottom',
}

export interface ScrollableWebComponentAttributes {
  scrollbars: ScrollbarPositions[]
}

export class ScrollableWebComponent extends HTMLElement {
  static get observedAttributes() {
    return ['scrollbars', 'class', 'style']
  }

  static cssVariables = {
    scrollableGap: styles.variablesScrollableGap,
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

  static template = ({ scrollbars, scrollTop, scrollLeft, ...rest }: Record<string, any> = {}) => {
    const scrollbarNodes = []
    if (scrollbars?.includes(ScrollbarPositions.right)) {
      scrollbarNodes.push({
        tag: ScrollbarWebComponent.tag,
        attributes: {
          direction: ScrollDirection.vertical,
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
          value: scrollLeft,
          direction: ScrollDirection.horizontal,
          class: styles.bottom,
          [SECTION_ID]: ScrollableWebComponent.sectionIdentifiers.BOTTOM_SCROLLBAR,
        },
      })
    }

    return {
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
    }
  }
  static renderer: IRenderingEngine = new HtmlRenderer('@enhanced-dom/ScrollableWebComponent', ScrollableWebComponent.template)
  private _attributes: Record<string, any> = { scrollbars: [ScrollbarPositions.bottom, ScrollbarPositions.right] }

  private _stylesheetsRepository: StylesheetsRepository

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._stylesheetsRepository = new StylesheetsRepository(this.shadowRoot, {
      type: EVENT_EMITTER_TYPE,
      id: ScrollableWebComponent.tag,
    })
    ScrollableWebComponent.renderer.render(this.shadowRoot, this._attributes)
  }

  private get $mainContentElement() {
    return this.shadowRoot.querySelector(`*[${SECTION_ID}="${ScrollableWebComponent.sectionIdentifiers.SCROLL_SIZER}"]`)
  }

  private get $scrollContainer() {
    return this.shadowRoot.querySelector(`*[${SECTION_ID}="${ScrollableWebComponent.sectionIdentifiers.SCROLL_CONTAINER}"]`)
  }

  private get $rightScrollbar(): ScrollbarWebComponent {
    return this.shadowRoot.querySelector(`*[${SECTION_ID}="${ScrollableWebComponent.sectionIdentifiers.RIGHT_SCROLLBAR}"]`)
  }

  private get $bottomScrollbar(): ScrollbarWebComponent {
    return this.shadowRoot.querySelector(`*[${SECTION_ID}="${ScrollableWebComponent.sectionIdentifiers.BOTTOM_SCROLLBAR}"]`)
  }

  private _scrollSizeObserver = new ResizeObserver((entries) => {
    this._stylesheetsRepository.setProperty(
      styles._stylesheetName,
      styles.right,
      ScrollbarWebComponent.cssVariables.scrollSize,
      `${entries[0].target.scrollHeight}px`,
    )
    this._stylesheetsRepository.setProperty(
      styles._stylesheetName,
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

  private _attachScrollListeners() {
    this.$scrollContainer.addEventListener(
      'scroll',
      (e) => {
        if (e.target === this.$scrollContainer) {
          e.stopPropagation()
          if (this.$rightScrollbar) {
            this.$rightScrollbar.value = this.$scrollContainer.scrollTop
          }
          if (this.$bottomScrollbar) {
            this.$bottomScrollbar.value = this.$scrollContainer.scrollLeft
          }
          this.dispatchEvent(new Event('scroll'))
        }
      },
      true,
    )
    if (this.$rightScrollbar) {
      this.$rightScrollbar.addEventListener(
        'scroll',
        (e) => {
          e.stopPropagation()
          this.$scrollContainer.scrollTop = this.$rightScrollbar.value
          this.dispatchEvent(new Event('scroll'))
        },
        true,
      )
    }
    if (this.$bottomScrollbar) {
      this.$bottomScrollbar.addEventListener(
        'scroll',
        (e) => {
          e.stopPropagation()
          this.$scrollContainer.scrollLeft = this.$bottomScrollbar.value
          this.dispatchEvent(new Event('scroll'))
        },
        true,
      )
    }
  }

  render = debounce(
    () => {
      ScrollableWebComponent.renderer.render(this.shadowRoot, this._attributes)
      this._monitorScrollSize()
      this._attachScrollListeners()
    },
    10,
    { leading: false, trailing: true },
  )

  connectedCallback() {
    this.render()
  }

  disconnectedCallback() {
    this._scrollSizeObserver.disconnect()
  }

  get scrollbars() {
    return JSON.parse(this.getAttribute('scrollbars'))
  }

  set scrollbars(value: ScrollbarPositions[] | string) {
    const parsedValue: ScrollbarPositions[] = typeof value === 'string' ? JSON.parse(value) : value
    this._attributes.scrollbars = parsedValue
    this.setAttribute('scrollbars', JSON.stringify(parsedValue))
  }

  get scrollLeft(): number {
    return this.$scrollContainer.scrollLeft
  }

  set scrollLeft(newValue: number | string) {
    const numericScrollValue = typeof newValue === 'string' ? parseInt(newValue) : newValue
    this.$scrollContainer.scrollLeft = numericScrollValue
  }

  get scrollTop(): number {
    return this.$scrollContainer.scrollTop
  }

  set scrollTop(newValue: number | string) {
    const numericScrollValue = typeof newValue === 'string' ? parseInt(newValue) : newValue
    this.$scrollContainer.scrollTop = numericScrollValue
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

ScrollableWebComponent.renderer.addStyle(styles._stylesheetName)
