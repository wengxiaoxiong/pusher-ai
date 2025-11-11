"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Mode = "login" | "register"

const tabs: Array<{ key: Mode; label: string; description: string }> = [
  { key: "login", label: "登录", description: "输入注册时的邮箱和密码" },
  { key: "register", label: "注册", description: "创建一个新的 AiPusher 账号" },
]

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<Mode>("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const redirectParam = searchParams.get("redirectTo")
  const redirectTo = redirectParam && redirectParam.startsWith("/") ? redirectParam : "/dashboard"

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loading) return

    setLoading(true)
    setError(null)

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register"
      const payload =
        mode === "login"
          ? { email, password }
          : {
              name,
              email,
              password,
            }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "请求失败，请稍后再试")
      }

      router.push(redirectTo)
      router.refresh()
    } catch (err) {
      console.error("auth error", err)
      setError(err instanceof Error ? err.message : "请求失败，请稍后再试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 lg:flex-row">
        <div className="flex-1 space-y-4">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            返回首页
          </Link>
          <h1 className="text-4xl font-semibold">欢迎来到 AiPusher</h1>
          <p className="text-base text-muted-foreground">
            使用邮箱 + 密码即可登录，AI 会基于你的 Todo、里程碑和长期记忆提供拉齐与追问体验。
          </p>
          <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
            <p>✅ 14 天内自动保持登录</p>
            <p>✅ 数据安全存储在你的账户下</p>
            <p>✅ 随时可以在仪表盘中退出登录</p>
          </div>
        </div>

        <Card className="flex-1 border-2">
          <CardHeader>
            <CardTitle className="text-2xl">使用邮箱密码登录</CardTitle>
            <CardDescription>无需验证码，10 秒完成登录或注册</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex rounded-lg border bg-muted/40 p-1 text-sm font-medium">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setMode(tab.key)}
                  className={cn(
                    "flex-1 rounded-md px-3 py-2 transition-colors",
                    mode === tab.key ? "bg-background shadow-sm" : "text-muted-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <p className="mb-6 text-sm text-muted-foreground">
              {tabs.find((tab) => tab.key === mode)?.description}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground" htmlFor="name">
                    姓名
                  </label>
                  <Input
                    id="name"
                    placeholder="例如：张三"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required={mode === "register"}
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground" htmlFor="email">
                  邮箱
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground" htmlFor="password">
                  密码
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="至少 6 位字符"
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "处理中..." : mode === "login" ? "登录" : "注册并登录"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
