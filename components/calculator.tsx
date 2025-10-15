"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X } from "lucide-react"

interface CalculatorProps {
  onClose: () => void
}

export function Calculator({ onClose }: CalculatorProps) {
  const [display, setDisplay] = useState("0")
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [operation, setOperation] = useState<string | null>(null)
  const [newNumber, setNewNumber] = useState(true)

  function handleNumber(num: string) {
    if (newNumber) {
      setDisplay(num)
      setNewNumber(false)
    } else {
      setDisplay(display === "0" ? num : display + num)
    }
  }

  function handleDecimal() {
    if (newNumber) {
      setDisplay("0.")
      setNewNumber(false)
    } else if (!display.includes(".")) {
      setDisplay(display + ".")
    }
  }

  function handleOperation(op: string) {
    const current = Number.parseFloat(display)

    if (previousValue === null) {
      setPreviousValue(current)
    } else if (operation) {
      const result = calculate(previousValue, current, operation)
      setDisplay(String(result))
      setPreviousValue(result)
    }

    setOperation(op)
    setNewNumber(true)
  }

  function calculate(a: number, b: number, op: string): number {
    switch (op) {
      case "+":
        return a + b
      case "-":
        return a - b
      case "×":
        return a * b
      case "÷":
        return b !== 0 ? a / b : 0
      default:
        return b
    }
  }

  function handleEquals() {
    if (operation && previousValue !== null) {
      const current = Number.parseFloat(display)
      const result = calculate(previousValue, current, operation)
      setDisplay(String(result))
      setPreviousValue(null)
      setOperation(null)
      setNewNumber(true)
    }
  }

  function handleClear() {
    setDisplay("0")
    setPreviousValue(null)
    setOperation(null)
    setNewNumber(true)
  }

  function handleBackspace() {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1))
    } else {
      setDisplay("0")
      setNewNumber(true)
    }
  }

  const buttonClass = "h-12 text-lg font-medium"
  const operationClass = "h-12 text-lg font-medium bg-primary/10 hover:bg-primary/20"

  return (
    <Card className="w-80 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Calculator</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-lg text-right">
          <div className="text-sm text-muted-foreground h-5">
            {previousValue !== null && operation && `${previousValue} ${operation}`}
          </div>
          <div className="text-3xl font-bold font-mono break-all">{display}</div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <Button variant="outline" onClick={handleClear} className={buttonClass}>
            C
          </Button>
          <Button variant="outline" onClick={handleBackspace} className={buttonClass}>
            ←
          </Button>
          <Button variant="outline" onClick={() => handleOperation("÷")} className={operationClass}>
            ÷
          </Button>
          <Button variant="outline" onClick={() => handleOperation("×")} className={operationClass}>
            ×
          </Button>

          <Button variant="outline" onClick={() => handleNumber("7")} className={buttonClass}>
            7
          </Button>
          <Button variant="outline" onClick={() => handleNumber("8")} className={buttonClass}>
            8
          </Button>
          <Button variant="outline" onClick={() => handleNumber("9")} className={buttonClass}>
            9
          </Button>
          <Button variant="outline" onClick={() => handleOperation("-")} className={operationClass}>
            -
          </Button>

          <Button variant="outline" onClick={() => handleNumber("4")} className={buttonClass}>
            4
          </Button>
          <Button variant="outline" onClick={() => handleNumber("5")} className={buttonClass}>
            5
          </Button>
          <Button variant="outline" onClick={() => handleNumber("6")} className={buttonClass}>
            6
          </Button>
          <Button variant="outline" onClick={() => handleOperation("+")} className={operationClass}>
            +
          </Button>

          <Button variant="outline" onClick={() => handleNumber("1")} className={buttonClass}>
            1
          </Button>
          <Button variant="outline" onClick={() => handleNumber("2")} className={buttonClass}>
            2
          </Button>
          <Button variant="outline" onClick={() => handleNumber("3")} className={buttonClass}>
            3
          </Button>
          <Button
            variant="outline"
            onClick={handleEquals}
            className="row-span-2 h-auto bg-primary text-primary-foreground hover:bg-primary/90"
          >
            =
          </Button>

          <Button variant="outline" onClick={() => handleNumber("0")} className={`${buttonClass} col-span-2`}>
            0
          </Button>
          <Button variant="outline" onClick={handleDecimal} className={buttonClass}>
            .
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
