// AnimatedComponents.tsx
'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { FileText, Zap, Shield } from 'lucide-react'

interface AnimatedHeroProps {
  children: ReactNode
}

interface Feature {
  icon: ReactNode
  title: string
  description: string
}

interface AnimatedFeaturesProps {
  features: Feature[]
}

interface AnimatedTestimonialProps {
  content: string
  author: string
  role: string
}

export const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export const AnimatedHero: React.FC<AnimatedHeroProps> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="mx-auto mb-4 flex max-w-fit items-center justify-center space-x-2 overflow-hidden rounded-full border border-gray-200 bg-white px-7 py-2 shadow-md backdrop-blur transition-all hover:border-gray-300 hover:bg-white/50"
    >
      {children}
    </motion.div>
  )
}

export const AnimatedFeatures: React.FC<AnimatedFeaturesProps> = ({ features }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
      {features.map((feature, index) => (
        <motion.div
          key={index}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.2 }}
          variants={fadeIn}
          className="p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center space-x-4">
            {feature.icon}
            <h3 className="text-xl font-semibold">{feature.title}</h3>
          </div>
          <p className="mt-4 text-gray-600">{feature.description}</p>
        </motion.div>
      ))}
    </div>
  )
}

export const AnimatedTestimonial: React.FC<AnimatedTestimonialProps> = ({ content, author, role }) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeIn}
      className="bg-white p-6 rounded-xl shadow-lg"
    >
      <p className="text-gray-600 italic">&quot;{content}&quot;</p>
      <div className="mt-4">
        <p className="font-semibold">{author}</p>
        <p className="text-sm text-gray-500">{role}</p>
      </div>
    </motion.div>
  )
}