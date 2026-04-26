import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck, MapPin, Clock, Fuel, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Fix Leaflet marker icons
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const RecenterMap = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      const bounds = L.latLngBounds(coords.map(c => [c[1], c[0]]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coords, map]);
  return null;
};

const ELDLog = ({ events, dayIndex }) => {
  const dayMinutesStart = dayIndex * 24 * 60;
  const dayMinutesEnd = (dayIndex + 1) * 24 * 60;
  
  const dayEvents = events.filter(e => 
    (e.start_time >= dayMinutesStart && e.start_time < dayMinutesEnd) ||
    (e.start_time + e.duration > dayMinutesStart && e.start_time + e.duration <= dayMinutesEnd) ||
    (e.start_time < dayMinutesStart && e.start_time + e.duration > dayMinutesEnd)
  ).map(e => {
    const start = Math.max(e.start_time, dayMinutesStart);
    const end = Math.min(e.start_time + e.duration, dayMinutesEnd);
    return { ...e, day_start: start - dayMinutesStart, day_duration: end - start };
  });

  const getRowIndex = (status) => {
    switch(status) {
      case 'OFF_DUTY': return 0;
      case 'SLEEPER': return 1;
      case 'DRIVING': return 2;
      case 'ON_DUTY': return 3;
      default: return 0;
    }
  };

  const totals = {
    OFF_DUTY: 0,
    SLEEPER: 0,
    DRIVING: 0,
    ON_DUTY: 0
  };
  dayEvents.forEach(e => { totals[e.status] += e.day_duration; });

  return (
    <div className="card glass" style={{ padding: '1.5rem', marginTop: '2rem', border: '1px solid rgba(255,255,255,0.2)', position: 'relative', overflow: 'hidden' }}>
      {/* Log Header - Professional Paper Style */}
      <div style={{ borderBottom: '2px solid #444', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Drivers Daily Log</h2>
            <div style={{ fontSize: '0.7rem', color: '#666' }}>(24 HOURS)</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Date: <span style={{ borderBottom: '1px solid #555', padding: '0 10px' }}>{new Date(Date.now() + dayIndex * 86400000).toLocaleDateString()}</span></div>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem', fontSize: '0.75rem' }}>
          <div>
            <label style={{ color: '#666', display: 'block', fontSize: '0.6rem', textTransform: 'uppercase' }}>Carrier</label>
            <div style={{ borderBottom: '1px solid #333', padding: '2px 0', color: 'white' }}>{result.carrier || 'N/A'}</div>
          </div>
          <div>
            <label style={{ color: '#666', display: 'block', fontSize: '0.6rem', textTransform: 'uppercase' }}>Truck / Tractor No.</label>
            <div style={{ borderBottom: '1px solid #333', padding: '2px 0', color: 'white' }}>{result.vehicle || 'N/A'}</div>
          </div>
          <div>
            <label style={{ color: '#666', display: 'block', fontSize: '0.6rem', textTransform: 'uppercase' }}>Main Office Address</label>
            <div style={{ borderBottom: '1px solid #333', padding: '2px 0', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{result.route.locations.pickup.display_name}</div>
          </div>
        </div>
      </div>
      
      <div className="log-grid" style={{ height: '201px', width: '100%', position: 'relative', background: '#111', border: '1px solid #444', marginBottom: '1.5rem' }}>
        {/* Hour markings and grid lines */}
        {[...Array(25)].map((_, i) => (
          <React.Fragment key={i}>
            <div className="log-hour-line" style={{ left: `${(i / 24) * 100}%`, borderLeft: i % 1 === 0 ? '2px solid #222' : '1px solid #1a1a1a' }}>
              <span className="log-hour-label" style={{ top: '-22px', fontSize: '9px', fontWeight: 600 }}>{i === 0 || i === 24 ? 'M' : i === 12 ? 'N' : i}</span>
            </div>
            {i < 24 && (
              <>
                <div className="log-hour-line" style={{ left: `${((i + 0.25) / 24) * 100}%`, borderLeft: '1px solid #1a1a1a', height: '8px' }} />
                <div className="log-hour-line" style={{ left: `${((i + 0.5) / 24) * 100}%`, borderLeft: '1px solid #1a1a1a', height: '15px' }} />
                <div className="log-hour-line" style={{ left: `${((i + 0.75) / 24) * 100}%`, borderLeft: '1px solid #1a1a1a', height: '8px' }} />
              </>
            )}
          </React.Fragment>
        ))}
        
        {/* Rows with labels */}
        <div style={{ display: 'grid', gridTemplateRows: 'repeat(4, 50px)', width: '100%', position: 'relative', zIndex: 1 }}>
          {['OFF DUTY', 'SLEEPER', 'DRIVING', 'ON DUTY'].map((label, idx) => (
            <div key={idx} style={{ 
              borderBottom: idx < 3 ? '1px solid #222' : 'none', 
              height: '50px',
              display: 'flex', 
              alignItems: 'center', 
              paddingLeft: '12px', 
              fontSize: '10px', 
              color: '#555', 
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {idx + 1}. {label}
            </div>
          ))}
        </div>
        
        {/* Status Line Drawing */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '200px', pointerEvents: 'none', zIndex: 2 }}>
          {dayEvents.map((e, i) => {
            const x = (e.day_start / (24 * 60)) * 100;
            const width = (e.day_duration / (24 * 60)) * 100;
            const y = getRowIndex(e.status) * 50 + 25;
            
            return (
              <React.Fragment key={i}>
                <line 
                  x1={`${x}%`} y1={y} x2={`${x + width}%`} y2={y} 
                  stroke="#3b82f6" strokeWidth="4" strokeLinecap="round"
                />
                {i < dayEvents.length - 1 && (
                   <line 
                    x1={`${x + width}%`} y1={y} 
                    x2={`${x + width}%`} y2={getRowIndex(dayEvents[i+1].status) * 50 + 25} 
                    stroke="#3b82f6" strokeWidth="2" 
                  />
                )}
              </React.Fragment>
            );
          })}
        </svg>
      </div>

      {/* Recap & Remarks Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h5 style={{ margin: '0 0 0.8rem 0', color: '#888' }}>Total Hours</h5>
          {Object.entries(totals).map(([status, mins]) => (
            <div key={status} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
              <span>{status.replace('_', ' ')}</span>
              <span style={{ color: 'white', fontWeight: 600 }}>{(mins / 60).toFixed(2)}h</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #333', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
            <span>Total</span>
            <span>24.00h</span>
          </div>
        </div>

        <div>
          <h5 style={{ margin: '0 0 0.8rem 0', color: '#888' }}>Remarks & Locations</h5>
          <div style={{ maxHeight: '140px', overflowY: 'auto', fontSize: '0.75rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: '#555', borderBottom: '1px solid #333', textAlign: 'left' }}>
                  <th style={{ padding: '4px' }}>Time</th>
                  <th style={{ padding: '4px' }}>Status</th>
                  <th style={{ padding: '4px' }}>Location / Remark</th>
                </tr>
              </thead>
              <tbody>
                {dayEvents.map((e, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '4px' }}>{Math.floor(e.day_start / 60).toString().padStart(2, '0')}:{(e.day_start % 60).toString().padStart(2, '0')}</td>
                    <td style={{ padding: '4px', color: '#3b82f6' }}>{e.status}</td>
                    <td style={{ padding: '4px' }}>{e.location} - {e.remark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed #333', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ fontSize: '0.7rem', color: '#666' }}>
          I certify these entries are true and correct:
          <div style={{ marginTop: '0.5rem', borderBottom: '1px solid #555', width: '200px', height: '20px', fontFamily: '"Dancing Script", cursive', color: '#888', fontSize: '0.9rem' }}>
            {/* Mock signature font or just empty line */}
            Digitally Signed
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <button style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)' }}>Download PDF</button>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [formData, setFormData] = useState({
    current_location: 'Los Angeles, CA',
    pickup_location: 'Phoenix, AZ',
    dropoff_location: 'Dallas, TX',
    cycle_used: '10',
    carrier_name: 'Spotter Logistics',
    vehicle_id: 'TRK-402'
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${apiUrl}/api/plan-trip/`, formData);
      setResult({...response.data, carrier: formData.carrier_name, vehicle: formData.vehicle_id});
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to plan trip');
    } finally {
      setLoading(false);
    }
  };

  const totalDays = result ? Math.ceil((result.hos_events[result.hos_events.length - 1].start_time + result.hos_events[result.hos_events.length - 1].duration) / (24 * 60)) : 0;

  return (
    <div className="app">
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 className="gradient-text" style={{ fontSize: '3rem', margin: 0 }}>Spotter AI</h1>
        <p style={{ color: '#888' }}>Intelligent Trucker Trip Planner & ELD Generator</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="card glass">
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Truck size={20} /> Trip Details
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Carrier Name</label>
                  <input 
                    value={formData.carrier_name} 
                    onChange={e => setFormData({...formData, carrier_name: e.target.value})} 
                    style={{ marginBottom: 0, padding: '0.7rem 1rem' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vehicle ID</label>
                  <input 
                    value={formData.vehicle_id} 
                    onChange={e => setFormData({...formData, vehicle_id: e.target.value})} 
                    style={{ marginBottom: 0, padding: '0.7rem 1rem' }}
                  />
                </div>
              </div>
              
              <div>
                <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Location</label>
                <input 
                  value={formData.current_location} 
                  onChange={e => setFormData({...formData, current_location: e.target.value})} 
                  placeholder="City, State" 
                  style={{ marginBottom: 0 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pickup Location</label>
                <input 
                  value={formData.pickup_location} 
                  onChange={e => setFormData({...formData, pickup_location: e.target.value})} 
                  placeholder="City, State" 
                  style={{ marginBottom: 0 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dropoff Location</label>
                <input 
                  value={formData.dropoff_location} 
                  onChange={e => setFormData({...formData, dropoff_location: e.target.value})} 
                  placeholder="City, State" 
                  style={{ marginBottom: 0 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cycle Hours Used (70h/8d)</label>
                <input 
                  type="number"
                  value={formData.cycle_used} 
                  onChange={e => setFormData({...formData, cycle_used: e.target.value})} 
                  style={{ marginBottom: 0 }}
                />
              </div>
              <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
                {loading ? 'Calculating Route...' : 'Generate Trip Plan'}
              </button>
            </form>
          </div>

          {error && (
            <div className="card glass" style={{ border: '1px solid #ef4444', color: '#ef4444' }}>
              <AlertTriangle size={20} style={{ marginBottom: '0.5rem' }} />
              {error}
            </div>
          )}

          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="card glass">
                <h3 style={{ marginTop: 0 }}>Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                    <div style={{ color: '#888', fontSize: '0.8rem' }}>Total Distance</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{result.route.distance_miles.toFixed(0)} mi</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                    <div style={{ color: '#888', fontSize: '0.8rem' }}>Est. Driving Time</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{result.route.duration_hours.toFixed(1)} hrs</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.9rem', color: '#888' }}>
                  <div>Carrier: <span style={{ color: 'white' }}>{result.carrier}</span></div>
                  <div>Vehicle: <span style={{ color: 'white' }}>{result.vehicle}</span></div>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>Route Instructions</h4>
                  <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '0.8rem', color: '#888', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '8px' }}>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                      {result.route.instructions.map((step, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>{step}</li>
                      ))}
                      {result.route.instructions.length >= 20 && <li>... and more</li>}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="map-container glass">
            <MapContainer center={[37.0902, -95.7129]} zoom={4} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {result && (
                <>
                  <Polyline positions={result.route.geometry.coordinates.map(c => [c[1], c[0]])} color="#3b82f6" weight={4} />
                  <Marker position={[result.route.locations.current.lat, result.route.locations.current.lon]}>
                    <Popup>Current Location</Popup>
                  </Marker>
                  <Marker position={[result.route.locations.pickup.lat, result.route.locations.pickup.lon]}>
                    <Popup>Pickup: {result.route.locations.pickup.display_name}</Popup>
                  </Marker>
                  <Marker position={[result.route.locations.dropoff.lat, result.route.locations.dropoff.lon]}>
                    <Popup>Dropoff: {result.route.locations.dropoff.display_name}</Popup>
                  </Marker>
                  
                  {result.hos_events.map((event, idx) => event.coords && (
                    <Marker 
                      key={`rest-${idx}`} 
                      position={[event.coords[1], event.coords[0]]}
                    >
                      <Popup>
                        <div style={{ color: 'black' }}>
                          <strong>{event.remark}</strong><br/>
                          Time: {Math.floor(event.start_time / 60).toString().padStart(2, '0')}:{(event.start_time % 60).toString().padStart(2, '0')}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  
                  <RecenterMap coords={result.route.geometry.coordinates} />
                </>
              )}
            </MapContainer>
          </div>

          {result && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} /> Electronic Daily Logs
              </h3>
              <AnimatePresence>
                {[...Array(totalDays)].map((_, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <ELDLog events={result.hos_events} dayIndex={i} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default App;
