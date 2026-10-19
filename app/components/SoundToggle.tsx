import { useEffect, useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { loadSoundEnabled, setSoundEnabled } from '../../src/audio';

export default function SoundToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    loadSoundEnabled().then(setEnabled);
  }, []);

  const toggle = async () => {
    const next = !enabled;
    setEnabled(next);
    await setSoundEnabled(next);
  };

  return (
    <TouchableOpacity onPress={toggle} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
      <Text style={{ fontSize: 20 }}>{enabled ? '🔊' : '🔇'}</Text>
    </TouchableOpacity>
  );
}
