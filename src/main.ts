import './style.css'
import { pickTarget, targetCode, renderTarget } from './game'
import { celebrate } from './celebrate'

const app = document.querySelector<HTMLDivElement>('#app')!

const target = document.createElement('span')
target.id = 'target'
app.appendChild(target)

let currentTarget = pickTarget()
renderTarget(target, currentTarget)

document.addEventListener('keydown', (event: KeyboardEvent) => {
  if (event.repeat) return // CORE-04: ignore auto-repeated keydowns entirely

  if (event.code === targetCode(currentTarget)) {
    currentTarget = pickTarget(currentTarget)
    renderTarget(target, currentTarget)

    target.classList.remove('correct-pulse')
    void target.offsetWidth
    target.classList.add('correct-pulse')

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      void celebrate(target.getBoundingClientRect())
    }
  } else {
    app.classList.remove('incorrect-flash')
    void app.offsetWidth
    app.classList.add('incorrect-flash')
  }
})
