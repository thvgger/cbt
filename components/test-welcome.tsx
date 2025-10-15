"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, FileText, Users, CheckCircle } from "lucide-react"

interface TestWelcomeProps {
  onStartTest: () => void
}

export function TestWelcome({ onStartTest }: TestWelcomeProps) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">
          Computer Science Fundamentals Assessment
        </h1>
        <p className="text-xl text-muted-foreground text-pretty">
          Test your knowledge of programming concepts, algorithms, and data structures
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <FileText className="h-5 w-5 text-primary" />
              Test Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-card-foreground">Questions:</span>
              <Badge variant="secondary">15 Questions</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-card-foreground">Duration:</span>
              <Badge variant="secondary">30 Minutes</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-card-foreground">Passing Score:</span>
              <Badge variant="secondary">70%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-card-foreground">Question Types:</span>
              <Badge variant="secondary">Multiple Choice</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <CheckCircle className="h-5 w-5 text-primary" />
              Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium mt-0.5">
                1
              </div>
              <p className="text-card-foreground text-sm">Read each question carefully before selecting your answer</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium mt-0.5">
                2
              </div>
              <p className="text-card-foreground text-sm">You can navigate between questions and change your answers</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium mt-0.5">
                3
              </div>
              <p className="text-card-foreground text-sm">Submit your test before time runs out</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium mt-0.5">
                4
              </div>
              <p className="text-card-foreground text-sm">Ensure stable internet connection throughout the test</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-muted/50 mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 text-center justify-center">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="text-foreground font-medium">Time Limit: 30 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-foreground font-medium">Individual Assessment</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button
          onClick={onStartTest}
          size="lg"
          className="px-8 py-3 text-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Start Test
        </Button>
        <p className="text-sm text-muted-foreground mt-4">
          By starting this test, you agree to complete it in one session
        </p>
      </div>
    </div>
  )
}
