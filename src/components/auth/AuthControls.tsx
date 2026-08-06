"use client";

import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/store/player.store";
import { DEV_PROVIDER_ID, OIDC_PROVIDER_ID, signInWithProvider, usePreferredAuthProvider } from "./auth-provider";

const AuthControls = () => {
    const { data: session, status } = useSession();
    const setAuthenticatedUser = usePlayerStore((state) => state.setAuthenticatedUser);
    const { providerId, providersLoaded } = usePreferredAuthProvider();

    const isAuthenticated = status === "authenticated";
    const displayName = session?.user?.name ?? session?.user?.email ?? "OIDC User";

    useEffect(() => {
        if (status === "authenticated" && session.user) {
            setAuthenticatedUser({
                id: session.user.id ?? session.user.email ?? displayName,
                name: displayName,
            });
            return;
        }

        if (status === "unauthenticated") {
            setAuthenticatedUser(null);
        }
    }, [displayName, session?.user, setAuthenticatedUser, status]);

    const handleAuthClick = () => {
        if (isAuthenticated) {
            void signOut({ redirectTo: "/" });
            return;
        }

        if (providerId) {
            signInWithProvider(providerId);
        }
    };

    const statusLabel = status === "loading"
        ? "Checking session..."
        : isAuthenticated
            ? `Signed in as ${displayName}`
            : providerId === DEV_PROVIDER_ID
                ? ""
                : providersLoaded
                    ? "OIDC env not configured"
                    : "Browsing as guest";

    const buttonLabel = isAuthenticated
        ? "Sign out"
        : providerId === OIDC_PROVIDER_ID
            ? "Sign in with OIDC"
            : providerId === DEV_PROVIDER_ID
                ? "Sign-in"
                : providersLoaded
                    ? "Configure OIDC"
                    : "Sign in with OIDC";

    return (
        <div className="auth-panel">
            <p>{statusLabel}</p>
            <Button
                type="button"
                variant="secondary"
                onClick={handleAuthClick}
                disabled={status === "loading" || (!isAuthenticated && !providerId)}
            >
                {isAuthenticated ? <LogOut /> : <LogIn />}
                {buttonLabel}
            </Button>
        </div>
    );
};

export default AuthControls;
