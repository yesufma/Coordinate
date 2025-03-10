"use client"

import { useEffect, useRef, useState } from "react"

interface CoordinateMapProps {
  latitude: number
  longitude: number
}

export default function CoordinateMap({ latitude, longitude }: CoordinateMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isRendered, setIsRendered] = useState(false)
  const [showCredit, setShowCredit] = useState(false)

  useEffect(() => {
    const renderMap = () => {
      if (!mapRef.current) return

      const mapContainer = mapRef.current

      // Clear previous content
      mapContainer.innerHTML = ""

      // Create a simple placeholder map with coordinates
      const mapPlaceholder = document.createElement("div")
      mapPlaceholder.className = "w-full h-full bg-blue-50 flex flex-col items-center justify-center relative"
      mapPlaceholder.setAttribute("role", "img")
      mapPlaceholder.setAttribute(
        "aria-label",
        `Map showing coordinates: Latitude ${latitude.toFixed(6)}, Longitude ${longitude.toFixed(6)}`,
      )

      // Add grid lines
      for (let i = 1; i < 10; i++) {
        const horizontalLine = document.createElement("div")
        horizontalLine.className = "absolute w-full h-[1px] bg-blue-200"
        horizontalLine.style.top = `${i * 10}%`

        const verticalLine = document.createElement("div")
        verticalLine.className = "absolute h-full w-[1px] bg-blue-200"
        verticalLine.style.left = `${i * 10}%`

        mapPlaceholder.appendChild(horizontalLine)
        mapPlaceholder.appendChild(verticalLine)
      }

      // Add marker at center
      const marker = document.createElement("div")
      marker.className = "absolute text-red-500"
      marker.style.top = "50%"
      marker.style.left = "50%"
      marker.style.transform = "translate(-50%, -50%)"

      const markerIcon = document.createElement("div")
      markerIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`

      marker.appendChild(markerIcon)

      // Add coordinates text
      const coordsText = document.createElement("div")
      coordsText.className = "absolute bottom-2 left-2 bg-white bg-opacity-70 p-2 rounded text-xs"
      coordsText.textContent = `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`

      // Add compass rose
      const compass = document.createElement("div")
      compass.className = "absolute top-2 right-2 bg-white bg-opacity-70 p-2 rounded"
      compass.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="white" stroke="#ccc" />
          <text x="20" y="8" textAnchor="middle" fontSize="8" fontWeight="bold">N</text>
          <text x="32" y="20" textAnchor="middle" fontSize="8" fontWeight="bold">E</text>
          <text x="20" y="34" textAnchor="middle" fontSize="8" fontWeight="bold">S</text>
          <text x="8" y="20" textAnchor="middle" fontSize="8" fontWeight="bold">W</text>
          <path d="M20,20 L20,10" stroke="red" strokeWidth="1.5" />
          <path d="M20,20 L28,20" stroke="black" strokeWidth="1" />
        </svg>
      `

      mapPlaceholder.appendChild(marker)
      mapPlaceholder.appendChild(coordsText)
      mapPlaceholder.appendChild(compass)
      mapContainer.appendChild(mapPlaceholder)

      setIsRendered(true)
      console.log("Map rendered")

      // Show credit after a short delay
      setTimeout(() => {
        setShowCredit(true)
        console.log("Credit should be visible now")
      }, 500)
    }

    renderMap()
  }, [latitude, longitude])

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapRef}
        className="w-full h-full"
        tabIndex={0}
        aria-label={`Map showing location at latitude ${latitude.toFixed(6)}, longitude ${longitude.toFixed(6)}`}
      />
      {!isRendered && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">Loading map...</div>
      )}
      <div
        className={`absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-md text-sm z-10 transition-opacity duration-500 ${
          showCredit ? "opacity-100" : "opacity-0"
        }`}
      >
        Developed by Yusuf Mohammednur
      </div>
    </div>
  )
}

