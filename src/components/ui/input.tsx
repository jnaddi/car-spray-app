import React from "react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, label, error, ...props }, ref) => {
  return (
    <div>
      {label && <label htmlFor={props.id}>{label}</label>}
      <input
        type={type}
        className={`rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          error ? "border-red-500" : ""
        } ${className}`}
        ref={ref}
        {...props}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
})
Input.displayName = "Input"

export { Input }

