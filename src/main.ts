import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!

const target = document.createElement('span')
target.id = 'target'
target.textContent = 'A'

app.appendChild(target)
