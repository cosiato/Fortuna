import { Icon } from "@iconify/react";
import { useRef, useState, useEffect, useCallback } from "react";
import type { Entity } from "@/types/database";
import { SupportedCurrency, formatCurrency } from "@/lib/currency";
import SlotMachineNumber from "@/components/SlotMachineNumber";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { motion } from "framer-motion";

interface EntitySelectorProps {
  entities: Entity[];
  selectedEntityId: number;
  onSelect: (entityId: number) => void;
  onAddCompany: () => void;
  onEditEntity?: (entity: Entity) => void;
  onDeleteEntity?: (entity: Entity) => void;
  entityTotals: Record<number, number>;
  displayCurrency: SupportedCurrency;
}

export default function EntitySelector({
  entities,
  selectedEntityId,
  onSelect,
  onAddCompany,
  onEditEntity,
  onDeleteEntity,
  entityTotals,
  displayCurrency,
}: EntitySelectorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [openPopoverId, setOpenPopoverId] = useState<number | null>(null);

  const updateScrollState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    updateScrollState();

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(container);

    container.addEventListener("scroll", updateScrollState);

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener("scroll", updateScrollState);
    };
  }, [updateScrollState, entities]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 200;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative flex items-center gap-2 mb-6">
      {/* Left scroll arrow */}
      <div
        className={`
          absolute left-0 z-10 flex items-center h-full
          transition-opacity duration-200
          ${canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
      >
        <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent pointer-events-none" />
        <button
          onClick={() => scroll("left")}
          className="relative z-10 p-1.5 rounded-full bg-slate-800/80 border border-slate-700/50 text-muted-foreground hover:text-foreground hover:bg-slate-700 transition-colors"
          aria-label="Scroll left"
        >
          <Icon icon="solar:alt-arrow-left-linear" width={16} height={16} />
        </button>
      </div>

      {/* Scrollable entities container */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2 overflow-x-auto scrollbar-hide scroll-smooth px-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {entities.map((entity) => {
          const isSelected = entity.id === selectedEntityId;
          const total = entityTotals[entity.id] ?? 0;
          const isCompany = entity.type === "company";

          return (
            <div key={entity.id} className="relative flex-shrink-0 group">
              <button
                onClick={() => onSelect(entity.id)}
                className={`
                  relative flex flex-col items-start gap-0.5 py-2 px-4 rounded-lg
                  border border-transparent
                  transition-all duration-200 ease-out min-w-[120px]
                  ${isCompany ? "pr-8" : ""}
                  ${
                    isSelected
                      ? "text-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }
                `}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeEntityBackground"
                    className="absolute inset-0 bg-accent/10 rounded-lg"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}
                <div className="relative flex items-center gap-2">
                  <Icon
                    icon={
                      entity.type === "individual"
                        ? "solar:user-linear"
                        : "solar:buildings-linear"
                    }
                    width={16}
                    height={16}
                  />
                  <span className="font-medium text-sm whitespace-nowrap">
                    {entity.name}
                  </span>
                </div>
                <SlotMachineNumber
                  value={formatCurrency(total, displayCurrency)}
                  className={`relative text-xs ${isSelected ? "text-accent/80" : "text-muted-foreground"}`}
                  duration={500}
                  staggerMs={20}
                />
              </button>

              {isCompany && (
                <Popover
                  open={openPopoverId === entity.id}
                  onOpenChange={(open) =>
                    setOpenPopoverId(open ? entity.id : null)
                  }
                >
                  <PopoverTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenPopoverId(
                          openPopoverId === entity.id ? null : entity.id,
                        );
                      }}
                      className={`absolute right-1 top-1 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-slate-700/50 transition-all duration-200 ${openPopoverId === entity.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                      aria-label="Entity options"
                    >
                      <Icon
                        icon="solar:menu-dots-bold"
                        width={14}
                        height={14}
                      />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-36 p-1 bg-[rgba(23,20,43,0.4)] backdrop-blur-xl border-slate-800/50"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenPopoverId(null);
                        onEditEntity?.(entity);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-slate-700/50 rounded-md transition-colors"
                    >
                      <Icon icon="solar:pen-linear" width={14} height={14} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenPopoverId(null);
                        onDeleteEntity?.(entity);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                    >
                      <Icon
                        icon="solar:trash-bin-trash-linear"
                        width={14}
                        height={14}
                      />
                      <span>Delete</span>
                    </button>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          );
        })}
      </div>

      {/* Right scroll arrow */}
      <div
        className={`
          absolute right-[110px] z-10 flex items-center h-full
          transition-opacity duration-200
          ${canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
      >
        <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        <button
          onClick={() => scroll("right")}
          className="relative z-10 p-1.5 rounded-full bg-slate-800/80 border border-slate-700/50 text-muted-foreground hover:text-foreground hover:bg-slate-700 transition-colors"
          aria-label="Scroll right"
        >
          <Icon icon="solar:alt-arrow-right-linear" width={16} height={16} />
        </button>
      </div>

      {/* Sticky Add Company button */}
      <div className="flex-shrink-0 pl-2 border-l border-slate-700/50">
        <Button
          variant="ghost"
          size="sm"
          className="h-auto py-2 px-3 text-muted-foreground hover:text-accent hover:bg-accent/10 flex items-center gap-1.5"
          onClick={onAddCompany}
        >
          <Icon icon="solar:add-circle-linear" width={16} height={16} />
          <span className="text-xs">Add</span>
        </Button>
      </div>
    </div>
  );
}
