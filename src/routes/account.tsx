import { useAuth, useUser } from "@clerk/tanstack-react-start";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";
import AccountPageComponent from "../components/auth/AccountPage";

export const Route = createFileRoute("/account")({ component: AccountRoute });

const ANON_ID_KEY = "tot_anonymous_id";

function AccountRoute() {
	const navigate = useNavigate();
	const { isSignedIn, isLoaded } = useAuth();
	const { user } = useUser();

	const getOrCreateProfile = useMutation(api.users.getOrCreateProfile);
	const claimAnonymousGames = useMutation(api.games.claimAnonymousGames);

	// Redirect to home if not signed in
	useEffect(() => {
		if (isLoaded && !isSignedIn) {
			navigate({ to: "/" });
		}
	}, [isLoaded, isSignedIn, navigate]);

	// Create/update profile and claim anonymous games on sign-in
	useEffect(() => {
		if (!user) return;

		const setup = async () => {
			await getOrCreateProfile({
				clerkUserId: user.id,
				displayName:
					user.fullName ?? user.emailAddresses[0]?.emailAddress ?? "Player",
				avatarUrl: user.imageUrl,
				email: user.emailAddresses[0]?.emailAddress,
			});

			// Claim any anonymous games
			const anonymousId = localStorage.getItem(ANON_ID_KEY);
			if (anonymousId) {
				await claimAnonymousGames({
					anonymousId,
					clerkUserId: user.id,
					displayName: user.fullName ?? "Player",
					avatarUrl: user.imageUrl,
				});
				// Keep the anonymous ID for future unauthenticated sessions
			}
		};

		setup();
	}, [user, getOrCreateProfile, claimAnonymousGames]);

	if (!isLoaded) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	if (!isSignedIn) return null;

	return <AccountPageComponent />;
}
