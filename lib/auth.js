import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      profile(profile) {
        console.log("Azure AD Profile received:", profile);
        return {
          id: profile.sub || profile.oid,
          name: profile.name || profile.preferred_username,
          email: profile.email || profile.preferred_username || profile.upn,
          image: null,
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.log("SignIn Callback ->", { user, account, profile });
      return true; // Always allow sign in
    },
    async jwt({ token, user, account, profile }) {
      if (account) {
        token.id = profile?.sub || profile?.oid || user?.id;
        token.email = user?.email || profile?.preferred_username || profile?.upn;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email || session.user.email;
      }
      return session;
    }
  }
};