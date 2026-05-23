import { UserProfile } from '../../services/usersService';

export const fakeUser: UserProfile = {
  user_id: 'user_001',
  email: 'demo@enviroguard.app',
  health: {
    asthma: true,
    copd: false,
    pollen_allergy: true,
    noise_sensitivity: false,
    age_group: '30-40'
  },
  thresholds: {
    aqi: 75,
    noise_db: 65,
    pollen_index: 60
  },
  neighborhoods: [
    {
      label: 'Williamsburg, Brooklyn',
      id: 'williamsburg',
      lat: 40.7081,
      lng: -73.9571
    },
    {
      label: 'Greenpoint, Brooklyn',
      id: 'greenpoint',
      lat: 40.7308,
      lng: -73.9507
    }
  ],
  push_token: null,
  notification_prefs: {
    noise: true,
    air: true,
    litter: true,
    pollen: true,
    general: true,
    quiet_hours: {
      start: '22:00',
      end: '08:00'
    }
  }
};
