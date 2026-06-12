import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* ─── Types ─── */

interface TireSpecs {
  width: number;
  aspectRatio: number;
  diameter: number;
  speedRating: string;
  loadIndex: number;
}

interface Tire {
  id: string;
  name: string;
  tagline: string;
  category: "summer" | "winter" | "all-season" | "performance";
  specs: TireSpecs;
  price: number;
  rating: number;
  badge?: string;
}

type TireCategory = Tire["category"] | "all";

/* ─── Data ─── */

const TIRES: Tire[] = [
  {
    id: "pilot-sport-4s",
    name: "Pilot Sport 4S",
    tagline: "Ultimate street-legal track tire",
    category: "performance",
    specs: { width: 245, aspectRatio: 35, diameter: 19, speedRating: "Y", loadIndex: 93 },
    price: 118900,
    rating: 4.9,
    badge: "Best Seller",
  },
  {
    id: "winter-contact-7",
    name: "WinterContact 7",
    tagline: "Uncompromising winter grip",
    category: "winter",
    specs: { width: 225, aspectRatio: 45, diameter: 18, speedRating: "V", loadIndex: 91 },
    price: 84900,
    rating: 4.8,
    badge: "Top Rated",
  },
  {
    id: "primacy-touring",
    name: "Primacy Touring A/S",
    tagline: "Silent confidence in any weather",
    category: "all-season",
    specs: { width: 215, aspectRatio: 55, diameter: 17, speedRating: "H", loadIndex: 94 },
    price: 72900,
    rating: 4.6,
  },
  {
    id: "p-zero-pz4",
    name: "P Zero PZ4",
    tagline: "Born on the racetrack",
    category: "performance",
    specs: { width: 265, aspectRatio: 30, diameter: 20, speedRating: "Y", loadIndex: 95 },
    price: 134900,
    rating: 4.9,
    badge: "New",
  },
  {
    id: "alpin-6",
    name: "Alpin 6",
    tagline: "Winter mastery, refined",
    category: "winter",
    specs: { width: 235, aspectRatio: 40, diameter: 19, speedRating: "W", loadIndex: 92 },
    price: 96900,
    rating: 4.7,
  },
  {
    id: "crossclimate-2",
    name: "CrossClimate 2",
    tagline: "Three-season genius",
    category: "all-season",
    specs: { width: 225, aspectRatio: 50, diameter: 18, speedRating: "V", loadIndex: 96 },
    price: 82900,
    rating: 4.8,
    badge: "Eco Rated",
  },
];

const CATEGORIES: { value: TireCategory; label: string }[] = [
  { value: "all", label: "All Tires" },
  { value: "performance", label: "Performance" },
  { value: "summer", label: "Summer" },
  { value: "winter", label: "Winter" },
  { value: "all-season", label: "All Season" },
];

/* ─── Variants ─── */

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 24 } },
};

const scaleInItem = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 200, damping: 20 } },
};

/* ─── Sub-components ─── */

function TireTreadRing({ spinning = false }: { spinning?: boolean }) {
  return (
    <svg viewBox="0 0 160 160" className="h-32 w-32 md:h-40 md:w-40">
      <defs>
        <linearGradient id="tire-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
          <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="tire-grad-hover" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.5" />
          <stop offset="50%" stopColor="var(--destructive)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      <motion.g
        animate={spinning ? { rotate: 360 } : { rotate: 0 }}
        transition={spinning ? { repeat: Infinity, duration: 3, ease: "linear" } : { duration: 0.6, ease: "easeOut" }}
        style={{ transformOrigin: "80px 80px" }}
      >
        <circle cx="80" cy="80" r="72" fill="none" stroke="var(--border-strong)" strokeWidth="12" />
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.line
            key={i}
            x1={80 + 60 * Math.cos((i * 30 * Math.PI) / 180)}
            y1={80 + 60 * Math.sin((i * 30 * Math.PI) / 180)}
            x2={80 + 72 * Math.cos((i * 30 * Math.PI) / 180)}
            y2={80 + 72 * Math.sin((i * 30 * Math.PI) / 180)}
            stroke={i % 2 === 0 ? "var(--foreground-muted)" : "var(--foreground-subtle)"}
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ opacity: 0.4 }}
            animate={{ opacity: spinning ? [0.4, 1, 0.4] : 0.6 }}
            transition={{ duration: 1.5, repeat: spinning ? Infinity : 0, delay: i * 0.05 }}
          />
        ))}
      </motion.g>

      <circle cx="80" cy="80" r="46" fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
      <circle cx="80" cy="80" r="36" fill="none" stroke="var(--foreground-subtle)" strokeWidth="2" />

      <motion.circle
        cx="80" cy="80" r="14"
        fill="var(--surface-elevated)"
        stroke="var(--primary)"
        strokeWidth="2"
        whileHover={{ scale: 1.1 }}
      />
      <circle cx="80" cy="80" r="4" fill="var(--primary)" />

      {Array.from({ length: 5 }).map((_, i) => (
        <line
          key={`spoke-${i}`}
          x1={80 + 14 * Math.cos((i * 72 * Math.PI) / 180)}
          y1={80 + 14 * Math.sin((i * 72 * Math.PI) / 180)}
          x2={80 + 46 * Math.cos((i * 72 * Math.PI) / 180)}
          y2={80 + 46 * Math.sin((i * 72 * Math.PI) / 180)}
          stroke="var(--border-strong)"
          strokeWidth="2"
          opacity={0.6}
        />
      ))}
    </svg>
  );
}

function TireSpecBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-border bg-surface-elevated/50 px-2 py-1.5">
      <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">{label}</span>
      <span className="text-sm font-bold text-foreground">{value}</span>
    </div>
  );
}

function TirePrice({ amount }: { amount: number }) {
  const formatted = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount);
  return (
    <span className="font-mono text-lg font-bold text-foreground">
      {formatted}
    </span>
  );
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = i < full ? "full" : i === full && hasHalf ? "half" : "empty";
        return (
          <svg key={i} className="h-3 w-3" viewBox="0 0 20 20" fill={fill === "full" ? "var(--warning)" : "var(--border)"}>
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
        );
      })}
      <span className="ml-1 text-xs font-semibold text-foreground-muted">{rating.toFixed(1)}</span>
    </div>
  );
}

function TireCard({ tire, index }: { tire: Tire; index: number }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      variants={scaleInItem}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative"
    >
      <motion.div
        className={cn(
          "relative flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-lg transition-colors duration-300 md:p-6",
          "hover:border-primary/30",
        )}
        whileHover={{ y: -6 }}
        transition={{ type: "spring" as const, stiffness: 200, damping: 20 }}
      >
        {tire.badge && (
          <Badge variant="outline" className={cn(
            "absolute right-4 top-4 z-10 border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
            tire.badge === "Best Seller" && "border-destructive/40 bg-destructive/10 text-destructive",
            tire.badge === "Top Rated" && "border-primary/40 bg-primary/10 text-primary",
            tire.badge === "New" && "border-accent/40 bg-accent/10 text-accent",
            tire.badge === "Eco Rated" && "border-success/40 bg-success/10 text-success",
          )}>
            {tire.badge}
          </Badge>
        )}

        <div className="flex items-center justify-center py-4">
          <motion.div
            animate={{ rotate: isHovered ? 360 : 0 }}
            transition={isHovered ? { repeat: Infinity, duration: 8, ease: "linear" } : { duration: 0.6 }}
          >
            <TireTreadRing spinning={isHovered} />
          </motion.div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-foreground">{tire.name}</h3>
            <StarRating rating={tire.rating} />
          </div>
          <p className="text-sm text-foreground-muted">{tire.tagline}</p>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          <TireSpecBadge label="Width" value={`${tire.specs.width}`} />
          <TireSpecBadge label="Aspect" value={`${tire.specs.aspectRatio}`} />
          <TireSpecBadge label="Dia." value={`${tire.specs.diameter}"`} />
          <TireSpecBadge label="Speed" value={tire.specs.speedRating} />
          <TireSpecBadge label="Load" value={`${tire.specs.loadIndex}`} />
        </div>

        <p className="text-center font-mono text-xs font-semibold text-foreground-subtle tracking-wide">
          {tire.specs.width}/{tire.specs.aspectRatio}R{tire.specs.diameter} {tire.specs.speedRating} {tire.specs.loadIndex}
        </p>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <TirePrice amount={tire.price} />
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Button size="sm" className="gap-1.5 px-4 text-xs font-semibold">
              View Details
              <motion.span
                animate={{ x: isHovered ? 3 : 0 }}
                transition={{ duration: 0.2 }}
              >
                →
              </motion.span>
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main Component ─── */

export default function TireShowcase() {
  const [activeCategory, setActiveCategory] = useState<TireCategory>("all");

  const filtered = activeCategory === "all"
    ? TIRES
    : TIRES.filter((t) => t.category === activeCategory);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-surface/50 py-12 md:py-16">
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
        <div className="h-full w-full bg-[radial-gradient(ellipse_at_top,_var(--primary)_0%,_transparent_60%)]" />
        <div className="h-full w-full bg-[radial-gradient(ellipse_at_bottom_right,_var(--destructive)_0%,_transparent_50%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" as const, stiffness: 260, damping: 18, delay: 0.1 }}
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-destructive/20"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            </svg>
          </motion.div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Premium Performance <span className="bg-gradient-to-r from-primary to-destructive bg-clip-text text-transparent">Tires</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-foreground-muted">
            Engineered for precision. Designed for the drive. Discover our curated collection of ultra-high-performance tires.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mb-8 flex flex-wrap items-center justify-center gap-2"
        >
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat.value}
              type="button"
              onClick={() => setActiveCategory(cat.value)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={cn(
                "relative rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-200",
                activeCategory === cat.value
                  ? "bg-primary text-primary-foreground shadow-[0_0_12px_-2px_var(--primary)/0.4]"
                  : "border border-border bg-surface-elevated/50 text-foreground-muted hover:border-primary/30 hover:text-foreground",
              )}
            >
              {activeCategory === cat.value && (
                <motion.span
                  layoutId="tire-category-pill"
                  className="absolute inset-0 rounded-full bg-primary"
                  transition={{ type: "spring" as const, stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{cat.label}</span>
            </motion.button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((tire, i) => (
              <TireCard key={tire.id} tire={tire} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 py-16 text-center"
          >
            <p className="text-lg font-semibold text-foreground-muted">No tires found</p>
            <p className="text-sm text-foreground-subtle">Try a different category</p>
            <Button variant="outline" size="sm" onClick={() => setActiveCategory("all")}>
              View All Tires
            </Button>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-10 text-center"
        >
          <p className="mb-3 text-xs text-foreground-subtle">
            All tires come with manufacturer warranty &amp; free fitting
          </p>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-block">
            <Button variant="outline" size="lg" className="gap-2 rounded-full border-primary/30 px-8 text-sm font-semibold">
              Browse Full Catalog
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              >
                →
              </motion.span>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
