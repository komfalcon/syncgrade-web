import * as React from "react";
import { motion, type Variants } from "framer-motion";

import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Droplets,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
  VolumeX,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── Self-contained color palette (Motorsport Red) ────────────────────

const palette = {
  "--background": "#0a0a0a",
  "--surface": "#161618",
  "--surface-elevated": "#1e1e22",
  "--foreground": "#fafafa",
  "--foreground-muted": "#a1a1aa",
  "--foreground-subtle": "#71717a",
  "--primary": "#e11d48",
  "--primary-hover": "#f43f5e",
  "--primary-foreground": "#ffffff",
  "--accent": "#f59e0b",
  "--accent-foreground": "#fafafa",
  "--secondary": "rgba(225, 29, 72, 0.15)",
  "--destructive": "#ef4444",
  "--destructive-foreground": "#fafafa",
  "--success": "#10b981",
  "--warning": "#f59e0b",
  "--border": "#27272a",
  "--border-strong": "#3f3f46",
  "--ring": "#e11d48",
  "--radius": "1rem",
  "--input": "#161618",
} as React.CSSProperties;

// ─── Types ────────────────────────────────────────────────────────────

type TireCategory = "summer" | "winter" | "all-season" | "performance" | "off-road";

interface TirePerformance {
  dry: number;
  wet: number;
  comfort: number;
  longevity: number;
}

interface TireSpecs {
  width: number;
  aspectRatio: number;
  diameter: number;
  loadIndex?: number;
  speedRating?: string;
}

export interface TireItem {
  id: string;
  brand: string;
  model: string;
  specs: TireSpecs;
  price: number;
  originalPrice?: number;
  currency: string;
  features: string[];
  rating: number;
  category: TireCategory;
  performance: TirePerformance;
  badge?: "best-seller" | "new" | "sale";
}

export interface TireSectionProps {
  title?: string;
  subtitle?: string;
  description?: string;
  tires?: TireItem[];
  className?: string;
}

// ─── Animation Variants ───────────────────────────────────────────────

const sectionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const headerVariants: Variants = {
  hidden: { opacity: 0, y: -24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 200, damping: 24, delay: 0.1 },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 48, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 24 },
  },
};

// ─── Category / Badge Config ──────────────────────────────────────────

const categoryConfig: Record<TireCategory, { label: string; className: string }> = {
  summer: { label: "Summer", className: "bg-warning/10 text-warning border-warning/20" },
  winter: { label: "Winter", className: "bg-primary/10 text-primary border-primary/20" },
  "all-season": { label: "All Season", className: "bg-success/10 text-success border-success/20" },
  performance: { label: "Performance", className: "bg-accent/10 text-accent border-accent/20" },
  "off-road": { label: "Off-Road", className: "bg-foreground-muted/10 text-foreground-muted border-foreground-muted/20" },
};

const badgeConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  "best-seller": {
    label: "Best Seller",
    className: "bg-accent text-accent-foreground border-accent/50",
    icon: <TrendingUp className="size-3" />,
  },
  new: {
    label: "New",
    className: "bg-primary text-primary-foreground border-primary/50",
    icon: <Sparkles className="size-3" />,
  },
  sale: {
    label: "Sale",
    className: "bg-destructive/10 text-destructive border-destructive/30",
    icon: <Tag className="size-3" />,
  },
};

// ─── Tire Visual (Animated SVG) ───────────────────────────────────────

interface TireVisualProps {
  size?: number;
  hovered?: boolean;
  className?: string;
}

