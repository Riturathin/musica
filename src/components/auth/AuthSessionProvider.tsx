"use client";

import { SessionProvider } from "next-auth/react";

interface AuthSessionProviderProps {
    children: React.ReactNode;
}

const AuthSessionProvider = ({ children }: AuthSessionProviderProps) => {
    return <SessionProvider>{children}</SessionProvider>;
};

export default AuthSessionProvider;
