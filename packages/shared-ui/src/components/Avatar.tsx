interface AvatarProps {
  src: string
  alt?: string
  size?: number
  ring?: boolean
}

export function Avatar({ src, alt = '', size = 44, ring = false }: AvatarProps) {
  if (!ring) {
    return (
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="flex-shrink-0 rounded-full object-cover"
      />
    )
  }
  return (
    <div
      className="rounded-full bg-gradient-to-br from-terracotta to-[#D4A574] p-[3px]"
      style={{ width: size, height: size }}
    >
      <img src={src} alt={alt} className="h-full w-full rounded-full border-[3px] border-sand object-cover" />
    </div>
  )
}