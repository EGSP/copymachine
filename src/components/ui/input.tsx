import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "#/lib/utils"

type InputProps = React.ComponentProps<"input"> & {
  validate?: (value: string) => boolean
  blurOnEnter?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      validate,
      blurOnEnter = true,
      value,
      defaultValue,
      "aria-invalid": ariaInvalidProp,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const currentValue = value ?? defaultValue
    const normalizedValue =
      typeof currentValue === "string"
        ? currentValue
        : typeof currentValue === "number"
          ? String(currentValue)
          : ""
    const isInvalid =
      validate && normalizedValue.length > 0 ? !validate(normalizedValue) : false

    return (
      <InputPrimitive
        ref={ref}
        type={type}
        data-slot="input"
        value={value}
        defaultValue={defaultValue}
        aria-invalid={ariaInvalidProp ?? isInvalid}
        onKeyDown={(event) => {
          if (blurOnEnter && event.key === "Enter") {
            event.currentTarget.blur()
          }
          onKeyDown?.(event)
        }}
        className={cn(
          "h-8 w-full min-w-0 rounded-none border border-input bg-transparent px-2.5 py-1 text-xs transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 read-only:border-0 read-only:focus-visible:border-transparent read-only:focus-visible:ring-0 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 md:text-xs dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
