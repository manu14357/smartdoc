import Link from 'next/link'
import MaxWidthWrapper from './MaxWidthWrapper'
import { ArrowRight } from 'lucide-react'
import { 
  LoginLink, 
  RegisterLink, 
  getKindeServerSession 
} from '@kinde-oss/kinde-auth-nextjs/server'

import { buttonVariants } from './ui/button'
import UserAccountNav from './UserAccountNav'
import MobileNav from './MobileNav'
import { RotatingLogo } from './RotatingLogo' // Import the new client component

const Navbar = () => {
  const { getUser } = getKindeServerSession()
  const user = getUser()

  return (
    <nav className='sticky h-14 inset-x-0 top-0 z-30 w-full border-b border-gray-200 bg-white/75 backdrop-blur-lg transition-all'>
      <MaxWidthWrapper>
        <div className='flex h-14 items-center justify-between border-b border-zinc-200'>
          {/* Logo with Rotating Icon */}
          <Link 
            href="/" 
            className="flex items-center font-bold text-3xl"
          >
            <RotatingLogo /> {/* Use the new client component */}
            <span className="animate-wave bg-gradient-to-r from-blue-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              SmartDoc.
            </span>
          </Link>

          {/* Mobile Navigation */}
          <MobileNav isAuth={!!user} />

          {/* Desktop Navigation */}
          <div className='hidden items-center space-x-6 sm:flex'>
            {!user ? (
              <NavigationAuthButtons />
            ) : (
              <NavigationUserButtons 
                name={
                  !user.given_name || !user.family_name
                    ? 'Your Account'
                    : `${user.given_name} ${user.family_name}`
                }
                email={user.email ?? ''}
                imageUrl={user.picture ?? ''}
              />
            )}
          </div>
        </div>
      </MaxWidthWrapper>
    </nav>
  )
}

// Extracted auth buttons with enhanced styling
const NavigationAuthButtons = () => (
  <>
    <Link
      href='/pricing'
      className="font-semibold text-gray-700 hover:text-[hsl(272.1,71.7%,47.1%)] transition-colors duration-300 ease-in-out transform hover:scale-105"
    >
      Pricing
    </Link>
    <LoginLink
      className="font-semibold text-gray-700 hover:text-[hsl(272.1,71.7%,47.1%)] transition-colors duration-300 ease-in-out transform hover:scale-105"
    >
      Sign in
    </LoginLink>
    <RegisterLink
      className="font-bold text-white bg-[hsl(272.1,71.7%,47.1%)] px-4 py-2 rounded-full hover:bg-[hsl(272.1,71.7%,47.1%)] hover:bg-opacity-80 transition-all duration-300 ease-in-out flex items-center group shadow-md hover:shadow-lg"
        >
      Get started{' '}
      <ArrowRight className='ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform' />
    </RegisterLink>
  </>
)

// Extracted user buttons with enhanced styling
const NavigationUserButtons = ({ 
  name, 
  email, 
  imageUrl 
}: { 
  name: string, 
  email: string, 
  imageUrl: string 
}) => (
  <>
    <Link
      href='/dashboard'
      className="font-semibold text-gray-700 hover:text-[hsl(272.1,71.7%,47.1%)] transition-colors duration-300 ease-in-out transform hover:scale-105"
    >
      Dashboard
    </Link>

    <UserAccountNav
      name={name}
      email={email}
      imageUrl={imageUrl}
    />
  </>
)

// Rest of the component remains the same...

export default Navbar