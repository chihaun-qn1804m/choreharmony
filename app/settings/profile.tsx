import React from 'react';
import { Redirect } from 'expo-router';

export default function SettingsProfileScreen() {
  // Redirect to the profile edit page
  return <Redirect href="/profile/edit" />;
}
