"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button, type ButtonProps } from "@/components/ui/button"

type LogoutButtonProps = {
  label?: string
} & ButtonProps

export function LogoutButton({ label = "退出登录", ...buttonProps }: LogoutButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    if (loading) return
    setLoading(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/auth/login")
      router.refresh()
    } catch (error) {
      console.error("logout error", error)
      setLoading(false)
    }
  }

  return (
    <Button {...buttonProps} onClick={handleLogout} disabled={loading || buttonProps.disabled}>
      {loading ? "正在退出..." : label}
    </Button>
  )
}
