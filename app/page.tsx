"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowDownUp, Copy, MapPin, RotateCcw } from "lucide-react"
import { convertCoordinates } from "@/lib/coordinate-converter"

export default function CoordinateConverterApp() {
  // State management
  const [decimalDegrees, setDecimalDegrees] = useState({ latitude: "", longitude: "" })
  const [dms, setDms] = useState({
    latDegrees: "",
    latMinutes: "",
    latSeconds: "",
    latDirection: "N",
    longDegrees: "",
    longMinutes: "",
    longSeconds: "",
    longDirection: "E",
  })
  const [utm, setUtm] = useState({ easting: "", northing: "", zone: "37", hemisphere: "N" })
  const [sourceDatum, setSourceDatum] = useState("WGS84")
  const [targetDatum, setTargetDatum] = useState("Adindan")
  const [results, setResults] = useState(null)
  const [copyFeedback, setCopyFeedback] = useState({ visible: false, type: "" })
  const [showCredit, setShowCredit] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowCredit(true), 500)
    return () => clearTimeout(timer)
  }, [])

  // Conversion handler
  const handleConvert = (format) => {
    try {
      let convertedCoordinates
      switch (format) {
        case "decimal":
          convertedCoordinates = convertCoordinates({
            type: "decimal",
            datum: sourceDatum,
            targetDatum: targetDatum,
            latitude: parseFloat(decimalDegrees.latitude),
            longitude: parseFloat(decimalDegrees.longitude),
          })
          break
        case "dms":
          convertedCoordinates = convertCoordinates({
            type: "dms",
            datum: sourceDatum,
            targetDatum: targetDatum,
            latDegrees: parseInt(dms.latDegrees),
            latMinutes: parseInt(dms.latMinutes),
            latSeconds: parseFloat(dms.latSeconds),
            latDirection: dms.latDirection,
            longDegrees: parseInt(dms.longDegrees),
            longMinutes: parseInt(dms.longMinutes),
            longSeconds: parseFloat(dms.longSeconds),
            longDirection: dms.longDirection,
          })
          break
        case "utm":
          convertedCoordinates = convertCoordinates({
            type: "utm",
            datum: sourceDatum,
            targetDatum: targetDatum,
            easting: parseFloat(utm.easting),
            northing: parseFloat(utm.northing),
            zone: parseInt(utm.zone),
            hemisphere: utm.hemisphere,
          })
          break
      }
      setResults(convertedCoordinates)
    } catch (error) {
      console.error("Conversion error:", error)
    }
  }

  // Utility functions
  const swapDatums = () => {
    const temp = sourceDatum
    setSourceDatum(targetDatum)
    setTargetDatum(temp)
  }

  const resetInputs = (format) => {
    switch (format) {
      case "decimal":
        setDecimalDegrees({ latitude: "", longitude: "" })
        break
      case "dms":
        setDms({
          latDegrees: "",
          latMinutes: "",
          latSeconds: "",
          latDirection: "N",
          longDegrees: "",
          longMinutes: "",
          longSeconds: "",
          longDirection: "E",
        })
        break
      case "utm":
        setUtm({ easting: "", northing: "", zone: "37", hemisphere: "N" })
        break
    }
    setResults(null)
  }

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopyFeedback({ visible: true, type })
        setTimeout(() => setCopyFeedback({ visible: false, type: "" }), 2000)
      },
      (err) => console.error("Copy failed:", err)
    )
  }

  const generateGoogleMapsUrl = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-teal-800 via-teal-600 to-amber-300 p-4">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white">Coordinate Converter</h1>
        <p className="text-amber-100">Convert between WGS 84 and Adindan datums</p>
      </header>

      <Card className="w-full max-w-xl mx-auto shadow-md">
        <CardHeader>
          <CardTitle>Coordinate Input</CardTitle>
          <CardDescription>Select input format and datum</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
            <div className="w-full sm:w-auto space-y-1">
              <Label htmlFor="source-datum">Source Datum</Label>
              <Select value={sourceDatum} onValueChange={setSourceDatum}>
                <SelectTrigger id="source-datum" className="w-full sm:w-[130px]">
                  <SelectValue placeholder="Select datum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WGS84">WGS 84</SelectItem>
                  <SelectItem value="Adindan">Adindan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="icon" onClick={swapDatums} className="mx-2 mt-6" aria-label="Swap datums">
              <ArrowDownUp className="h-4 w-4" />
            </Button>

            <div className="w-full sm:w-auto space-y-1">
              <Label htmlFor="target-datum">Target Datum</Label>
              <Select value={targetDatum} onValueChange={setTargetDatum}>
                <SelectTrigger id="target-datum" className="w-full sm:w-[130px]">
                  <SelectValue placeholder="Select datum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WGS84">WGS 84</SelectItem>
                  <SelectItem value="Adindan">Adindan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="decimal" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4 w-full">
              <TabsTrigger value="decimal">Decimal</TabsTrigger>
              <TabsTrigger value="dms">DMS</TabsTrigger>
              <TabsTrigger value="utm">UTM</TabsTrigger>
            </TabsList>

            {/* Decimal Degrees Input */}
            <TabsContent value="decimal" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="decimal-lat">Latitude</Label>
                <Input
                  id="decimal-lat"
                  type="number"
                  step="0.000001"
                  placeholder="e.g. 37.7749"
                  value={decimalDegrees.latitude}
                  onChange={(e) => setDecimalDegrees({ ...decimalDegrees, latitude: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="decimal-long">Longitude</Label>
                <Input
                  id="decimal-long"
                  type="number"
                  step="0.000001"
                  placeholder="e.g. -122.4194"
                  value={decimalDegrees.longitude}
                  onChange={(e) => setDecimalDegrees({ ...decimalDegrees, longitude: e.target.value })}
                />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => resetInputs("decimal")}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
                <Button onClick={() => handleConvert("decimal")}>Convert</Button>
              </div>
            </TabsContent>

            {/* Degrees Minutes Seconds Input */}
            <TabsContent value="dms" className="space-y-4">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Input
                    type="number"
                    placeholder="Deg"
                    value={dms.latDegrees}
                    onChange={(e) => setDms({ ...dms, latDegrees: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Min"
                    value={dms.latMinutes}
                    onChange={(e) => setDms({ ...dms, latMinutes: e.target.value })}
                  />
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="Sec"
                    value={dms.latSeconds}
                    onChange={(e) => setDms({ ...dms, latSeconds: e.target.value })}
                  />
                  <Select value={dms.latDirection} onValueChange={(value) => setDms({ ...dms, latDirection: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N">N</SelectItem>
                      <SelectItem value="S">S</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Longitude</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Input
                    type="number"
                    placeholder="Deg"
                    value={dms.longDegrees}
                    onChange={(e) => setDms({ ...dms, longDegrees: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Min"
                    value={dms.longMinutes}
                    onChange={(e) => setDms({ ...dms, longMinutes: e.target.value })}
                  />
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="Sec"
                    value={dms.longSeconds}
                    onChange={(e) => setDms({ ...dms, longSeconds: e.target.value })}
                  />
                  <Select value={dms.longDirection} onValueChange={(value) => setDms({ ...dms, longDirection: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="E">E</SelectItem>
                      <SelectItem value="W">W</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => resetInputs("dms")}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
                <Button onClick={() => handleConvert("dms")}>Convert</Button>
              </div>
            </TabsContent>

            {/* UTM Input */}
            <TabsContent value="utm" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="utm-easting">Easting</Label>
                <Input
                  id="utm-easting"
                  type="number"
                  placeholder="e.g. 500000"
                  value={utm.easting}
                  onChange={(e) => setUtm({ ...utm, easting: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="utm-northing">Northing</Label>
                <Input
                  id="utm-northing"
                  type="number"
                  placeholder="e.g. 4000000"
                  value={utm.northing}
                  onChange={(e) => setUtm({ ...utm, northing: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="utm-zone">Zone</Label>
                  <Select value={utm.zone} onValueChange={(value) => setUtm({ ...utm, zone: value })}>
                    <SelectTrigger id="utm-zone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      <SelectItem value="37">37 (Default)</SelectItem>
                      {Array.from({ length: 60 }, (_, i) => i + 1)
                        .filter((zone) => zone !== 37)
                        .map((zone) => (
                          <SelectItem key={zone} value={zone.toString()}>
                            {zone}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="utm-hemisphere">Hemisphere</Label>
                  <Select value={utm.hemisphere} onValueChange={(value) => setUtm({ ...utm, hemisphere: value })}>
                    <SelectTrigger id="utm-hemisphere">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N">Northern</SelectItem>
                      <SelectItem value="S">Southern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => resetInputs("utm")}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
                <Button onClick={() => handleConvert("utm")}>Convert</Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        {results && (
          <CardFooter className="flex flex-col">
            <div className="w-full border-t pt-4">
              <h3 className="font-medium mb-2">Conversion Results ({targetDatum})</h3>

              {results.decimal && (
                <div className="mb-2">
                  <p className="text-sm font-medium">Decimal Degrees:</p>
                  <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                    <p className="text-sm font-mono">
                      Lat: {results.decimal.latitude.toFixed(6)}, Lon: {results.decimal.longitude.toFixed(6)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() =>
                        copyToClipboard(
                          `${results.decimal.latitude.toFixed(6)}, ${results.decimal.longitude.toFixed(6)}`,
                          "decimal"
                        )
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  {copyFeedback.visible && copyFeedback.type === "decimal" && (
                    <p className="text-xs text-green-600 mt-1">Copied to clipboard!</p>
                  )}
                </div>
              )}

              {results.dms && (
                <div className="mb-2">
                  <p className="text-sm font-medium">Degrees Minutes Seconds:</p>
                  <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                    <p className="text-sm font-mono break-all">
                      {results.dms.latDegrees}°{results.dms.latMinutes}'{results.dms.latSeconds.toFixed(3)}"
                      {results.dms.latDirection} {results.dms.longDegrees}°{results.dms.longMinutes}'
                      {results.dms.longSeconds.toFixed(3)}"{results.dms.longDirection}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0 ml-2"
                      onClick={() =>
                        copyToClipboard(
                          `${results.dms.latDegrees}°${results.dms.latMinutes}'${results.dms.latSeconds.toFixed(3)}"${results.dms.latDirection} ${results.dms.longDegrees}°${results.dms.longMinutes}'${results.dms.longSeconds.toFixed(3)}"${results.dms.longDirection}`,
                          "dms"
                        )
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  {copyFeedback.visible && copyFeedback.type === "dms" && (
                    <p className="text-xs text-green-600 mt-1">Copied to clipboard!</p>
                  )}
                </div>
              )}

              {results.utm && (
                <div className="mb-2">
                  <p className="text-sm font-medium">UTM:</p>
                  <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                    <p className="text-sm font-mono">
                      {results.utm.zone}
                      {results.utm.hemisphere} {results.utm.easting.toFixed(2)}E {results.utm.northing.toFixed(2)}N
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() =>
                        copyToClipboard(
                          `${results.utm.zone}${results.utm.hemisphere} ${results.utm.easting.toFixed(2)}E ${results.utm.northing.toFixed(2)}N`,
                          "utm"
                        )
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  {copyFeedback.visible && copyFeedback.type === "utm" && (
                    <p className="text-xs text-green-600 mt-1">Copied to clipboard!</p>
                  )}
                </div>
              )}

              {results.decimal && (
                <div className="flex items-center space-x-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(generateGoogleMapsUrl(results.decimal.latitude, results.decimal.longitude), "_blank")
                    }
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    View on Google Maps
                  </Button>
                </div>
              )}
            </div>
          </CardFooter>
        )}
      </Card>

      <footer className="mt-8 text-center text-sm text-amber-100">
        <div
          className={`mb-4 inline-block bg-black bg-opacity-50 text-white px-3 py-1 rounded-md text-sm transition-opacity duration-500 ${
            showCredit ? "opacity-100" : "opacity-0"
          }`}
        >
          Developed by Yusuf Mohammednur
        </div>
        <p>Geographic Coordinate Converter - WGS 84 and Adindan Datum</p>
        <p className="mt-1">Support our cause! Contribute via Telebirr at 0913373481</p>
      </footer>
    </div>
  )
}
