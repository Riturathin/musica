"use client";

import type { ReactNode } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signInWithProvider, usePreferredAuthProvider } from "./auth-provider";

interface AuthPromptButtonProps {
    children?: ReactNode;
}

const AuthPromptButton = ({ children = "Sign in / sign up" }: AuthPromptButtonProps) => {
    const { providerId, providersLoaded } = usePreferredAuthProvider();

    return (
        <Button
            type="button"
            onClick={() => providerId && signInWithProvider(providerId)}
            disabled={!providerId}
        >
            <LogIn />
            {providerId ? children : providersLoaded ? "Configure OIDC" : "Checking auth"}
        </Button>
    );
};

export default AuthPromptButton;
