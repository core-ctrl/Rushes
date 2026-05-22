import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setLocation } from '../store/slices/locationSlice';
import { selectUser } from '../store/slices/authSlice';
import axios from 'axios';

export function useLocation() {
    const dispatch = useDispatch();
    const currentUser = useSelector(selectUser);

    useEffect(() => {
        if (!currentUser) return;
        if (!navigator.geolocation) return;

        // Check location consent first
        const consent = localStorage.getItem('preksha_consent');
        if (consent !== 'location_granted') {
            console.log('Location consent not granted');
            return;
        }

        // Check localStorage first before requesting new location
        const stored = localStorage.getItem('preksha_location');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                const age = Date.now() - parsed.timestamp;
                if (age < 24 * 60 * 60 * 1000) {
                    dispatch(setLocation(parsed));
                    return;
                }
            } catch (e) {
                console.error('Failed to parse stored location', e);
            }
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
                        { headers: { 'Accept-Language': 'en' } }
                    );
                    const data = await res.json();

                    if (!data.address) {
                        console.error('Nominatim API failed - no address data');
                        return;
                    }

                    const location = {
                        lat: latitude,
                        lng: longitude,
                        city: data.address.city || data.address.town || data.address.village || '',
                        district: data.address.county || data.address.state_district || data.address.suburb || '',
                        state: data.address.state || '',
                        country: data.address.country || '',
                        countryCode: data.address.country_code?.toUpperCase() || 'IN',
                        pincode: data.address.postcode || '',
                        timestamp: Date.now(),
                    };

                    localStorage.setItem('preksha_location', JSON.stringify(location));
                    dispatch(setLocation(location));

                    await axios.post('/api/user/update-location', { location });
                } catch (e) {
                    console.error('Reverse geocode failed', e);
                }
            },
            (error) => {
                console.log('Location denied:', error.message);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, [currentUser, dispatch]);
}
