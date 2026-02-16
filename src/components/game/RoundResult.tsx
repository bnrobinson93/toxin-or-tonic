import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
  Leaf,
  Utensils,
  ChevronDown,
  ChevronUp,
  Eye,
  MapPin,
  Flower2,
} from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import PlantImageGallery from "./PlantImageGallery";

interface GalleryImage {
  url: string;
  altText?: string;
  license?: string;
}

export interface PlantInfo {
  commonNames: string[];
  scientificName: string;
  category: string;
  medicinalUses: string[];
  edibleParts: string[];
  toxicityInfo?: string | null;
  nutritionalInfo?: string | null;
  description?: string | null;
  habitat?: string | null;
  identificationTips?: string[] | null;
  parsedMedicinalInfo?: string[] | null;
  parsedToxicityInfo?: string[] | null;
  parsedEdibilityInfo?: string[] | null;
  flowerColors?: string[] | null;
  bloomMonths?: string[] | null;
  plantHabits?: string[] | null;
  imageGallery?: GalleryImage[] | null;
  imageUrls?: string[] | null;
}

interface RoundResultProps {
  primaryCorrect: boolean;
  bonusCorrect: boolean;
  roundScore: number;
  plant: PlantInfo;
  onContinue: () => void;
  isLastRound: boolean;
}

const categoryColors: Record<string, string> = {
  edible: "bg-edible/20 text-edible",
  medicinal: "bg-medicinal/20 text-medicinal",
  neutral: "bg-neutral/20 text-neutral",
  poisonous: "bg-poisonous/20 text-poisonous",
};

