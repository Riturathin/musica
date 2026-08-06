import NextAuth, { type NextAuthConfig, type Profile } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { OIDCConfig } from "next-auth/providers";

const OIDC_PROVIDER_ID = "oidc";
const DEV_PROVIDER_ID = "credentials";

const oidcProviderConfigured = Boolean(
    process.env.OIDC_ISSUER &&
    process.env.OIDC_CLIENT_ID &&
    process.env.OIDC_CLIENT_SECRET,
);
const devAuthEnabled = process.env.NODE_ENV !== "production" || process.env.DEV_AUTH_ENABLED === "true";

const createOidcProvider = (): OIDCConfig<Profile> => ({
    id: OIDC_PROVIDER_ID,
    name: process.env.OIDC_NAME || "OIDC",
    type: "oidc",
    issuer: process.env.OIDC_ISSUER,
    wellKnown: process.env.OIDC_WELL_KNOWN || undefined,
    clientId: process.env.OIDC_CLIENT_ID,
    clientSecret: process.env.OIDC_CLIENT_SECRET,
    authorization: {
        params: {
            scope: process.env.OIDC_SCOPE || "openid profile email",
        },
    },
    checks: ["pkce", "state", "nonce"],
    profile(profile) {
        const id = profile.sub ?? profile.id ?? profile.email ?? profile.preferred_username ?? "oidc-user";
        const name = profile.name ?? profile.preferred_username ?? profile.email ?? "OIDC User";

        return {
            id: String(id),
            name,
            email: profile.email,
            image: typeof profile.picture === "string" ? profile.picture : null,
        };
    },
});

const createDevProvider = () =>
    Credentials({
        id: DEV_PROVIDER_ID,
        name: "Local Demo",
        credentials: {
            name: { label: "Name", type: "text" },
            email: { label: "Email", type: "email" },
        },
        authorize(credentials) {
            const email = typeof credentials.email === "string" && credentials.email.trim()
                ? credentials.email.trim()
                : "demo@musica.local";
            const name = typeof credentials.name === "string" && credentials.name.trim()
                ? credentials.name.trim()
                : "Ritumoni Sarma";

            return {
                id: `dev-${email.toLowerCase()}`,
                name,
                email,
                image: null,
            };
        },
    });

const providers = [
    ...(oidcProviderConfigured ? [createOidcProvider()] : []),
    ...(devAuthEnabled ? [createDevProvider()] : []),
];

export const authConfig = {
    trustHost: true,
    session: {
        strategy: "jwt",
    },
    providers,
    callbacks: {
        jwt({ token, user }) {
            if (user?.id) {
                token.sub = user.id;
            }

            return token;
        },
        session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub ?? session.user.id;
            }

            return session;
        },
    },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
