"use client";

import { useEffect, useState } from "react";
import { getProviders, signIn, signOut, useSession } from "next-auth/react";
import { LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/store/player.store";

const OIDC_PROVIDER_ID = "oidc";

const AuthControls = () => {
    const { data: session, status } = useSession();
    const setAuthenticatedUser = usePlayerStore((state) => state.setAuthenticatedUser);
    const [oidcAvailable, setOidcAvailable] = useState<boolean | null>(null);

    const isAuthenticated = status === "authenticated";
    const displayName = session?.user?.name ?? session?.user?.email ?? "OIDC User";

    useEffect(() => {
        let active = true;

        getProviders()
            .then((providers) => {
                if (active) {
                    setOidcAvailable(Boolean(providers?.[OIDC_PROVIDER_ID]));
                }
            })
            .catch(() => {
                if (active) {
                    setOidcAvailable(false);
                }
            });

        return () => {
            active = false;
        };
    }, []);

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

        if (oidcAvailable) {
            void signIn(OIDC_PROVIDER_ID, { redirectTo: "/" });
        }
    };

    const statusLabel = status === "loading"
        ? "Checking session..."
        : isAuthenticated
            ? `Signed in as ${displayName}`
            : oidcAvailable === false
                ? "OIDC env not configured"
                : "Browsing as guest";

    const buttonLabel = isAuthenticated
        ? "Sign out"
        : oidcAvailable === false
            ? "Configure OIDC"
            : "Sign in with OIDC";

    return (
        <div className="auth-panel">
            <p>{statusLabel}</p>
            <Button
                type="button"
                variant="secondary"
                onClick={handleAuthClick}
                disabled={status === "loading" || (!isAuthenticated && oidcAvailable !== true)}
            >
                {isAuthenticated ? <LogOut /> : <LogIn />}
                {buttonLabel}
            </Button>
        </div>
    );
};

export default AuthControls;
