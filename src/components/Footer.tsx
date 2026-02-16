import { Leaf } from "lucide-react";

export default function Footer() {
	return (
		<footer className="border-t border-border bg-card/50 py-6">
			<div className="max-w-5xl mx-auto px-4 flex items-center justify-between text-sm text-muted-foreground">
				<div className="flex items-center gap-1.5">
					<Leaf className="h-4 w-4" />
					<span>Toxin or Tonic</span>
				</div>
				<span>Know your plants. Heal or harm?</span>
			</div>
		</footer>
	);
}
