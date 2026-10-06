import SettingsScreen from "./SettingsScreen";

export const metadata = { title: "Settings" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ as?: string }> }) {
  const { as } = await searchParams;
  return <SettingsScreen guest={as === "guest"} />;
}
