import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON, useMap } from 'react-leaflet';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import CrowdChart from './CrowdChart';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const NEPAL_CENTER = [28.3949, 84.1240];
const ZOOM = 7;

// Nepal bounding box — constrains the map to Nepal only
const NEPAL_BOUNDS = [
  [26.347, 80.058],  // southwest corner
  [30.447, 88.201],  // northeast corner
];

const LEGEND = [
  { label: 'Quiet', color: '#22c55e' },
  { label: 'Moderate', color: '#f59e0b' },
  { label: 'Busy', color: '#f97316' },
  { label: 'Very Crowded', color: '#ef4444' },
];

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 200);
  }, [map]);
  return null;
}

export default function NepalMap({ onHeritageClick, selectedMonth, onMonthChange, heritageSiteIds }) {
  const [crowdData, setCrowdData] = useState([]);
  const [geoData, setGeoData] = useState(null);
  const [showHiddenGems, setShowHiddenGems] = useState(false);
  const [selectedDest, setSelectedDest] = useState(null);
  const [crowdDetail, setCrowdDetail] = useState(null);
  const monthNum = MONTHS.indexOf(selectedMonth) + 1;

  const fetchCrowd = useCallback(async (mn) => {
    try {
      const res = await axios.get(`/api/crowd/all?month=${mn}`);
      setCrowdData(res.data);
    } catch (err) {
      console.error('Failed to fetch crowd data:', err);
    }
  }, []);

  useEffect(() => {
    fetchCrowd(monthNum);
  }, [monthNum, fetchCrowd]);

  useEffect(() => {
    fetch('/nepal-districts.geojson')
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => { if (data) setGeoData(data); })
      .catch(() => {});
  }, []);

  const handleMarkerClick = async (dest) => {
    if (heritageSiteIds && heritageSiteIds.includes(dest.id)) {
      onHeritageClick(dest.id);
      return;
    }

    const heritageMap = { 'KTM': null, 'LMB': 'LMT' };
    if (dest.id in heritageMap && heritageMap[dest.id]) {
      onHeritageClick(heritageMap[dest.id]);
      return;
    }

    setSelectedDest(dest);
    try {
      const res = await axios.get(`/api/crowd/${dest.id}?month=${monthNum}`);
      setCrowdDetail(res.data);
    } catch (err) {
      console.error('Failed to fetch crowd detail:', err);
      setCrowdDetail(null);
    }
  };

  const geoStyle = {
    fillColor: '#1e293b',
    weight: 1,
    color: '#334155',
    fillOpacity: 0.5,
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Month selector */}
      <div className="flex items-center gap-1 px-3 py-2 bg-gray-900/80 backdrop-blur-sm border-b border-white/5 overflow-x-auto">
        {MONTHS.map((m) => (
          <button key={m} onClick={() => onMonthChange(m)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
              selectedMonth === m
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
            }`}>
            {m}
          </button>
        ))}
        <div className="ml-auto flex-shrink-0">
          <button onClick={() => setShowHiddenGems(!showHiddenGems)}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              showHiddenGems
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>
            {showHiddenGems ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            Hidden Gems
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={NEPAL_CENTER}
          zoom={ZOOM}
          minZoom={7}
          maxZoom={13}
          maxBounds={NEPAL_BOUNDS}
          maxBoundsViscosity={1.0}
          className="w-full h-full"
          scrollWheelZoom={true}
        >
          <MapResizer />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {geoData && <GeoJSON data={geoData} style={geoStyle} />}

          {crowdData.map((dest) => {
            const isHidden = dest.hidden_gem;
            const dimmed = showHiddenGems && !isHidden;
            return (
              <CircleMarker
                key={dest.id}
                center={[dest.lat, dest.lng]}
                radius={12}
                pathOptions={{
                  fillColor: dest.color,
                  color: 'rgba(255,255,255,0.3)',
                  weight: 2,
                  fillOpacity: dimmed ? 0.2 : 0.85,
                  opacity: dimmed ? 0.2 : 1,
                }}
                eventHandlers={{ click: () => handleMarkerClick(dest) }}
              >
                <Popup>
                  <div className="text-sm min-w-[200px] max-w-[260px]">
                    <p className="font-bold text-white text-base mb-1">{dest.name}</p>
                    <p>
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold text-white mr-1" style={{ backgroundColor: dest.color }}>{dest.crowd_label}</span>
                      <span className="text-gray-400 text-xs">Score: {typeof dest.crowd_score === 'number' ? dest.crowd_score.toFixed(1) : dest.crowd_score}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1 capitalize">Type: {dest.type}</p>
                    {dest.description && <p className="text-xs text-gray-300 mt-1.5 leading-relaxed line-clamp-3">{dest.description}</p>}
                    {dest.hidden_gem && <p className="text-xs text-purple-400 font-semibold mt-1">Hidden Gem</p>}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/10 p-2.5 z-[1000]">
          <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">Crowd Level</p>
          {LEGEND.map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2 mb-1 last:mb-0">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-300">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Crowd detail chart */}
      {crowdDetail && selectedDest && (
        <div className="border-t border-white/5">
          <CrowdChart data={crowdDetail.monthly_trend} destName={crowdDetail.name} />
        </div>
      )}
    </div>
  );
}
