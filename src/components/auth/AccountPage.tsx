import { useUser } from "@clerk/tanstack-react-start";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Trophy, Gamepad2, TrendingUp, Star } from "lucide-react";

export default function AccountPage() {
  const { user } = useUser();

  const stats = useQuery(
    api.users.getPlayerStats,
    user ? { clerkUserId: user.id } : "skip",
  );

  if (!user) return null;

  const profile = stats?.profile;
  const recentGames = stats?.recentGames ?? [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.imageUrl} />
              <AvatarFallback className="text-xl">
                {user.firstName?.charAt(0) ??
                  user.emailAddresses[0]?.emailAddress.charAt(0) ??
                  "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-display font-bold">
                {user.fullName ?? user.emailAddresses[0]?.emailAddress}
              </h1>
              <p className="text-sm text-muted-foreground">
                {user.emailAddresses[0]?.emailAddress}
              </p>
              {profile?.preferredRegion && (
                <Badge variant="outline" className="mt-1 text-xs">
                  {profile.preferredRegion}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {profile && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={<Gamepad2 className="h-4 w-4" />}
            label="Games Played"
            value={profile.totalGamesPlayed}
          />
          <StatCard
            icon={<Star className="h-4 w-4" />}
            label="Total Score"
            value={profile.totalScore}
          />
          <StatCard
            icon={<Trophy className="h-4 w-4" />}
            label="Highest Score"
            value={profile.highestScore}
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Average"
            value={profile.averageScore}
          />
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display">Recent Games</CardTitle>
        </CardHeader>
        <CardContent>
          {recentGames.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No games yet. Go play!
            </p>
          ) : (
            <div className="space-y-2">
              {recentGames.map((game) => (
                <div
                  key={game._id}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {game.difficulty}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {game.regionCode}
                    </span>
                    <Badge
                      variant={
                        game.status === "completed" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {game.status}
                    </Badge>
                  </div>
                  <span className="font-mono text-sm">{game.totalScore}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 text-center">
        <div className="flex justify-center mb-1 text-muted-foreground">
          {icon}
        </div>
        <p className="text-lg font-bold font-mono">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
