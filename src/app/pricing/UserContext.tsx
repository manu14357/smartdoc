// src/contexts/UserContext.tsx
'use client'; // Ensure this is a client-side component

import React, { createContext, useState, ReactNode, useContext } from 'react';

// Define the shape of your User object
interface User {
  id: string;
  name: string;
  email: string;
  // Add other relevant fields as needed
}

// Define the shape of the context
interface UserContextProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

// Create the context with default values
const UserContext = createContext<UserContextProps>({
  user: null,
  setUser: () => {},
});

// Create a provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook for easy access to the UserContext
export const useUser = () => useContext(UserContext);

// Export the UserContext
export { UserContext };