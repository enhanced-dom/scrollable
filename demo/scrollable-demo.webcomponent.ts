import { WebcomponentRenderer, type IRenderingEngine } from '@enhanced-dom/webcomponent'
import { EventListenerTracker } from '@enhanced-dom/dom'
import { STYLESHEET_ATTRIBUTE_NAME, StylesheetsRepository } from '@enhanced-dom/css'
import { ScrollbarWebComponent } from '@enhanced-dom/scrollbar'
import { debounce } from 'lodash-es'

import { ScrollableWebComponent, ScrollbarPositions } from '../src'
import * as styles from './scrollable-demo.webcomponent.pcss'

export class ScrollableDemoWebComponent extends HTMLElement {
  static tag = 'enhanced-dom-scrollable-demo'

  static template = ({ width = 3000, height = 3000 }: { width?: number; height?: number } = {}) => [
    {
      tag: 'style',
      attributes: { [STYLESHEET_ATTRIBUTE_NAME]: ScrollableDemoWebComponent.tag },
      children: [{ content: styles.css }],
    },
    {
      tag: 'div',
      attributes: { class: styles.container },
      children: [
        {
          tag: ScrollableWebComponent.tag,
          attributes: { scrollbars: [ScrollbarPositions.RIGHT, ScrollbarPositions.BOTTOM] },
          children: [
            {
              tag: 'div',
              attributes: {
                style: `width:${width}px;height:${height}px;background:radial-gradient(circle, rgba(2,0,36,1) 0%, rgba(9,9,121,1) 35%, rgba(0,212,255,1) 100%)`,
              },
            },
          ],
        },
      ],
    },
    { tag: 'button', children: [{ content: 'smaller' }] },
    { tag: 'button', children: [{ content: 'bigger' }] },
    { tag: 'button', children: [{ content: 'reset scroll' }] },
  ]

  static register = () => {
    ScrollableWebComponent.register()
    if (!window.customElements.get(ScrollableDemoWebComponent.tag)) {
      window.customElements.define(ScrollableDemoWebComponent.tag, ScrollableDemoWebComponent)
    }
  }

  static renderer: IRenderingEngine = new WebcomponentRenderer(
    '@enhanced-dom/ScrollableDemoWebComponent',
    ScrollableDemoWebComponent.template,
  )

  private _attributes: Record<string, any> = { width: 3000, height: 3000 }
  private _eventListenerTracker = new EventListenerTracker()
  private _stylesheetsRepository = new StylesheetsRepository(document)

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._stylesheetsRepository.setProperty('demo-styles', ':root', ScrollbarWebComponent.cssVariables.scrollbarThumb, 'rgb(0 0 0 / 60%)')
  }

  private _findScrollable = () => this.shadowRoot?.querySelector(ScrollableWebComponent.tag) as ScrollableWebComponent | null

  private _findButtons = () => this.shadowRoot?.querySelectorAll('button')
  private _findSmallerButton = () => this._findButtons()?.[0]
  private _findBiggerButton = () => this._findButtons()?.[1]
  private _findResetButton = () => this._findButtons()?.[2]

  private _addEventListeners = () => {
    this._removeEventListeners()
    this._eventListenerTracker.register({
      nodeLocator: this._findSmallerButton,
      hook: (e: Element) => {
        const onClick = () => {
          this._attributes.width = Math.max(this._attributes.width - 500, 500)
          this._attributes.height = Math.max(this._attributes.height - 500, 500)
          this.render()
        }
        e.addEventListener('click', onClick)
        return (el: Element) => el.removeEventListener('click', onClick)
      },
    })
    this._eventListenerTracker.register({
      nodeLocator: this._findBiggerButton,
      hook: (e: Element) => {
        const onClick = () => {
          this._attributes.width += 500
          this._attributes.height += 500
          this.render()
        }
        e.addEventListener('click', onClick)
        return (el: Element) => el.removeEventListener('click', onClick)
      },
    })
    this._eventListenerTracker.register({
      nodeLocator: this._findResetButton,
      hook: (e: Element) => {
        const onClick = () => {
          const scrollable = this._findScrollable()
          if (scrollable) {
            scrollable.scrollLeft = 0
            scrollable.scrollTop = 0
          }
        }
        e.addEventListener('click', onClick)
        return (el: Element) => el.removeEventListener('click', onClick)
      },
    })
  }

  private _removeEventListeners = () => {
    this._eventListenerTracker.unregister({ nodeLocator: this._findSmallerButton })
    this._eventListenerTracker.unregister({ nodeLocator: this._findBiggerButton })
    this._eventListenerTracker.unregister({ nodeLocator: this._findResetButton })
  }

  render = debounce(
    () => {
      if (!this.shadowRoot) {
        return
      }
      ScrollableDemoWebComponent.renderer.render(this.shadowRoot, this._attributes)
      this._eventListenerTracker.refreshSubscriptions()
    },
    10,
    { leading: false, trailing: true },
  )

  connectedCallback() {
    this._addEventListeners()
    this.render()
  }

  disconnectedCallback() {
    this.render.cancel()
    this._removeEventListeners()
  }
}
