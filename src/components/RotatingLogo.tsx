'use client'

import { motion } from 'framer-motion'
import { Icons } from './Icons'

export const RotatingLogo = () => {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ 
        repeat: Infinity, 
        duration: 1.5, 
        ease: "linear" 
      }}
      className="w-10 h-10 mr-2"
    >
      <Icons.logo className='fill-gray-400 w-full h-full ' />
    </motion.div>
  )
}