function TireVisual({ size = 140, hovered = false, className }: TireVisualProps) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <motion.div
        className="absolute rounded-full blur-3xl"
        style={{
          width: size * 0.85,
          height: size * 0.85,
          background: "rgba(225, 29, 72, 0.08)",
        }}
        animate={{ scale: hovered ? 1.4 : 1, opacity: hovered ? 0.6 : 0.3 }}
        transition={{ duration: 0.4 }}
      />

      <motion.svg
        viewBox="0 0 120 120"
        width={size}
        height={size}
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          duration: hovered ? 3 : 12,
          ease: "linear",
        }}
        className="relative z-10 drop-shadow-lg will-change-transform"
      >
        <circle cx="60" cy="60" r="58" fill="none" stroke="rgba(225, 29, 72, 0.15)" strokeWidth="1.5" />
        <circle cx="60" cy="60" r="56" fill="#0d0d0d" />
        <circle cx="60" cy="60" r="54" fill="none" stroke="#1c1c1c" strokeWidth="6" strokeDasharray="5 4" />
        <circle cx="60" cy="60" r="48" fill="none" stroke="#1c1c1c" strokeWidth="1" />
        <circle cx="60" cy="60" r="44" fill="none" stroke="#141414" strokeWidth="6" />
        <circle cx="60" cy="60" r="40" fill="none" stroke="#222222" strokeWidth="0.5" strokeDasharray="2 3" />
        <circle cx="60" cy="60" r="36" fill="none" stroke="#3a3a3a" strokeWidth="3" />
        <circle cx="60" cy="60" r="35" fill="none" stroke="#555555" strokeWidth="0.5" />
        <circle cx="60" cy="60" r="33" fill="#181818" />

        {[0, 72, 144, 216, 288].map((angle) => (
          <path
            key={angle}
            d="M 57 46 L 52 26 L 68 26 L 63 46 Z"
            fill="#242424"
            stroke="#3a3a3a"
            strokeWidth="0.5"
            transform={`rotate(${angle} 60 60)`}
          />
        ))}

        <circle cx="60" cy="60" r="14" fill="#242424" stroke="#3a3a3a" strokeWidth="1" />
        <circle cx="60" cy="60" r="12" fill="#1a1a1a" />
        <circle cx="60" cy="60" r="7" fill="#3a3a3a" />
        <circle cx="60" cy="60" r="5" fill="#e11d48" />

        {[0, 72, 144, 216, 288].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 60 + 10 * Math.cos(rad);
          const cy = 60 + 10 * Math.sin(rad);
          return (
            <circle
              key={angle}
              cx={cx}
              cy={cy}
              r="2.5"
              fill="#4a4a4a"
              stroke="#6a6a6a"
              strokeWidth="0.5"
            />
          );
        })}
      </motion.svg>
    </div>
  );
}

// ─── Performance Bar ───────────────────────────────────────────────────

interface PerformanceBarProps {
  label: string;
  value: number;
  barColor: string;
  icon: React.ReactNode;
  animated?: boolean;
}

