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
  // State management (unchanged)
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
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [showCredit, setShowCredit] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowCredit(true), 500)
    return () => clearTimeout(timer)
  }, [])

  // Conversion handler and utility functions (unchanged)

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-teal-800 via-teal-600 to-amber-300 p-4 sm:p-6">
      <header className="text-center mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 drop-shadow-lg">Coordinate Converter</h1>
        <p className="text-amber-100 text-sm sm:text-lg">Transform between WGS84 and Adindan datums</p>
      </header>

      <Card className="w-full max-w-2xl mx-auto shadow-2xl">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-xl sm:text-2xl">Geospatial Transformation</CardTitle>
          <CardDescription className="text-sm sm:text-base">Select input format and coordinate systems</CardDescription>
        </CardHeader>

        <CardContent className="px-4 sm:px-6">
          {/* Datum Selection */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-3">
            <div className="w-full sm:w-[45%] space-y-1">
              <Label className="text-sm sm:text-base">Source Datum</Label>
              <Select value={sourceDatum} onValueChange={setSourceDatum}>
                <SelectTrigger className="h-10 sm:h-12">
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
              className="mt-4 sm:mt-0 mx-auto hover:bg-teal-100/20"
              aria-label="Swap datums"
            >
              <ArrowDownUp className="h-5 w-5" />
            </Button>

            <div className="w-full sm:w-[45%] space-y-1 mt-3 sm:mt-0">
              <Label className="text-sm sm:text-base">Target Datum</Label>
              <Select value={targetDatum} onValueChange={setTargetDatum}>
                <SelectTrigger className="h-10 sm:h-12">
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
          <Tabs defaultValue="decimal">
            <TabsList className="grid grid-cols-3 mb-4 w-full h-10 sm:h-12 bg-teal-50">
              <TabsTrigger value="decimal" className="text-xs sm:text-sm">Decimal°</TabsTrigger>
              <TabsTrigger value="dms" className="text-xs sm:text-sm">DMS</TabsTrigger>
              <TabsTrigger value="utm" className="text-xs sm:text-sm">UTM</TabsTrigger>
            </TabsList>

            {/* Decimal Input */}
            <TabsContent value="decimal" className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Latitude</Label>
                <Input
                  type="number"
                  step="0.000001"
                  placeholder="38.8951"
                  value={decimalDegrees.latitude}
                  onChange={(e) => setDecimalDegrees({ ...decimalDegrees, latitude: e.target.value })}
                  className="h-10 sm:h-12 text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Longitude</Label>
                <Input
                  type="number"
                  step="0.000001"
                  placeholder="-77.0364"
                  value={decimalDegrees.longitude}
                  onChange={(e) => setDecimalDegrees({ ...decimalDegrees, longitude: e.target.value })}
                  className="h-10 sm:h-12 text-sm sm:text-base"
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => resetInputs("decimal")}
                  className="w-full sm:w-auto gap-2 hover:bg-amber-50/20"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="text-sm">Reset Fields</span>
                </Button>
                <Button 
                  onClick={() => handleConvert("decimal")}
                  className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 px-6 sm:px-8"
                >
                  <span className="text-sm sm:text-base">Convert</span>
                </Button>
              </div>
            </TabsContent>

            {/* DMS Input */}
            <TabsContent value="dms" className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Latitude</Label>
                <div className="grid grid-cols-4 gap-2">
                  <Input
                    type="number"
                    placeholder="Deg"
                    value={dms.latDegrees}
                    onChange={(e) => setDms({ ...dms, latDegrees: e.target.value })}
                    className="h-10 sm:h-12 text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="Min"
                    value={dms.latMinutes}
                    onChange={(e) => setDms({ ...dms, latMinutes: e.target.value })}
                    className="h-10 sm:h-12 text-sm"
                  />
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="Sec"
                    value={dms.latSeconds}
                    onChange={(e) => setDms({ ...dms, latSeconds: e.target.value })}
                    className="h-10 sm:h-12 text-sm"
                  />
                  <Select 
                    value={dms.latDirection} 
                    onValueChange={(v) => setDms({ ...dms, latDirection: v })}
                    className="h-10 sm:h-12 [&>button]:text-sm"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N" className="text-sm">North</SelectItem>
                      <SelectItem value="S" className="text-sm">South</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Longitude</Label>
                <div className="grid grid-cols-4 gap-2">
                  <Input
                    type="number"
                    placeholder="Deg"
                    value={dms.longDegrees}
                    onChange={(e) => setDms({ ...dms, longDegrees: e.target.value })}
                    className="h-10 sm:h-12 text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="Min"
                    value={dms.longMinutes}
                    onChange={(e) => setDms({ ...dms, longMinutes: e.target.value })}
                    className="h-10 sm:h-12 text-sm"
                  />
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="Sec"
                    value={dms.longSeconds}
                    onChange={(e) => setDms({ ...dms, longSeconds: e.target.value })}
                    className="h-10 sm:h-12 text-sm"
                  />
                  <Select 
                    value={dms.longDirection} 
                    onValueChange={(v) => setDms({ ...dms, longDirection: v })}
                    className="h-10 sm:h-12 [&>button]:text-sm"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="E" className="text-sm">East</SelectItem>
                      <SelectItem value="W" className="text-sm">West</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => resetInputs("dms")}
                  className="w-full sm:w-auto gap-2 hover:bg-amber-50/20"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="text-sm">Reset Fields</span>
                </Button>
                <Button 
                  onClick={() => handleConvert("dms")}
                  className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 px-6 sm:px-8"
                >
                  <span className="text-sm sm:text-base">Convert</span>
                </Button>
              </div>
            </TabsContent>

            {/* UTM Input */}
            <TabsContent value="utm" className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Easting</Label>
                <Input
                  type="number"
                  placeholder="500000"
                  value={utm.easting}
                  onChange={(e) => setUtm({ ...utm, easting: e.target.value })}
                  className="h-10 sm:h-12 text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Northing</Label>
                <Input
                  type="number"
                  placeholder="4000000"
                  value={utm.northing}
                  onChange={(e) => setUtm({ ...utm, northing: e.target.value })}
                  className="h-10 sm:h-12 text-sm sm:text-base"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">Zone</Label>
                  <Select value={utm.zone} onValueChange={(v) => setUtm({ ...utm, zone: v })}>
                    <SelectTrigger className="h-10 sm:h-12 [&>button]:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] sm:max-h-[300px]">
                      <SelectItem value="37" className="text-sm">37 (Default)</SelectItem>
                      {Array.from({ length: 60 }, (_, i) => i + 1)
                        .filter(zone => zone !== 37)
                        .map(zone => (
                          <SelectItem key={zone} value={zone.toString()} className="text-sm">{zone}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">Hemisphere</Label>
                  <Select value={utm.hemisphere} onValueChange={(v) => setUtm({ ...utm, hemisphere: v })}>
                    <SelectTrigger className="h-10 sm:h-12 [&>button]:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N" className="text-sm">Northern</SelectItem>
                      <SelectItem value="S" className="text-sm">Southern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => resetInputs("utm")}
                  className="w-full sm:w-auto gap-2 hover:bg-amber-50/20"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="text-sm">Reset Fields</span>
                </Button>
                <Button 
                  onClick={() => handleConvert("utm")}
                  className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 px-6 sm:px-8"
                >
                  <span className="text-sm sm:text-base">Convert</span>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        {/* Results Display */}
        {results && (
          <CardFooter className="flex flex-col border-t pt-4 sm:pt-6 px-4 sm:px-6">
            <div className="w-full space-y-3 sm:space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold">Conversion Results ({targetDatum})</h3>

              {/* Results sections with responsive text */}
              {results.decimal && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base font-medium">Decimal Degrees:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(
                        `${results.decimal.latitude.toFixed(6)}, ${results.decimal.longitude.toFixed(6)}`
                      )}
                      className="text-sm"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <div className="bg-teal-50/30 p-3 rounded-lg">
                    <code className="font-mono text-xs sm:text-sm break-all">
                      Lat: {results.decimal.latitude.toFixed(6)}
                      <br />
                      Lon: {results.decimal.longitude.toFixed(6)}
                    </code>
                  </div>
                </div>
              )}

              {/* Other result sections with similar responsive adjustments */}

              {results.decimal && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    className="w-full bg-teal-600/20 hover:bg-teal-700/30 text-sm sm:text-base"
                    onClick={() => window.open(generateGoogleMapsUrl(
                      results.decimal.latitude,
                      results.decimal.longitude
                    ), "_blank")}
                  >
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    View in Google Maps
                  </Button>
                </div>
              )}
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Footer with responsive text */}
      <footer className="mt-8 sm:mt-12 text-center space-y-3 sm:space-y-4">
        <div className={`inline-block bg-black/50 backdrop-blur-lg text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl 
          transition-all duration-700 ease-out transform text-sm sm:text-base ${
            showCredit ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="text-teal-300 mb-1 font-medium">
            Geospatial Engineering Solutions
          </div>
          <div className="text-amber-100">
            Developed by <span className="font-semibold">Eng. Yusuf Mohammednur</span>
          </div>
        </div>

        <div className="text-amber-100 text-xs sm:text-sm space-y-1">
          <p>Advanced Coordinate Transformation System</p>
          <p className="text-amber-200/90">
            Support our cause! Contribute via Telebirr: {' '}
            <span className="font-mono bg-black/25 px-2 py-1 rounded-md">
              0913-373481
            </span>
          </p>
        </div>
      </footer>

      {/* Clipboard Feedback positioning */}
      {copyFeedback && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-teal-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in text-sm sm:text-base">
          Copied to clipboard!
        </div>
      )}

      {/* Global styles remain unchanged */}
    </div>
  )
}
