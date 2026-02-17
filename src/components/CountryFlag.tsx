import { Icon } from "@iconify/react"

interface CountryFlagProps {
  code: string
  size?: number
  className?: string
}

export default function CountryFlag({ code, size = 20, className }: CountryFlagProps) {
  const lower = code.toLowerCase()

  if (lower === "btc") {
    return (
      <span
        className={className}
        style={{ fontSize: size, lineHeight: 1, display: "inline-block", width: size, textAlign: "center" }}
      >
        {"\u20BF"}
      </span>
    )
  }

  return (
    <Icon
      icon={`circle-flags:${lower}`}
      width={size}
      height={size}
      className={className}
    />
  )
}
