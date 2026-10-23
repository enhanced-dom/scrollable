import { ScrollableDemoWebComponent } from './scrollable-demo.webcomponent'

ScrollableDemoWebComponent.register()

document.getElementById('root')!.appendChild(document.createElement(ScrollableDemoWebComponent.tag))
