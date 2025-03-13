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
  const [mapCoordinates, setMapCoordinates] = useState({ latitude: 0, longitude: 0 })
  const [copyFeedback, setCopyFeedback] = useState({ visible: false, type: "" })
  const [showCredit, setShowCredit] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowCredit(true), 500)
    return () => clearTimeout(timer)
  }, [])

  // Conversion handler
  const handleConvert = (format) => {
    let convertedCoordinates
    try {
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
      if (convertedCoordinates?.decimal) {
        setMapCoordinates({
          latitude: convertedCoordinates.decimal.latitude,
          longitude: convertedCoordinates.decimal.longitude
        })
      }
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
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">Coordinate Converter</h1>
        <p className="text-amber-100 text-lg">Convert between WGS84 and Adindan datums</p>
      </header>

      <Card className="w-full max-w-2xl mx-auto shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Coordinate Input</CardTitle>
          <CardDescription>Select input format and coordinate systems</CardDescription>
        </CardHeader>

        <CardContent>
          {/* Datum Selection */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
            <div className="w-full sm:w-auto space-y-1">
              <Label>Source Datum</Label>
              <Select value={sourceDatum} onValueChange={setSourceDatum}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WGS84">WGS 84</SelectItem>
                  <SelectItem value="Adindan">Adindan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              variant="outline" 
              size="icon" 
              onClick={swapDatums}
              className="mx-2 mt-6 hover:bg-teal-100/20"
              aria-label="Swap datums"
            >
              <ArrowDownUp className="h-5 w-5" />
            </Button>

            <div className="w-full sm:w-auto space-y-1">
              <Label>Target Datum</Label>
              <Select value={targetDatum} onValueChange={setTargetDatum}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WGS84">WGS 84</SelectItem>
                  <SelectItem value="Adindan">Adindan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Input Tabs */}
          <Tabs defaultValue="decimal" className="w-full">
            <TabsList className="grid grid-cols-3 mb-6 w-full bg-teal-50">
              <TabsTrigger value="decimal">Decimal°</TabsTrigger>
              <TabsTrigger value="dms">DMS</TabsTrigger>
              <TabsTrigger value="utm">UTM</TabsTrigger>
            </TabsList>

            {/* Decimal Input */}
            <TabsContent value="decimal" className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base">Latitude</Label>
                <Input
                  type="number"
                  step="0.000001"
                  placeholder="9.0125"
                  value={decimalDegrees.latitude}
                  onChange={(e) => setDecimalDegrees({ ...decimalDegrees, latitude: e.target.value })}
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-base">Longitude</Label>
                <Input
                  type="number"
                  step="0.000001"
                  placeholder="38.0364"
                  value={decimalDegrees.longitude}
                  onChange={(e) => setDecimalDegrees({ ...decimalDegrees, longitude: e.target.value })}
                  className="h-12 text-base"
                />
              </div>
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => resetInputs("decimal")}
                  className="gap-2 hover:bg-amber-50/20"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Fields
                </Button>
                <Button 
                  onClick={() => handleConvert("decimal")}
                  className="bg-teal-600 hover:bg-teal-700 px-8"
                >
                  Convert
                </Button>
              </div>
            </TabsContent>

            {/* DMS Input */}
            <TabsContent value="dms" className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base">Latitude</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Input
                    type="number"
                    placeholder="Deg"
                    value={dms.latDegrees}
                    onChange={(e) => setDms({ ...dms, latDegrees: e.target.value })}
                    className="h-12"
                  />
                  <Input
                    type="number"
                    placeholder="Min"
                    value={dms.latMinutes}
                    onChange={(e) => setDms({ ...dms, latMinutes: e.target.value })}
                    className="h-12"
                  />
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="Sec"
                    value={dms.latSeconds}
                    onChange={(e) => setDms({ ...dms, latSeconds: e.target.value })}
                    className="h-12"
                  />
                  <Select 
                    value={dms.latDirection} 
                    onValueChange={(v) => setDms({ ...dms, latDirection: v })}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N">North</SelectItem>
                      <SelectItem value="S">South</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base">Longitude</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Input
                    type="number"
                    placeholder="Deg"
                    value={dms.longDegrees}
                    onChange={(e) => setDms({ ...dms, longDegrees: e.target.value })}
                    className="h-12"
                  />
                  <Input
                    type="number"
                    placeholder="Min"
                    value={dms.longMinutes}
                    onChange={(e) => setDms({ ...dms, longMinutes: e.target.value })}
                    className="h-12"
                  />
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="Sec"
                    value={dms.longSeconds}
                    onChange={(e) => setDms({ ...dms, longSeconds: e.target.value })}
                    className="h-12"
                  />
                  <Select 
                    value={dms.longDirection} 
                    onValueChange={(v) => setDms({ ...dms, longDirection: v })}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="E">East</SelectItem>
                      <SelectItem value="W">West</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => resetInputs("dms")}
                  className="gap-2 hover:bg-amber-50/20"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                <Button 
                  onClick={() => handleConvert("dms")}
                  className="bg-teal-600 hover:bg-teal-700 px-8"
                >
                  Convert
                </Button>
              </div>
            </TabsContent>

            {/* UTM Input */}
            <TabsContent value="utm" className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base">Easting</Label>
                <Input
                  type="number"
                  placeholder="500000"
                  value={utm.easting}
                  onChange={(e) => setUtm({ ...utm, easting: e.target.value })}
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-base">Northing</Label>
                <Input
                  type="number"
                  placeholder="4000000"
                  value={utm.northing}
                  onChange={(e) => setUtm({ ...utm, northing: e.target.value })}
                  className="h-12 text-base"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-base">Zone</Label>
                  <Select value={utm.zone} onValueChange={(v) => setUtm({ ...utm, zone: v })}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="37">37 (Default)</SelectItem>
                      {Array.from({ length: 60 }, (_, i) => i + 1)
                        .filter(zone => zone !== 37)
                        .map(zone => (
                          <SelectItem key={zone} value={zone.toString()}>{zone}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-base">Hemisphere</Label>
                  <Select value={utm.hemisphere} onValueChange={(v) => setUtm({ ...utm, hemisphere: v })}>
                    <SelectTrigger className="h-12">
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
                <Button 
                  variant="outline" 
                  onClick={() => resetInputs("utm")}
                  className="gap-2 hover:bg-amber-50/20"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Fields
                </Button>
                <Button 
                  onClick={() => handleConvert("utm")}
                  className="bg-teal-600 hover:bg-teal-700 px-8"
                >
                  Convert
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        {/* Results Display */}
        {results && (
          <CardFooter className="flex flex-col border-t pt-6">
            <div className="w-full space-y-4">
              <h3 className="text-xl font-semibold mb-4">Conversion Results ({targetDatum})</h3>

              {results.decimal && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Decimal Degrees:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(
                        `${results.decimal.latitude.toFixed(6)}, ${results.decimal.longitude.toFixed(6)}`,
                        "decimal"
                      )}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <div className="bg-teal-50/30 p-4 rounded-lg">
                    <code className="font-mono text-sm break-all">
                      Lat: {results.decimal.latitude.toFixed(6)}
                      <br />
                      Lon: {results.decimal.longitude.toFixed(6)}
                    </code>
                  </div>
                </div>
              )}

              {results.dms && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Degrees Minutes Seconds:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(
                        `${results.dms.latDegrees}°${results.dms.latMinutes}'${results.dms.latSeconds.toFixed(3)}"${results.dms.latDirection} ` +
                        `${results.dms.longDegrees}°${results.dms.longMinutes}'${results.dms.longSeconds.toFixed(3)}"${results.dms.longDirection}`,
                        "dms"
                      )}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <div className="bg-teal-50/30 p-4 rounded-lg">
                    <code className="font-mono text-sm">
                      {results.dms.latDegrees}°{results.dms.latMinutes}'{results.dms.latSeconds.toFixed(3)}"
                      {results.dms.latDirection}
                      <br />
                      {results.dms.longDegrees}°{results.dms.longMinutes}'{results.dms.longSeconds.toFixed(3)}"
                      {results.dms.longDirection}
                    </code>
                  </div>
                </div>
              )}

              {results.utm && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">UTM Coordinates:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(
                        `${results.utm.zone}${results.utm.hemisphere} ` +
                        `${results.utm.easting.toFixed(2)}E ` +
                        `${results.utm.northing.toFixed(2)}N`,
                        "utm"
                      )}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <div className="bg-teal-50/30 p-4 rounded-lg">
                    <code className="font-mono text-sm">
                      Zone {results.utm.zone}{results.utm.hemisphere}
                      <br />
                      Easting: {results.utm.easting.toFixed(2)} m
                      <br />
                      Northing: {results.utm.northing.toFixed(2)} m
                    </code>
                  </div>
                </div>
              )}

              {results.decimal && (
                <div className="mt-6">
                  <Button
                    variant="outline"
                    className="w-full bg-teal-600/20 hover:bg-teal-700/30"
                    onClick={() => window.open(generateGoogleMapsUrl(
                      results.decimal.latitude,
                      results.decimal.longitude
                    ), "_blank")}
                  >
                    <MapPin className="h-5 w-5 mr-2" />
                    View in Google Maps
                  </Button>
                </div>
              )}
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Professional Attribution Footer */}
      <footer className="mt-12 text-center space-y-4">
        <div className={`inline-block bg-black/50 backdrop-blur-lg text-white px-6 py-3 rounded-2xl 
          transition-all duration-700 ease-out transform ${
            showCredit ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="text-sm font-medium text-teal-300 mb-1">
            Geospatial Engineering Solutions
          </div>
          <div className="text-xs text-amber-100">
            Developed by <span className="font-semibold text-amber-200">Eng. Yusuf Mohammednur</span>
          </div>
        </div>

        <div className="text-amber-100 text-sm space-y-1">
          <p>Advanced Coordinate Transformation System</p>
          <p className="text-xs text-amber-200/90">
            Support our cause! Contribute via Telebirr: 
            <span className="font-mono bg-black/25 px-2 py-1 rounded-md ml-1">
              0913-373481
            </span>
          </p>
        </div>
      </footer>

      {/* Global Animations */}
      <style jsx global>{`
        @keyframes gradientFlow {
          0% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
        
        .bg-gradient-to-br {
          background-size: 200% 200%;
          animation: gradientFlow 20s ease infinite;
        }
      `}</style>
    </div>
  )
}