function PerformanceBar({ label, value, barColor, icon, animated = false }: PerformanceBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-foreground-muted">
          {icon}
          {label}
        </span>
        <span className="font-mono text-xs font-semibold text-foreground">
          {value}
          <span className="text-foreground-subtle">%</span>
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-border/60">
        <motion.div
          className={cn("h-full rounded-full", barColor)}
          initial={{ width: 0 }}
          animate={animated ? { width: `${value}%` } : { width: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        />
      </div>
    </div>
  );
}

// ─── Tire Card ─────────────────────────────────────────────────────────

interface TireCardProps {
  tire: TireItem;
}

function TireCard({ tire }: TireCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [animateBars, setAnimateBars] = React.useState(false);

  React.useEffect(() => {
    const timeout = setTimeout(() => setAnimateBars(true), 600);
    return () => clearTimeout(timeout);
  }, []);

  const {
    brand,
    model,
    specs,
    price,
    originalPrice,
    currency,
    features,
    rating,
    category,
    performance,
    badge,
  } = tire;

  return (
    <motion.div variants={cardVariants}>
      <motion.div
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="group relative overflow-hidden rounded-xl border border-border bg-surface/60 backdrop-blur-xl"
        whileHover={{
          y: -8,
          borderColor: "rgba(225, 29, 72, 0.4)",
          boxShadow: "0 16px 48px rgba(225, 29, 72, 0.1)",
          transition: { type: "spring", stiffness: 300, damping: 20 },
        }}
      >
        {/* Badge */}
        {badge && badgeConfig[badge] && (
          <div className="absolute right-3 top-3 z-20">
            <Badge
              className={cn(
                "gap-1 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider shadow-sm",
                badgeConfig[badge].className,
              )}
            >
              {badgeConfig[badge].icon}
              {badgeConfig[badge].label}
            </Badge>
          </div>
        )}

        {/* Card Inner */}
        <div className="p-5">
          {/* Top Row: Tire Visual + Key Info */}
          <div className="flex gap-4">
            {/* Tire Visual */}
            <div className="shrink-0 self-start">
              <TireVisual size={100} hovered={isHovered} />
            </div>

            {/* Info Column */}
            <div className="min-w-0 flex-1 space-y-1.5">
              {/* Brand & Model */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-foreground-muted">
                  {brand}
                </p>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold tracking-tight text-foreground">
                    {model}
                  </h3>
                </div>
              </div>

              {/* Category + Specs Row */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] font-medium leading-none",
                    categoryConfig[category].className,
                  )}
                >
                  {categoryConfig[category].label}
                </Badge>
                <span className="text-[11px] font-mono font-medium text-foreground-muted">
                  {specs.width}/{specs.aspectRatio}R{specs.diameter}
                </span>
                {specs.loadIndex && specs.speedRating && (
                  <span className="text-[11px] font-mono text-foreground-subtle">
                    {specs.loadIndex}
                    {specs.speedRating}
                  </span>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "size-3 transition-colors",
                      i < Math.floor(rating)
                        ? "fill-[#f59e0b] text-[#f59e0b]"
                        : i < rating
                          ? "fill-[#f59e0b]/40 text-[#f59e0b]"
                          : "fill-none text-border-strong",
                    )}
                  />
                ))}
                <span className="ml-0.5 text-[11px] font-medium text-foreground-muted">
                  {rating.toFixed(1)}
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold tracking-tight text-[#e11d48]">
                  {currency}
                  {price.toFixed(2)}
                </span>
                {originalPrice && (
                  <span className="text-xs text-foreground-subtle line-through decoration-foreground-subtle/60">
                    {currency}
                    {originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Features */}
          {features.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {features.map((feature) => (
                <span
                  key={feature}
                  className="rounded-full border border-border/50 bg-surface-elevated/50 px-2.5 py-0.5 text-[10px] font-medium text-foreground-muted"
                >
                  {feature}
                </span>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="mt-4 border-t border-border/60" />

          {/* Performance */}
          <div className="mt-4 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
              Performance
            </p>
            <PerformanceBar
              label="Dry"
              value={performance.dry}
              barColor="bg-gradient-to-r from-[#e11d48] to-[#fb7185]"
              icon={<Zap className="size-3" />}
              animated={animateBars}
            />
            <PerformanceBar
              label="Wet"
              value={performance.wet}
              barColor="bg-gradient-to-r from-[#2563eb] to-[#60a5fa]"
              icon={<Droplets className="size-3" />}
              animated={animateBars}
            />
            <PerformanceBar
              label="Comfort"
              value={performance.comfort}
              barColor="bg-gradient-to-r from-[#059669] to-[#34d399]"
              icon={<VolumeX className="size-3" />}
              animated={animateBars}
            />
            <PerformanceBar
              label="Longevity"
              value={performance.longevity}
              barColor="bg-gradient-to-r from-[#d97706] to-[#fbbf24]"
              icon={<ShieldCheck className="size-3" />}
              animated={animateBars}
            />
          </div>

          {/* CTA */}
          <div className="mt-5">
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                className={cn(
                  "w-full gap-2 border-border/50 text-foreground-muted transition-all duration-300",
                  "hover:border-[#e11d48]/60 hover:bg-[#e11d48] hover:text-white",
                  "active:bg-[#be123c]",
                )}
              >
                View Details
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Default Tire Data ─────────────────────────────────────────────────

const defaultTires: TireItem[] = [
  {
    id: "1",
    brand: "Pilot Sport",
    model: "4 S",
    specs: { width: 225, aspectRatio: 45, diameter: 17, loadIndex: 91, speedRating: "Y" },
    price: 189.99,
    originalPrice: 219.99,
    currency: "$",
    features: ["Ultra-High Performance", "Max Grip", "90K Mileage"],
    rating: 4.8,
    category: "performance",
    performance: { dry: 96, wet: 88, comfort: 82, longevity: 85 },
    badge: "best-seller",
  },
  {
    id: "2",
    brand: "EcoContact",
    model: "7",
    specs: { width: 205, aspectRatio: 55, diameter: 16, loadIndex: 91, speedRating: "V" },
    price: 129.99,
    currency: "$",
    features: ["Fuel Efficient", "Low Noise", "60K Mileage"],
    rating: 4.5,
    category: "all-season",
    performance: { dry: 85, wet: 90, comfort: 92, longevity: 78 },
    badge: "new",
  },
  {
    id: "3",
    brand: "WinterClaw",
    model: "SUV Arctic",
    specs: { width: 235, aspectRatio: 60, diameter: 18, loadIndex: 104, speedRating: "H" },
    price: 219.99,
    originalPrice: 259.99,
    currency: "$",
    features: ["Severe Snow Rated", "3D Sipes", "50K Mileage"],
    rating: 4.7,
    category: "winter",
    performance: { dry: 72, wet: 82, comfort: 78, longevity: 88 },
    badge: "sale",
  },
  {
    id: "4",
    brand: "Scorpion",
    model: "Zero AS",
    specs: { width: 255, aspectRatio: 40, diameter: 20, loadIndex: 97, speedRating: "Y" },
    price: 349.99,
    currency: "$",
    features: ["Run-Flat", "Noise Canceling", "Electro-Fit"],
    rating: 4.9,
    category: "performance",
    performance: { dry: 98, wet: 85, comfort: 80, longevity: 82 },
    badge: "best-seller",
  },
  {
    id: "5",
    brand: "Energy Saver",
    model: "Eco+",
    specs: { width: 195, aspectRatio: 65, diameter: 15, loadIndex: 88, speedRating: "T" },
    price: 99.99,
    currency: "$",
    features: ["Low Rolling Resistance", "Eco-Friendly", "70K Mileage"],
    rating: 4.3,
    category: "summer",
    performance: { dry: 78, wet: 75, comfort: 88, longevity: 92 },
  },
  {
    id: "6",
    brand: "Trail Grappler",
    model: "M/T",
    specs: { width: 285, aspectRatio: 70, diameter: 17, loadIndex: 121, speedRating: "Q" },
    price: 289.99,
    currency: "$",
    features: ["Mud Terrain", "Armored Sidewall", "45K Mileage"],
    rating: 4.6,
    category: "off-road",
    performance: { dry: 82, wet: 68, comfort: 65, longevity: 90 },
  },
];

// ─── Main Component ────────────────────────────────────────────────────

export default function TireSection({
  title = "Premium Tires",
  subtitle = "Engineered for Performance",
  description = "High-performance tires engineered for superior grip, comfort, and durability across all driving conditions.",
  tires = defaultTires,
  className,
}: TireSectionProps) {
  return (
    <div
      style={palette}
      className={cn(
        "bg-background text-foreground antialiased",
        "relative overflow-hidden",
        "before:pointer-events-none before:absolute before:inset-0",
        "before:bg-[radial-gradient(ellipse_at_50%_-20%,rgba(225,29,72,0.06),transparent_60%)]",
        className,
      )}
    >
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="relative"
      >
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
          {/* Header */}
          <motion.div variants={headerVariants} className="mb-14 text-center md:mb-20">
            {/* Kicker */}
            <div className="mx-auto mb-5 flex items-center justify-center gap-3">
              <div className="h-px w-6 bg-[#e11d48]/50" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#e11d48]">
                {subtitle}
              </span>
              <div className="h-px w-6 bg-[#e11d48]/50" />
            </div>

            {/* Title */}
            <h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              {title}
            </h2>

            {/* Description */}
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-foreground-muted md:text-base">
              {description}
            </p>

            {/* Red accent bar */}
            <div className="mx-auto mt-8 flex items-center justify-center gap-2">
              <div className="h-0.5 w-4 rounded-full bg-[#e11d48]/40" />
              <div className="h-0.5 w-16 rounded-full bg-[#e11d48]" />
              <div className="h-0.5 w-4 rounded-full bg-[#e11d48]/40" />
            </div>
          </motion.div>

          {/* Grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {tires.map((tire) => (
              <TireCard key={tire.id} tire={tire} />
            ))}
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-14 text-center"
          >
            <Button
              variant="outline"
              size="lg"
              className={cn(
                "gap-2 border-[#e11d48]/30 text-[#e11d48] transition-all duration-300",
                "hover:bg-[#e11d48] hover:text-white hover:border-[#e11d48]",
              )}
            >
              View All Tires
              <ArrowRight className="size-4" />
            </Button>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
