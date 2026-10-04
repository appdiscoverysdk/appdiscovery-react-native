import React, { useEffect, useState } from "react";
import { Button, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";
import { AppDiscovery, AppDiscoveryReward } from "appdiscovery-react-native";

// Replace with the values from your dashboard. The host is required:
// it is the host of YOUR offerwall, there is no default.
const HOST = "offers.example.com";
const APP_ID = "YOUR_APP_ID";
const SDK_KEY = "YOUR_SDK_KEY";

export default function App() {
  const [playerId, setPlayerId] = useState("player_123");
  const [log, setLog] = useState<string[]>([]);
  const add = (line: string) => setLog((previous) => [line, ...previous]);

  useEffect(() => {
    const offReward = AppDiscovery.onReward((reward: AppDiscoveryReward) =>
      add(`Reward ${reward.amount} (txid ${reward.txid}, ${reward.status})`)
    );
    const offClose = AppDiscovery.onClose(() => add("Offerwall closed"));
    return () => {
      offReward();
      offClose();
    };
  }, []);

  const show = async () => {
    try {
      await AppDiscovery.init({ host: HOST, appId: APP_ID, sdkKey: SDK_KEY, playerId });
      const shown = await AppDiscovery.showOfferwall();
      add(shown ? "Offerwall shown" : "Offerwall could not be shown");
    } catch (e) {
      add(`Invalid setting: ${(e as Error).message}`);
    }
  };

  const sync = async () => {
    const rewards = await AppDiscovery.syncPendingRewards();
    add(`Pending rewards: ${rewards.length}`);
  };

  return (
    <SafeAreaView>
      <View style={{ padding: 16 }}>
        <TextInput value={playerId} onChangeText={setPlayerId} placeholder="Player ID" />
        <Button title="Show offerwall" onPress={show} />
        <Button title="Sync pending rewards" onPress={sync} />
        <ScrollView>
          {log.map((line, i) => (
            <Text key={i}>{line}</Text>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
