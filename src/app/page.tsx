// page.tsx
'use client';
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Link from 'next/link'
import { 
  ArrowRight, 
  FileText, 
  Zap, 
  Shield, 
  Coffee,
  Brain,
  Search,
  Clock,
  Code,
  Book,
  UserCheck,
  Sparkles,
  Building2
} from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import Image from 'next/image'
import { AnimatedHero, AnimatedFeatures, AnimatedTestimonial } from '../components/ui/AnimatedComponents'
import { motion } from 'framer-motion'

export default function Home() {
  const features = [
    {
      icon: <Brain className="h-6 w-6 text-[hsl(272.1,71.7%,47.1%)]" />,
      title: "AI-Powered Analysis",
      description: "Our advanced AI understands context and nuances in your documents, providing precise and relevant insights."
    },
    {
      icon: <Clock className="h-6 w-6 text-[hsl(272.1,71.7%,47.1%)]" />,
      title: "Save Hours of Work",
      description: "Stop spending hours reading through documents. Get instant answers to your questions and quick summaries."
    },
    {
      icon: <Shield className="h-6 w-6 text-[hsl(272.1,71.7%,47.1%)]" />,
      title: "Secure & Private",
      description: "Your documents are encrypted and processed in a secure environment. We prioritize your privacy and data security."
    }
  ]

  const useCases = [
    {
      icon: <Book className="h-8 w-8 text-[hsl(272.1,71.7%,47.1%)]" />,
      title: "Students & Researchers",
      description: "Quickly analyze research papers, extract key findings, and generate literature reviews."
    },
    {
      icon: <Building2 className="h-8 w-8 text-[hsl(272.1,71.7%,47.1%)]" />,
      title: "Business Professionals",
      description: "Process contracts, reports, and business documents efficiently with AI assistance."
    },
    {
      icon: <Code className="h-8 w-8 text-[hsl(272.1,71.7%,47.1%)]" />,
      title: "Technical Teams",
      description: "Understand technical documentation, analyze specifications, and extract requirements."
    }
  ]

  return (
    <>
      <MaxWidthWrapper className="mb-12 mt-28 sm:mt-40 flex flex-col items-center justify-center text-center">


         <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="relative z-10 mb-8"
        >
          <div className="inline-flex items-center justify-center space-x-3 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-md">
            <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
            <span className="text-sm font-medium text-gray-800">
              Introducing <span className="font-bold text-blue-600">SmartDoc AI 🚀</span> 
            </span>
          
            <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full">
              Beta
            </span>
          </div>
        </motion.div>






        <h1 className="max-w-4xl text-5xl font-bold md:text-6xl lg:text-7xl">
  Transform your documents into 
  <span className=" inset-0 animate-wave bg-gradient-to-r from-blue-400 via-blue-500 to-purple-600 bg-clip-text text-transparent ml-2">
    intelligent conversations



</span>



        </h1>

        <p className="mt-5 max-w-prose text-zinc-700 sm:text-lg">
          Experience the future of document interaction. Upload any PDF and start having meaningful conversations instantly. Perfect for research, business, and learning.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link
            className={buttonVariants({
              size: 'lg',
              className: 'bg-blue-600 hover:bg-blue-700',
            })}
            href="/dashboard"
          >
            Try SmartDoc Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <Link
            className={buttonVariants({
              size: 'lg',
              variant: 'outline',
              className: 'bg-white',
            })}
            href="#demo"
          >
            Watch Demo
            <Coffee className="ml-2 h-5 w-5" />
          </Link>
        </div>

        <div className="mt-20 w-full">
          <AnimatedFeatures features={features} />
        </div>
      </MaxWidthWrapper>

      {/* Use Cases Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Who Uses SmartDoc?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center space-x-4 mb-4">
                  {useCase.icon}
                  <h3 className="text-xl font-semibold">{useCase.title}</h3>
                </div>
                <p className="text-gray-600">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Comparison */}
      <div className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">
          Why Choose SmartDoc AI?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white rounded-2xl shadow-lg p-12">
          <div className="space-y-8">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">
              Traditional Document Review
            </h3>
            <div className="space-y-6">
              {[
                { icon: Clock, text: "Time-consuming manual processing" },
                { icon: Search, text: "Limited keyword-based searching" },
                { icon: UserCheck, text: "Superficial context comprehension" }
              ].map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center space-x-4 text-gray-600 border-l-4 border-[hsl(272.1,71.7%,47.1%)] pl-4"
                >
                  <item.icon className="h-6 w-6 text-[hsl(272.1,71.7%,47.1%)]" />
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-8">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">
              With SmartDoc AI
            </h3>
            <div className="space-y-6">
              {[
                { icon: Zap, text: "Instant, comprehensive insights" },
                { icon: Brain, text: "Advanced semantic understanding" },
                { icon: FileText, text: "Deep, contextual document analysis" }
              ].map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center space-x-4 text-gray-600 border-l-4 border-blue-400 pl-4"
                >
                  <item.icon className="h-6 w-6 text-blue-600" />
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">How SmartDoc Works</h2>
          <ol className="my-8 space-y-4 pt-8 md:flex md:space-x-12 md:space-y-0">
            {[
              {
                step: "1",
                title: "Upload Your Document",
                description: "Simply drag and drop your PDF. We support research papers, reports, contracts, and more."
              },
              {
                step: "2",
                title: "AI Processing",
                description: "Our advanced AI analyzes your document, understanding its content, context, and key information."
              },
              {
                step: "3",
                title: "Start Conversations",
                description: "Ask questions naturally and get instant, accurate responses about your document's content."
              }
            ].map((item, index) => (
              <li key={index} className="md:flex-1">
                <div className="flex flex-col space-y-2 border-l-4 border-zinc-300 py-2 pl-4 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4">
                  <span className="text-sm font-medium text-[hsl(272.1,71.7%,47.1%)]">
                    Step {item.step}
                  </span>
                  <span className="text-xl font-semibold">
                    {item.title}
                  </span>
                  <span className="mt-2 text-zinc-700">
                    {item.description}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Early Access CTA */}
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Be Among the First to Try SmartDoc</h2>
          <p className="mb-8 max-w-2xl mx-auto">
            Join our beta program and get exclusive early access to SmartDoc. Limited spots available.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className={buttonVariants({
                size: 'lg',
                variant: 'outline',
                className: 'bg-white text-[hsl(272.1,71.7%,47.1%)] hover:bg-gray-100',
              })}
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/pricing"
              className={buttonVariants({
                size: 'lg',
                variant: 'outline',
                className: 'bg-white text-[hsl(272.1,71.7%,47.1%)] hover:bg-gray-100',
              })}
            >
              View Pricing
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}