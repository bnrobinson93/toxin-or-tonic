import {
	SignedIn,
	SignedOut,
	SignInButton,
	UserButton,
	useUser,
} from "@clerk/tanstack-react-start";
import { Link } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { Leaf, Trophy } from "lucide-react";
import { useEffect, useRef } from "react";
import { api } from "../../convex/_generated/api";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";

const ANON_ID_KEY = "tot_anonymous_id";

function useClaimOnSignIn() {
	const { user } = useUser();
	const claimAnonymousGames = useMutation(api.games.claimAnonymousGames);
	const getOrCreateProfile = useMutation(api.users.getOrCreateProfile);
	const claimedRef = useRef<string | null>(null);

	useEffect(() => {
		if (!user) return;
		// Only claim once per user session
		if (claimedRef.current === user.id) return;
		claimedRef.current = user.id;

		const claim = async () => {
			await getOrCreateProfile({
				clerkUserId: user.id,
				displayName:
					user.fullName ?? user.emailAddresses[0]?.emailAddress ?? "Player",
				avatarUrl: user.imageUrl,
				email: user.emailAddresses[0]?.emailAddress,
			});

			const anonymousId = localStorage.getItem(ANON_ID_KEY);
			if (anonymousId) {
				await claimAnonymousGames({
					anonymousId,
					clerkUserId: user.id,
					displayName: user.fullName ?? "Player",
					avatarUrl: user.imageUrl,
				});
			}
		};

		claim();
	}, [user, claimAnonymousGames, getOrCreateProfile]);
}

export default function GameShell({ children }: { children: React.ReactNode }) {
	useClaimOnSignIn();
	return (
		<div className="min-h-screen flex flex-col">
			<header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
				<div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
					<Link
						to="/"
						className="flex items-center gap-2 hover:opacity-80 transition-opacity"
					>
						<Leaf className="h-6 w-6 text-primary" />
						<span className="font-display text-xl font-semibold text-primary">
							Toxin or Tonic
						</span>
					</Link>

					<nav className="flex items-center gap-2">
						<Link
							to="/leaderboard"
							className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
							activeProps={{
								className:
									"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-primary bg-primary/10",
							}}
						>
							<Trophy className="h-4 w-4" />
							Leaderboard
						</Link>
					</nav>

					<div className="flex items-center gap-2">
						<ThemeToggle />
						<SignedIn>
							<Link
								to="/account"
								className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-2"
								activeProps={{
									className: "text-sm font-medium text-primary mr-2",
								}}
							>
								Account
							</Link>
							<UserButton />
						</SignedIn>
						<SignedOut>
							<SignInButton mode="modal">
								<Button variant="outline" size="sm">
									Sign In
								</Button>
							</SignInButton>
						</SignedOut>
					</div>
				</div>
			</header>

			<main className="flex-1">{children}</main>
		</div>
	);
}