export default function RoundResult({
  primaryCorrect,
  bonusCorrect,
  roundScore,
  plant,
  onContinue,
  isLastRound,
}: RoundResultProps) {
  const [showMore, setShowMore] = useState(false);
  const displayCategory =
    plant.category === "edible" ? "neutral" : plant.category;

  const toxicityItems = plant.parsedToxicityInfo?.length
    ? plant.parsedToxicityInfo
    : plant.toxicityInfo
      ? plant.toxicityInfo
          .split(/[,;]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  const medicinalItems = plant.parsedMedicinalInfo?.length
    ? plant.parsedMedicinalInfo
    : plant.medicinalUses.filter((u) => u !== "medicinal");

  const hasEnrichmentData = !!(
    plant.description ||
    plant.habitat ||
    plant.imageGallery?.length ||
    plant.imageUrls?.length ||
    plant.flowerColors?.length ||
    plant.bloomMonths?.length ||
    plant.plantHabits?.length ||
    plant.parsedEdibilityInfo?.length ||
    (plant.parsedMedicinalInfo?.length && displayCategory !== "medicinal") ||
    (plant.parsedToxicityInfo?.length && displayCategory !== "poisonous")
  );

  return (
    <Card className="max-w-lg mx-auto">
      <CardContent className="pt-6 space-y-4">
        {/* Score header */}
        <div className="flex items-center gap-3">
          {primaryCorrect ? (
            <CheckCircle className="h-8 w-8 text-edible flex-shrink-0" />
          ) : (
            <XCircle className="h-8 w-8 text-poisonous flex-shrink-0" />
          )}
          <div>
            <p className="font-display text-lg font-semibold">
              {primaryCorrect ? "Correct!" : "Not quite!"}
            </p>
            <p className="text-sm text-muted-foreground">
              +{roundScore} points this round
            </p>
          </div>
        </div>

        {/* Plant identity */}
        <div className="space-y-2 bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="font-display font-medium">
              {plant.commonNames[0] ?? plant.scientificName}
            </span>
            <Badge className={categoryColors[displayCategory] ?? ""}>
              {displayCategory}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground italic">
            {plant.scientificName}
          </p>

          {/* Context-aware cards */}
          {displayCategory === "poisonous" && (
            <>
              {toxicityItems.length > 0 && (
                <InfoCard
                  icon={
                    <AlertTriangle className="h-3.5 w-3.5 text-poisonous" />
                  }
                  title="Toxicity Warning"
                  titleClass="text-poisonous"
                  bgClass="bg-poisonous/10 border-poisonous/20"
                  items={toxicityItems}
                  itemClass="text-poisonous"
                />
              )}
              {plant.identificationTips?.length ? (
                <InfoCard
                  icon={<Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                  title="How to Identify"
                  items={plant.identificationTips}
                />
              ) : null}
            </>
          )}

          {displayCategory === "medicinal" && (
            <>
              {medicinalItems.length > 0 && (
                <InfoCard
                  icon={<Leaf className="h-3.5 w-3.5 text-medicinal" />}
                  title="Medicinal Uses"
                  titleClass="text-medicinal"
                  bgClass="bg-medicinal/10 border-medicinal/20"
                  items={medicinalItems}
                />
              )}
              {plant.parsedEdibilityInfo?.length ? (
                <InfoCard
                  icon={<Utensils className="h-3.5 w-3.5 text-edible" />}
                  title="Edibility"
                  titleClass="text-edible"
                  bgClass="bg-edible/10 border-edible/20"
                  items={plant.parsedEdibilityInfo}
                />
              ) : plant.edibleParts.length > 0 ? (
                <InfoCard
                  icon={<Utensils className="h-3.5 w-3.5 text-edible" />}
                  title="Edible Parts"
                  titleClass="text-edible"
                  bgClass="bg-edible/10 border-edible/20"
                  items={plant.edibleParts}
                />
              ) : null}
              {plant.identificationTips?.length ? (
                <InfoCard
                  icon={<Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                  title="How to Identify"
                  items={plant.identificationTips}
                />
              ) : null}
            </>
          )}

          {displayCategory === "neutral" && (
            <>
              {/* Show habitat/characteristics for neutral plants */}
              {(plant.habitat ||
                plant.plantHabits?.length ||
                plant.flowerColors?.length) && (
                <div className="mt-2 p-2 rounded-md bg-neutral/10 border border-neutral/20 space-y-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Flower2 className="h-3.5 w-3.5 text-neutral" />
                    <span className="text-xs font-semibold text-neutral">
                      About This Plant
                    </span>
                  </div>
                  {plant.plantHabits?.length ? (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Growth:</span>{" "}
                      {plant.plantHabits.join(", ")}
                    </p>
                  ) : null}
                  {plant.flowerColors?.length ? (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Flowers:</span>{" "}
                      {plant.flowerColors.join(", ")}
                    </p>
                  ) : null}
                  {plant.bloomMonths?.length ? (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Blooms:</span>{" "}
                      {plant.bloomMonths.join(", ")}
                    </p>
                  ) : null}
                  {plant.habitat && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Habitat:</span>{" "}
                      {plant.habitat.length > 120
                        ? plant.habitat.slice(0, 120) + "..."
                        : plant.habitat}
                    </p>
                  )}
                </div>
              )}
              {plant.identificationTips?.length ? (
                <InfoCard
                  icon={<Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                  title="How to Identify"
                  items={plant.identificationTips}
                />
              ) : null}
              {plant.edibleParts.length > 0 && (
                <InfoCard
                  icon={<Utensils className="h-3.5 w-3.5 text-edible" />}
                  title="Edible Parts"
                  titleClass="text-edible"
                  bgClass="bg-edible/10 border-edible/20"
                  items={plant.edibleParts}
                />
              )}
            </>
          )}
        </div>

        {bonusCorrect && (
          <p className="text-sm text-edible font-medium">
            Bonus correct! Nice depth of knowledge.
          </p>
        )}

        {/* Learn More expandable */}
        {hasEnrichmentData && (
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setShowMore(!showMore)}
              className="w-full flex items-center justify-between p-3 text-sm font-medium hover:bg-muted/50 transition-colors min-h-[44px]"
            >
              <span>Learn More</span>
              {showMore ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {showMore && (
              <div className="p-3 pt-0 space-y-3 animate-slide-up">
                {/* Image gallery */}
                {plant.imageGallery?.length || plant.imageUrls?.length ? (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                      Photos
                    </p>
                    <PlantImageGallery
                      images={plant.imageGallery ?? []}
                      fallbackUrls={plant.imageUrls ?? undefined}
                    />
                  </div>
                ) : null}

                {/* Description */}
                {plant.description && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Description
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {plant.description}
                    </p>
                  </div>
                )}

                {/* Habitat */}
                {plant.habitat && (
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs font-semibold text-muted-foreground">
                        Habitat
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {plant.habitat}
                    </p>
                  </div>
                )}

                {/* Physical characteristics */}
                {(plant.flowerColors?.length ||
                  plant.bloomMonths?.length ||
                  plant.plantHabits?.length) && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                      Physical Characteristics
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {plant.flowerColors?.length ? (
                        <div>
                          <span className="text-xs text-muted-foreground">
                            Flower Colors
                          </span>
                          <p className="font-medium">
                            {plant.flowerColors.join(", ")}
                          </p>
                        </div>
                      ) : null}
                      {plant.bloomMonths?.length ? (
                        <div>
                          <span className="text-xs text-muted-foreground">
                            Bloom Months
                          </span>
                          <p className="font-medium">
                            {plant.bloomMonths.join(", ")}
                          </p>
                        </div>
                      ) : null}
                      {plant.plantHabits?.length ? (
                        <div>
                          <span className="text-xs text-muted-foreground">
                            Growth Habit
                          </span>
                          <p className="font-medium">
                            {plant.plantHabits.join(", ")}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                {/* Full parsed details (show sections not already visible above) */}
                {displayCategory !== "poisonous" &&
                plant.parsedToxicityInfo?.length ? (
                  <InfoCard
                    icon={
                      <AlertTriangle className="h-3.5 w-3.5 text-poisonous" />
                    }
                    title="Toxicity Notes"
                    titleClass="text-poisonous"
                    bgClass="bg-poisonous/10 border-poisonous/20"
                    items={plant.parsedToxicityInfo}
                    itemClass="text-poisonous"
                  />
                ) : null}
                {displayCategory !== "medicinal" &&
                plant.parsedMedicinalInfo?.length ? (
                  <InfoCard
                    icon={<Leaf className="h-3.5 w-3.5 text-medicinal" />}
                    title="Medicinal Notes"
                    titleClass="text-medicinal"
                    bgClass="bg-medicinal/10 border-medicinal/20"
                    items={plant.parsedMedicinalInfo}
                  />
                ) : null}
                {plant.parsedEdibilityInfo?.length &&
                displayCategory !== "medicinal" ? (
                  <InfoCard
                    icon={<Utensils className="h-3.5 w-3.5 text-edible" />}
                    title="Edibility Notes"
                    titleClass="text-edible"
                    bgClass="bg-edible/10 border-edible/20"
                    items={plant.parsedEdibilityInfo}
                  />
                ) : null}
              </div>
            )}
          </div>
        )}

        <Button onClick={onContinue} className="w-full">
          {isLastRound ? "See Results" : "Next Round"}
        </Button>
      </CardContent>
    </Card>
  );
}

function InfoCard({
  icon,
  title,
  titleClass = "text-muted-foreground",
  bgClass = "bg-muted/50 border-border",
  items,
  itemClass = "text-muted-foreground",
}: {
  icon: React.ReactNode;
  title: string;
  titleClass?: string;
  bgClass?: string;
  items: string[];
  itemClass?: string;
}) {
  return (
    <div className={`mt-2 p-2 rounded-md border ${bgClass}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className={`text-xs font-semibold ${titleClass}`}>{title}</span>
      </div>
      <ul className={`list-disc list-inside text-sm space-y-0.5 ${itemClass}`}>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
