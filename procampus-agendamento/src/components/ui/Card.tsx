'use client'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  hover?: boolean
  padding?: number | string
  style?: React.CSSProperties
  className?: string
  onClick?: () => void
}

export default function Card({
  children, hover = true, padding = 24,
  style = {}, className = '', onClick,
}: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -5, boxShadow: '0 20px 60px rgba(97,206,112,0.15)' } : {}}
      onClick={onClick}
      className={`card-premium ${className}`}
      style={{
        padding,
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
    >
      {children}
    </motion.div>
  )
}
