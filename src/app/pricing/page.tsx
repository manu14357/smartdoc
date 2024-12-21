'use client'

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MaxWidthWrapper from '@/components/MaxWidthWrapper';
import UpgradeButton from '@/components/UpgradeButton';
import { buttonVariants } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PLANS } from '@/config/stripe';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  Check,
  HelpCircle,
  Minus,
  Zap,
  Clock,
  FileText,
  MessageSquare,
  Shield,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

const Page = ({ user }: { user: any }) => {
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  const pricingItems = [
    {
      plan: 'Free',
      tagline: 'Perfect for side projects and small teams',
      quota: 10,
      popular: false,
      features: [
        {
          text: '5 pages per PDF',
          footnote: 'The maximum amount of pages per PDF-file.',
          icon: <FileText className="h-4 w-4 text-blue-500" />,
        },
        {
          text: '4MB file size limit',
          footnote: 'The maximum file size of a single PDF file.',
          icon: <FileText className="h-4 w-4 text-blue-500" />,
        },
        {
          text: 'Mobile-friendly interface',
          icon: <MessageSquare className="h-4 w-4 text-blue-500" />,
        },
        {
          text: 'Basic response quality',
          footnote: 'Standard algorithmic responses for basic needs',
          icon: <MessageSquare className="h-4 w-4 text-blue-500" />,
        },
        {
          text: 'Community support',
          icon: <MessageSquare className="h-4 w-4 text-blue-500" />,
        },
      ],
    },
    {
      plan: 'Pro',
      tagline: 'Advanced features for power users',
      quota: PLANS.find((p) => p.slug === 'pro')!.quota,
      popular: true,
      features: [
        {
          text: '25 pages per PDF',
          footnote: 'The maximum amount of pages per PDF-file.',
          icon: <FileText className="h-4 w-4 text-indigo-500" />,
        },
        {
          text: '16MB file size limit',
          footnote: 'The maximum file size of a single PDF file.',
          icon: <FileText className="h-4 w-4 text-indigo-500" />,
        },
        {
          text: 'Advanced response quality',
          footnote: 'Enhanced algorithmic responses with better accuracy',
          icon: <Zap className="h-4 w-4 text-indigo-500" />,
        },
        {
          text: 'Priority support (24/7)',
          icon: <Clock className="h-4 w-4 text-indigo-500" />,
        },
        {
          text: 'Advanced security',
          icon: <Shield className="h-4 w-4 text-indigo-500" />,
        },
      ],
    },
  ];

  return (
    <MaxWidthWrapper className="mb-8 mt-24 text-center max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mx-auto mb-10 sm:max-w-lg"
      >
        <h1 className="text-6xl font-bold sm:text-7xl">
          <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Simple Pricing
          </span>
        </h1>
        <p className="mt-5 text-xl text-gray-600">
          Choose the perfect plan for your needs. All plans include our core features.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center mb-8"
      >
        <div className="bg-gray-100/50 p-1 rounded-xl backdrop-blur-sm">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={cn('px-6 py-3 rounded-lg transition-all font-medium', {
              'bg-white shadow-lg text-blue-600': billingPeriod === 'monthly',
              'text-gray-600': billingPeriod !== 'monthly',
            })}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={cn('px-6 py-3 rounded-lg transition-all font-medium', {
              'bg-white shadow-lg text-blue-600': billingPeriod === 'annual',
              'text-gray-600': billingPeriod !== 'annual',
            })}
          >
            Annual
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Save 20%
            </span>
          </button>
        </div>
      </motion.div>

      <div className="pt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <TooltipProvider>
          {pricingItems.map(({ plan, tagline, quota, features, popular }) => {
            const price =
              PLANS.find((p) => p.slug === plan.toLowerCase())?.price.amount || 0;
            const annualPrice = billingPeriod === 'annual' ? price * 0.8 : price;

            return (
              <motion.div
                key={plan}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                onMouseEnter={() => setHoveredPlan(plan)}
                onMouseLeave={() => setHoveredPlan(null)}
                className={cn(
                  'relative rounded-2xl bg-white shadow-xl transform transition-all duration-300',
                  {
                    'border-2 border-blue-600 scale-105': hoveredPlan === plan || popular,
                    'hover:scale-105': hoveredPlan !== plan,
                    'border border-gray-200': !popular,
                  }
                )}
              >
                {popular && (
                  <div className="absolute -top-5 left-0 right-0 mx-auto w-32 rounded-full bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 px-3 py-2 text-sm font-medium text-white shadow-lg">
                    <Sparkles className="h-4 w-4 inline mr-1" />
                    Popular
                  </div>
                )}

                <div className="p-8">
                  <h3 className="text-center font-display text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    {plan}
                  </h3>
                  <p className="mt-2 text-gray-500">{tagline}</p>
                  <div className="my-8 text-center">
                    <p className="font-display text-7xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      ${billingPeriod === 'annual' ? annualPrice : price}
                    </p>
                    <p className="text-gray-500 mt-2">
                      per {billingPeriod === 'annual' ? 'month' : 'month'}
                    </p>
                  </div>

                  <ul className="space-y-5">
                    {features.map(({ text, footnote, icon }) => (
                      <motion.li
                        key={text}
                        className="flex items-start space-x-3"
                        whileHover={{ x: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex-shrink-0 rounded-full bg-blue-50 p-1">
                          {icon}
                        </div>
                        {footnote ? (
                          <div className="flex items-center space-x-1">
                            <p className="text-gray-600">{text}</p>
                            <Tooltip delayDuration={300}>
                              <TooltipTrigger className="cursor-default ml-1.5">
                                <HelpCircle className="h-4 w-4 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent className="w-80 p-2">
                                {footnote}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        ) : (
                          <p className="text-gray-600">{text}</p>
                        )}
                      </motion.li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    {plan === 'Free' ? (
                      <Link
                        href={user ? '/dashboard' : '/sign-in'}
                        className={buttonVariants({
                          className: 'w-full py-6 text-lg font-medium',
                          variant: 'secondary',
                        })}
                      >
                        {user ? 'Upgrade now' : 'Get started'}
                        <ArrowRight className="h-5 w-5 ml-1.5" />
                      </Link>
                    ) : user ? (
                      <UpgradeButton />
                    ) : (
                      <Link
                        href="/sign-in"
                        className={buttonVariants({
                          className: 'w-full py-6 text-lg font-medium bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-700 hover:via-blue-700 hover:to-cyan-700',
                        })}
                      >
                        {user ? 'Upgrade now' : 'Get started'}
                        <ArrowRight className="h-5 w-5 ml-1.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </TooltipProvider>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-20"
      >
        <h2 className="text-4xl font-bold text-center mb-10">
          <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Frequently Asked Questions
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white p-8 rounded-xl shadow-lg"
          >
            <h3 className="font-bold text-xl mb-3">Can I change plans later?</h3>
            <p className="text-gray-600 text-lg">
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white p-8 rounded-xl shadow-lg"
          >
            <h3 className="font-bold text-xl mb-3">What payment methods do you accept?</h3>
            <p className="text-gray-600 text-lg">
              We accept all major credit cards, PayPal, and bank transfers for business plans.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </MaxWidthWrapper>
  );
};

export default Page;