import * as React from "react"
import { cn } from "@/lib/utils/cn"

const ToggleGroupContext = React.createContext({
  value: null,
  onValueChange: () => {},
  type: "single"
})

const ToggleGroup = React.forwardRef(
  ({ className, type = "single", value, onValueChange, ...props }, ref) => {
    return (
      <ToggleGroupContext.Provider value={{ value, onValueChange, type }}>
        <div
          ref={ref}
          className={cn(
            "inline-flex items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
            className
          )}
          {...props}
        />
      </ToggleGroupContext.Provider>
    )
  }
)
ToggleGroup.displayName = "ToggleGroup"

const ToggleGroupItem = React.forwardRef(
  ({ className, children, value: itemValue, ...props }, ref) => {
    const context = React.useContext(ToggleGroupContext)
    const isSelected = context.value === itemValue

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => context.onValueChange(itemValue)}
        data-state={isSelected ? "on" : "off"}
        className={cn(
          "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          isSelected 
            ? "bg-background text-foreground shadow-sm" 
            : "hover:bg-background/50",
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
ToggleGroupItem.displayName = "ToggleGroupItem"

export { ToggleGroup, ToggleGroupItem }
