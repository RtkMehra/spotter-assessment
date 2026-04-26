from datetime import datetime, timedelta

def round_to_15(minutes):
    return max(15, round(minutes / 15) * 15)

def calculate_hos_trip(distance_miles, duration_hours, current_cycle_used, pickup_addr, dropoff_addr):
    """
    Calculates the trip schedule based on HOS rules with strict 15-minute precision.
    """
    avg_speed = distance_miles / duration_hours if duration_hours > 0 else 55
    total_driving_minutes = int(duration_hours * 60)
    
    events = []
    current_time = 0 # minutes from start (00:00 Day 1)
    
    # 1. Pickup (1 hour ON_DUTY)
    events.append({
        'status': 'ON_DUTY',
        'start_time': current_time,
        'duration': 60,
        'location': pickup_addr.split(',')[0],
        'remark': 'Loading / Pickup'
    })
    current_time += 60
    
    driving_remaining = total_driving_minutes
    shift_driving_time = 0
    shift_on_duty_time = 60 # Already did 1h pickup
    miles_since_fuel = 0
    cycle_remaining = (70 - current_cycle_used) * 60

    # Ensure Day 1 also has a pre-trip before driving starts
    events.append({
        'status': 'ON_DUTY',
        'start_time': current_time,
        'duration': 15,
        'location': pickup_addr.split(',')[0],
        'remark': 'Pre-trip Inspection'
    })
    current_time += 15
    shift_on_duty_time += 15
    cycle_remaining -= 15
    
    while driving_remaining > 0:
        # Pre-trip Inspection (15 mins ON_DUTY)
        if shift_on_duty_time == 0:
            events.append({
                'status': 'ON_DUTY',
                'start_time': current_time,
                'duration': 15,
                'location': 'Rest Area',
                'remark': 'Pre-trip Inspection'
            })
            current_time += 15
            shift_on_duty_time += 15
            cycle_remaining -= 15

        # Fueling check
        if miles_since_fuel >= 1000:
            events.append({
                'status': 'ON_DUTY',
                'start_time': current_time,
                'duration': 30,
                'location': 'Service Station',
                'remark': 'Fueling'
            })
            current_time += 30
            shift_on_duty_time += 30
            cycle_remaining -= 30
            miles_since_fuel = 0
        
        # Calculate limits for this segment
        time_to_11h = (11 * 60) - shift_driving_time
        time_to_14h = (14 * 60) - shift_on_duty_time
        time_to_8h_break = (8 * 60) - (shift_driving_time % (8 * 60) if shift_driving_time >= 8*60 else shift_driving_time)
        
        can_drive_raw = min(driving_remaining, time_to_11h, time_to_14h, time_to_8h_break, cycle_remaining)
        
        # Strictly round to 15 mins for realism, unless it's the very last bit
        if can_drive_raw < driving_remaining:
            can_drive = round_to_15(can_drive_raw)
            # Ensure rounding doesn't exceed limits
            while can_drive > can_drive_raw and can_drive > 15:
                can_drive -= 15
        else:
            can_drive = round_to_15(can_drive_raw)

        if can_drive > 0:
            events.append({
                'status': 'DRIVING',
                'start_time': current_time,
                'duration': can_drive,
                'location': 'En Route',
                'remark': 'Driving'
            })
            current_time += can_drive
            shift_driving_time += can_drive
            shift_on_duty_time += can_drive
            driving_remaining -= can_drive
            cycle_remaining -= can_drive
            miles_since_fuel += (can_drive / 60) * avg_speed
        
        if driving_remaining <= 0:
            # Post-trip Inspection (15 mins ON_DUTY)
            events.append({
                'status': 'ON_DUTY',
                'start_time': current_time,
                'duration': 15,
                'location': dropoff_addr.split(',')[0],
                'remark': 'Post-trip Inspection'
            })
            current_time += 15
            break
            
        # Determine why we stopped
        if cycle_remaining <= 0:
            events.append({
                'status': 'OFF_DUTY',
                'start_time': current_time,
                'duration': 2040, # 34 hours
                'location': 'Rest Area',
                'remark': '34-Hour Restart'
            })
            current_time += 2040
            shift_driving_time = 0
            shift_on_duty_time = 0
            cycle_remaining = 70 * 60
        elif shift_driving_time >= 11 * 60 or shift_on_duty_time >= 13.5 * 60:
            # Post-trip then 10h rest
            events.append({
                'status': 'ON_DUTY',
                'start_time': current_time,
                'duration': 15,
                'location': 'Rest Area',
                'remark': 'Post-trip Inspection'
            })
            current_time += 15
            events.append({
                'status': 'SLEEPER',
                'start_time': current_time,
                'duration': 600, # 10 hours
                'location': 'Rest Area',
                'remark': '10h Sleeper Berth'
            })
            current_time += 600
            shift_driving_time = 0
            shift_on_duty_time = 0
        elif shift_driving_time % (8 * 60) == 0:
            events.append({
                'status': 'OFF_DUTY',
                'start_time': current_time,
                'duration': 30,
                'location': 'Rest Area',
                'remark': '30-min Rest Break'
            })
            current_time += 30
            shift_on_duty_time += 30

    # 2. Drop-off (1 hour ON_DUTY)
    events.append({
        'status': 'ON_DUTY',
        'start_time': current_time,
        'duration': 60,
        'location': dropoff_addr.split(',')[0],
        'remark': 'Unloading / Drop-off'
    })
    current_time += 60
    
    return events
