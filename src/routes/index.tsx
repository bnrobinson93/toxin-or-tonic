import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAction, useMutation, useQuery } from "convex/react";
import { nanoid } from "nanoid";
import { useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import GameBoard from "../components/game/GameBoard";
import GameResults from "../components/game/GameResults";
import ModeSelector from "../components/game/ModeSelector";
import LocationFallback from "../components/location/LocationFallback";
import LocationPrompt from "../components/location/LocationPrompt";
import RegionDisplay from "../components/location/RegionDisplay";
import { useLocation } from "../hooks/useLocation";
import type { Difficulty } from "../lib/scoring";

export const Route = createFileRoute("/")({ component: HomePage });

type GameState =
	| { phase: "select" }
	| {
			phase: "playing";
			sessionId: Id<"gameSessions">;
			difficulty: Difficulty;
	  }
	| {
			phase: "results";
			difficulty: Difficulty;
			totalScore: number;
			rounds: Array<{
				primaryCorrect: boolean;
				bonusCorrect: boolean;
				score: number;
				plantName: string;
			}>;
	  };

const ANON_ID_KEY = "tot_anonymous_id";
const SEEN_PLANTS_PREFIX = "tot_seen_plants_";

function getAnonymousId(): string {
	let id = localStorage.getItem(ANON_ID_KEY);
	if (!id) {
		id = nanoid();
		localStorage.setItem(ANON_ID_KEY, id);
	}
	return id;
}

function getSeenPlantIds(regionCode: string): string[] {
	try {
		const raw = localStorage.getItem(SEEN_PLANTS_PREFIX + regionCode);
		if (!raw) return [];
		return JSON.parse(raw) as string[];
	} catch {
		return [];
	}
}

function addSeenPlantIds(regionCode: string, ids: string[]) {
	const existing = getSeenPlantIds(regionCode);
	const merged = [...new Set([...existing, ...ids])];
	localStorage.setItem(SEEN_PLANTS_PREFIX + regionCode, JSON.stringify(merged));
}

function clearSeenPlantIds(regionCode: string) {
	localStorage.removeItem(SEEN_PLANTS_PREFIX + regionCode);
}

function HomePage() {
	const navigate = useNavigate();
	const {
		location,
		loading: locationLoading,
		needsPrompt,
		needsFallback,
		requestGeolocation,
		setManualLocation,
	} = useLocation();

	const [gameState, setGameState] = useState<GameState>({ phase: "select" });
	const [startingGame, setStartingGame] = useState(false);

	const startGame = useMutation(api.games.startGame);
	const syncRegion = useAction(api.plantSync.syncRegion);

	// Fetch random plants when a difficulty is selected
	const [pendingDifficulty, setPendingDifficulty] = useState<Difficulty | null>(
		null,
	);
	const [randomThreshold, setRandomThreshold] = useState(() => Math.random());
	const [syncing, setSyncing] = useState(false);
	const [syncError, setSyncError] = useState<string | null>(null);
	const syncAttemptedRef = useRef<string | null>(null);
	const lastUsedPlantIds = useRef<string[]>([]);

	const seenPlantIds = location ? getSeenPlantIds(location.regionCode) : [];

	const randomPlants = useQuery(
		api.plants.getRandomPlants,
		pendingDifficulty && location
			? {
					regionCode: location.regionCode,
					difficulty: pendingDifficulty,
					count: 3,
					excludeIds:
						seenPlantIds.length > 0
							? (seenPlantIds as Id<"plants">[])
							: undefined,
					randomThreshold,
				}
			: "skip",
	);

	// Auto-sync when not enough plants for the selected region
	useEffect(() => {
		if (!pendingDifficulty || !location || startingGame || syncing) return;
		if (!randomPlants || randomPlants.length >= 3) return;
		// Only attempt once per region to avoid loops
		if (syncAttemptedRef.current === location.regionCode) return;

		// If we have seen plants but got < 3 results, the pool may be exhausted.
		// Try clearing seen list first before fetching more from the API.
		const seen = getSeenPlantIds(location.regionCode);
		if (seen.length > 0 && randomPlants.length < 3) {
			clearSeenPlantIds(location.regionCode);
			setRandomThreshold(Math.random());
			return;
		}

		syncAttemptedRef.current = location.regionCode;
		setSyncing(true);
		setSyncError(null);

		// Use offset based on how many plants we've already seen to fetch the next batch
		const offset = seen.length;
		syncRegion({ regionCode: location.regionCode, offset })
			.then((result) => {
				if (result.plantsAdded === 0 && result.plantsUpdated === 0) {
					setSyncError(
						`No plant data available from Flora API for ${location.regionCode}.`,
					);
					setPendingDifficulty(null);
				} else {
					// Convex reactive query will auto-update with new data.
					// Bump the threshold to re-query.
					setRandomThreshold(Math.random());
				}
			})
			.catch((err) => {
				console.error("Auto-sync failed:", err);
				setSyncError(`Failed to fetch plant data: ${String(err)}`);
				setPendingDifficulty(null);
			})
			.finally(() => setSyncing(false));
	}, [
		randomPlants,
		pendingDifficulty,
		location,
		startingGame,
		syncing,
		syncRegion,
	]);

	useEffect(() => {
		if (!randomPlants || !pendingDifficulty || !location || startingGame)
			return;
		if (randomPlants.length < 3) return;

		const doStart = async () => {
			setStartingGame(true);
			try {
				const playerId = getAnonymousId();
				const plantIds = randomPlants.slice(0, 3).map((p) => p._id);
				lastUsedPlantIds.current = plantIds as string[];
				const sessionId = await startGame({
					playerId,
					isAnonymous: true,
					difficulty: pendingDifficulty,
					regionCode: location.regionCode,
					latitude: location.latitude,
					longitude: location.longitude,
					locationLabel: location.locationLabel,
					plantIds,
				});

				setGameState({
					phase: "playing",
					sessionId,
					difficulty: pendingDifficulty,
				});
				setPendingDifficulty(null);
			} catch (err) {
				console.error("Failed to start game:", err);
			} finally {
				setStartingGame(false);
			}
		};

		doStart();
	}, [randomPlants, pendingDifficulty, location, startGame, startingGame]);

	const handleModeSelect = (difficulty: Difficulty) => {
		if (!location) return;
		setSyncError(null);
		// Reset sync attempt if trying a new difficulty
		syncAttemptedRef.current = null;
		setPendingDifficulty(difficulty);
	};

	const handleGameComplete = (result: {
		totalScore: number;
		rounds: Array<{
			primaryCorrect: boolean;
			bonusCorrect: boolean;
			score: number;
			plantName: string;
			plantId?: string;
		}>;
	}) => {
		if (gameState.phase !== "playing") return;

		// Track seen plants to avoid repetition
		if (location && lastUsedPlantIds.current.length > 0) {
			addSeenPlantIds(location.regionCode, lastUsedPlantIds.current);
		}

		setGameState({
			phase: "results",
			difficulty: gameState.difficulty,
			totalScore: result.totalScore,
			rounds: result.rounds,
		});
	};

	const handlePlayAgain = () => {
		syncAttemptedRef.current = null;
		setRandomThreshold(Math.random());
		setGameState({ phase: "select" });
	};

	const handleViewLeaderboard = () => {
		navigate({ to: "/leaderboard" });
	};

	// Location setup
	if (locationLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	if (needsPrompt) {
		return (
			<div className="flex items-center justify-center min-h-[60vh] px-4">
				<LocationPrompt
					onAllow={requestGeolocation}
					onDeny={() => setManualLocation("OR", "Oregon")}
					loading={locationLoading}
				/>
			</div>
		);
	}

	if (needsFallback || !location) {
		return (
			<div className="flex items-center justify-center min-h-[60vh] px-4">
				<LocationFallback onSelect={setManualLocation} />
			</div>
		);
	}

	return (
		<div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
			{gameState.phase === "select" && (
				<div className="text-center mb-4">
					<RegionDisplay
						locationLabel={location.locationLabel}
						regionCode={location.regionCode}
					/>
				</div>
			)}

			{gameState.phase === "select" && (
				<>
					{syncError ? (
						<div className="flex items-center justify-center py-12">
							<div className="text-center space-y-3">
								<p className="text-sm text-destructive">{syncError}</p>
								<button
									onClick={() => {
										setSyncError(null);
										syncAttemptedRef.current = null;
									}}
									className="text-sm text-primary hover:underline"
								>
									Try again
								</button>
							</div>
						</div>
					) : pendingDifficulty || startingGame ? (
						<div className="flex items-center justify-center py-12">
							<div className="text-center space-y-2">
								<div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
								<p className="text-sm text-muted-foreground">
									{syncing
										? `Fetching plant data for ${location.regionCode}...`
										: "Setting up your game..."}
								</p>
							</div>
						</div>
					) : (
						<ModeSelector onSelect={handleModeSelect} />
					)}
				</>
			)}

			{gameState.phase === "playing" && (
				<GameBoard
					sessionId={gameState.sessionId}
					difficulty={gameState.difficulty}
					onGameComplete={handleGameComplete}
				/>
			)}

			{gameState.phase === "results" && (
				<GameResults
					difficulty={gameState.difficulty}
					totalScore={gameState.totalScore}
					rounds={gameState.rounds}
					regionCode={location.regionCode}
					onPlayAgain={handlePlayAgain}
					onViewLeaderboard={handleViewLeaderboard}
				/>
			)}
		</div>
	);
}
