import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment'

if (ExecutionEnvironment.canUseDOM) {
    // Create custom chat bubble that triggers the Ask Alpha slide-out
    const createChatBubble = () => {
        const button = document.createElement('button')
        button.id = 'aai-chat-bubble'
        button.setAttribute('aria-label', 'Ask Alpha AI Assistant')
        button.style.cssText = `
      position: fixed;
      right: 20px;
      bottom: 20px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background-color: #16213E;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9997;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    `

        const img = document.createElement('img')
        img.src = '/img/aai-logo-cropped.svg'
        img.alt = 'Ask Alpha'
        img.style.cssText = 'width: 40px; height: 40px;'
        button.appendChild(img)

        // Hover effect
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px) scale(1.05)'
            button.style.boxShadow = '0 6px 16px rgba(22, 33, 62, 0.3)'
        })

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0) scale(1)'
            button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
        })

        // Click handler - dispatch event for Ask Alpha panel
        button.addEventListener('click', () => {
            const event = new CustomEvent('ask-alpha-open', {
                detail: {
                    context: {
                        page: document.title,
                        url: window.location.href,
                        section: 'Chat Bubble'
                    }
                },
                bubbles: true
            })
            window.dispatchEvent(event)
        })

        // Create tooltip
        const tooltip = document.createElement('div')
        tooltip.id = 'aai-tooltip'
        tooltip.textContent = 'Hi There 👋! Need help?'
        tooltip.style.cssText = `
      position: fixed;
      right: 86px;
      bottom: 30px;
      background: black;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
      font-family: system-ui, -apple-system, sans-serif;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      z-index: 9997;
      transition: opacity 0.3s ease;
    `

        button.addEventListener('mouseenter', () => {
            tooltip.style.opacity = '1'
        })

        button.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0'
        })

        document.body.appendChild(button)
        document.body.appendChild(tooltip)
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createChatBubble)
    } else {
        createChatBubble()
    }
}
