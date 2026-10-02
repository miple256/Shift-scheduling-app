import type { Member } from '../types'

export function Avatar({ member, size = 36 }: { member: Member; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: size, height: size, background: member.color, fontSize: size * 0.4 }}
    >
      {member.initial}
    </div>
  )
}
