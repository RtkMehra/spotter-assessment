import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .hos_logic import calculate_hos_trip

class PlanTripView(APIView):
    def post(self, request):
        current_loc = request.data.get('current_location')
        pickup_loc = request.data.get('pickup_location')
        dropoff_loc = request.data.get('dropoff_location')
        cycle_used = float(request.data.get('cycle_used', 0))

        try:
            # 1. Geocode locations
            locs = {}
            for name, address in [('current', current_loc), ('pickup', pickup_loc), ('dropoff', dropoff_loc)]:
                res = requests.get(f"https://nominatim.openstreetmap.org/search?q={address}&format=json&limit=1", headers={'User-Agent': 'SpotterTripPlanner/1.0'})
                if res.status_code == 200 and res.json():
                    data = res.json()[0]
                    locs[name] = {'lat': float(data['lat']), 'lon': float(data['lon']), 'display_name': data['display_name']}
                else:
                    return Response({'error': f'Could not geocode {address}'}, status=status.HTTP_400_BAD_REQUEST)

            # 2. Get route from OSRM
            # Route: Current -> Pickup -> Dropoff
            coords = f"{locs['current']['lon']},{locs['current']['lat']};{locs['pickup']['lon']},{locs['pickup']['lat']};{locs['dropoff']['lon']},{locs['dropoff']['lat']}"
            route_res = requests.get(f"https://router.project-osrm.org/route/v1/driving/{coords}?overview=full&geometries=geojson&steps=true")
            
            if route_res.status_code != 200:
                return Response({'error': 'Could not calculate route'}, status=status.HTTP_400_BAD_REQUEST)
            
            route_data = route_res.json()
            route = route_data['routes'][0]
            distance_meters = route['distance']
            duration_seconds = route['duration']
            geometry = route['geometry']
            
            # Extract instructions
            instructions = []
            for leg in route.get('legs', []):
                for step in leg.get('steps', []):
                    maneuver = step.get('maneuver', {})
                    if maneuver.get('instruction'):
                        instructions.append(maneuver['instruction'])
                    else:
                        m_type = maneuver.get('type', 'drive').replace('_', ' ')
                        m_mod = maneuver.get('modifier', '').replace('_', ' ')
                        instructions.append(f"{m_type.capitalize()} {m_mod}")

            distance_miles = distance_meters * 0.000621371
            duration_hours = duration_seconds / 3600

            # 3. Calculate HOS events
            events = calculate_hos_trip(distance_miles, duration_hours, cycle_used, locs['pickup']['display_name'], locs['dropoff']['display_name'])

            # Add coordinates to events for map markers
            coords_list = geometry['coordinates']
            for event in events:
                if event['remark'] in ['10h Sleeper Berth', '30-min Rest Break', 'Fueling', '34-Hour Restart', '10h Rest']:
                    # Estimate coordinate based on time progress through driving segments
                    progress = min(1.0, event['start_time'] / (duration_hours * 60) if duration_hours > 0 else 0)
                    coord_idx = int(progress * (len(coords_list) - 1))
                    event['coords'] = coords_list[coord_idx]

            # 4. Format for frontend
            return Response({
                'route': {
                    'geometry': geometry,
                    'distance_miles': distance_miles,
                    'duration_hours': duration_hours,
                    'locations': locs,
                    'instructions': instructions[:20]
                },
                'hos_events': events
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
