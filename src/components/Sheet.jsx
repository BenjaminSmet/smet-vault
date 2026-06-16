import { useRef, useState } from 'react'

/**
 * Bottom sheet with native-feeling swipe-to-dismiss.
 * Drag is captured from the handle/title header area only, so it
 * never fights with scrolling inside the sheet's form content.
 */
export default function Sheet({ title, onClose, children }) {
  const [dragY, setDragY] = useState(0)
  const draggingRef = useRef(false)
  const startYRef = useRef(0)

  const onTouchStart = (e) => {
    draggingRef.current = true
    startYRef.current = e.touches[0].clientY
  }

  const onTouchMove = (e) => {
    if (!draggingRef.current) return
    const delta = e.touches[0].clientY - startYRef.current
    if (delta > 0) setDragY(delta)
  }

  const onTouchEnd = () => {
    draggingRef.current = false
    if (dragY > 110) {
      onClose()
    } else {
      setDragY(0)
    }
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: `translateY(${dragY}px)`,
          transition: draggingRef.current ? 'none' : 'transform 0.35s cubic-bezier(0.34,1.2,0.64,1)',
        }}
      >
        <div
          className="sheet-drag-zone"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="sheet-handle" />
          {title && <p className="sheet-title">{title}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}
